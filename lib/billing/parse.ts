import {
  BillLineItem,
  BillParseResult,
  billParseResultSchema,
  lineItemSchema,
} from "@/lib/schemas/billpilot";

const amountPattern = /\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/g;
const datePattern = /\b(20\d{2}-\d{2}-\d{2})\b/;

type ParseSource = {
  rawText?: string;
  fileName?: string;
  fileContent?: string;
  mimeType?: string;
  normalizedLineItems?: BillLineItem[];
};

function normalizeCategory(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes("facility")) return "Facility";
  if (lower.includes("mri") || lower.includes("x-ray") || lower.includes("imaging")) return "Imaging";
  if (lower.includes("lab") || lower.includes("metabolic") || lower.includes("a1c")) return "Lab";
  if (lower.includes("therapy")) return "Therapy";
  if (lower.includes("surgery")) return "Procedure";
  return "Evaluation";
}

function safeNumber(value: string | undefined): number | null {
  if (!value) return null;
  const normalized = value.replace(/[$,\s]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildLineItem(
  index: number,
  description: string,
  billedAmount: number,
  allowedAmount: number | null,
  serviceDate: string | null,
  confidence: number,
): BillLineItem {
  return lineItemSchema.parse({
    id: `line-${index + 1}`,
    description,
    billedAmount,
    allowedAmount,
    serviceDate,
    quantity: null,
    normalizedCategory: normalizeCategory(description),
    confidence,
  });
}

function parsePipeLine(line: string, index: number): BillLineItem | null {
  const [descriptionRaw, billedRaw, allowedRaw, dateRaw] = line.split("|").map((part) => part.trim());
  if (!descriptionRaw || !billedRaw) return null;
  const billedAmount = safeNumber(billedRaw);
  if (billedAmount == null) return null;
  const allowedAmount = safeNumber(allowedRaw);
  const serviceDate = dateRaw || null;
  const confidence = allowedAmount == null || !serviceDate ? 0.7 : 0.97;
  return buildLineItem(index, descriptionRaw, billedAmount, allowedAmount, serviceDate, confidence);
}

function parseCsv(rawText: string): BillLineItem[] {
  const rows = rawText.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
  const [, ...dataRows] = rows;
  return dataRows
    .map((row, index) => {
      const [description, billed, allowed, date] = row.split(",").map((part) => part.trim());
      if (!description || !billed) return null;
      const billedAmount = safeNumber(billed);
      if (billedAmount == null) return null;
      return buildLineItem(index, description, billedAmount, safeNumber(allowed), date || null, 0.96);
    })
    .filter((item): item is BillLineItem => Boolean(item));
}

function parseMessyText(rawText: string): BillLineItem[] {
  const rows = rawText.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
  const items: BillLineItem[] = [];
  rows.forEach((row, index) => {
    const amounts = [...row.matchAll(amountPattern)].map((match) => safeNumber(match[1])).filter((v): v is number => v != null);
    if (!amounts.length) return;
    const dateMatch = row.match(datePattern);
    const description = row
      .replace(amountPattern, "")
      .replace(datePattern, "")
      .replace(/\s{2,}/g, " ")
      .trim()
      .replace(/[-:]\s*$/, "");
    if (!description) return;
    items.push(
      buildLineItem(index, description, amounts[0], amounts[1] ?? null, dateMatch?.[1] ?? null, amounts[1] ? 0.8 : 0.64),
    );
  });
  return items;
}

function detectProviderName(text: string): string | null {
  const match = text.match(/([A-Z][A-Za-z&\s]+(?:Clinic|Hospital|Medical Center|Urgent Care))/);
  return match?.[1]?.trim() ?? null;
}

function inferSourceType(input: ParseSource): BillParseResult["sourceType"] {
  const extension = input.fileName?.split(".").pop()?.toLowerCase();
  if (input.normalizedLineItems?.length) return "normalized";
  if (extension === "csv") return "csv";
  if (extension === "pdf" || input.mimeType === "application/pdf") return "pdf";
  if (input.fileName) return "textFile";
  return "rawText";
}

export function parseBillInput(input: ParseSource): BillParseResult {
  if (input.normalizedLineItems?.length) {
    return billParseResultSchema.parse({
      sourceType: "normalized",
      providerName: null,
      serviceDates: [...new Set(input.normalizedLineItems.map((item) => item.serviceDate).filter(Boolean))],
      lineItems: input.normalizedLineItems,
      extractionConfidence: 1,
      uncertainFields: [],
      totals: {
        billedTotal: input.normalizedLineItems.reduce((sum, item) => sum + item.billedAmount, 0),
        allowedTotal: input.normalizedLineItems.reduce((sum, item) => sum + (item.allowedAmount ?? 0), 0),
        statedTotal: null,
      },
    });
  }

  const sourceType = inferSourceType(input);
  if (sourceType === "pdf") {
    throw new Error("PDF upload is not supported yet. Upload a TXT or CSV file, or paste the bill text directly.");
  }
  const rawText = (input.rawText ?? input.fileContent ?? "").trim();
  if (!rawText) {
    throw new Error("Bill input is empty.");
  }

  let lineItems: BillLineItem[] = [];
  if (sourceType === "csv") {
    lineItems = parseCsv(rawText);
  } else if (rawText.includes("|")) {
    lineItems = rawText
      .split(/\r?\n/)
      .map((line, index) => parsePipeLine(line.trim(), index))
      .filter((item): item is BillLineItem => Boolean(item));
  } else {
    lineItems = parseMessyText(rawText);
  }

  const uncertainFields = lineItems.flatMap((item) => {
    const fields = [];
    if (!item.allowedAmount) {
      fields.push({
        lineItemId: item.id,
        field: "allowedAmount" as const,
        reason: "Allowed amount missing, so savings estimates may be conservative.",
      });
    }
    if (!item.serviceDate) {
      fields.push({
        lineItemId: item.id,
        field: "serviceDate" as const,
        reason: "Service date missing, which limits duplicate-date analysis.",
      });
    }
    if (item.description.length < 6) {
      fields.push({
        lineItemId: item.id,
        field: "description" as const,
        reason: "Description is too short for confident categorization.",
      });
    }
    return fields;
  });

  const extractionConfidence =
    lineItems.length === 0
      ? 0.1
      : Number(
          (
            lineItems.reduce((sum, item) => sum + item.confidence, 0) /
            Math.max(lineItems.length, 1)
          ).toFixed(2),
        );

  return billParseResultSchema.parse({
    sourceType,
    providerName: detectProviderName(rawText),
    serviceDates: [...new Set(lineItems.map((item) => item.serviceDate).filter(Boolean))],
    lineItems,
    extractionConfidence,
    uncertainFields,
    totals: {
      billedTotal: Number(lineItems.reduce((sum, item) => sum + item.billedAmount, 0).toFixed(2)),
      allowedTotal: Number(lineItems.reduce((sum, item) => sum + (item.allowedAmount ?? 0), 0).toFixed(2)),
      statedTotal: null,
    },
  });
}
