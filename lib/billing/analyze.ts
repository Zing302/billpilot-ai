import { BillAnalysisResult, BillFinding, BillLineItem, billAnalysisResultSchema } from "@/lib/schemas/billpilot";

function createFinding(partial: Omit<BillFinding, "id">, index: number): BillFinding {
  return {
    id: `finding-${index + 1}`,
    ...partial,
  };
}

function normalizeDescription(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function varianceRatio(item: BillLineItem): number {
  if (!item.allowedAmount || item.billedAmount === 0) return 0;
  return (item.billedAmount - item.allowedAmount) / item.billedAmount;
}

export function analyzeBill(lineItems: BillLineItem[], statedTotal?: number | null): BillAnalysisResult {
  const findings: BillFinding[] = [];

  lineItems.forEach((item, index) => {
    const description = normalizeDescription(item.description);
    const duplicates = lineItems.filter(
      (candidate) =>
        candidate.id !== item.id &&
        normalizeDescription(candidate.description) === description &&
        candidate.billedAmount === item.billedAmount &&
        candidate.serviceDate === item.serviceDate,
    );

    if (duplicates.length) {
      findings.push(
        createFinding(
          {
            severity: "high",
            type: "duplicate",
            headline: `Possible duplicate charge: ${item.description}`,
            explanation: "This line appears more than once with the same amount and service date.",
            evidence: [`Repeated amount $${item.billedAmount.toFixed(2)}`, `Matched service date ${item.serviceDate ?? "unknown"}`],
            affectedLineItemIds: [item.id, ...duplicates.map((entry) => entry.id)],
          },
          findings.length,
        ),
      );
    }

    const ratio = varianceRatio(item);
    if (ratio >= 0.55) {
      findings.push(
        createFinding(
          {
            severity: ratio >= 0.65 ? "high" : "medium",
            type: "variance",
            headline: `High benchmark variance on ${item.description}`,
            explanation: "The billed amount is substantially above the benchmarked allowed amount.",
            evidence: [`Billed $${item.billedAmount.toFixed(2)}`, `Allowed $${(item.allowedAmount ?? 0).toFixed(2)}`],
            affectedLineItemIds: [item.id],
          },
          findings.length,
        ),
      );
    }

    if (item.description.toLowerCase().includes("facility fee") && item.billedAmount >= 1500) {
      findings.push(
        createFinding(
          {
            severity: "high",
            type: "facility_fee",
            headline: "Facility fee deserves manual review",
            explanation: "High facility fees often warrant itemization and setting-level justification.",
            evidence: [`Facility fee billed at $${item.billedAmount.toFixed(2)}`],
            affectedLineItemIds: [item.id],
          },
          findings.length,
        ),
      );
    }

    if (item.confidence < 0.7 || item.description.length < 8) {
      findings.push(
        createFinding(
          {
            severity: "review",
            type: "ambiguity",
            headline: `Low-confidence line item: ${item.description || "Unnamed item"}`,
            explanation: "This charge needs manual confirmation before a dispute is sent.",
            evidence: [`Parser confidence ${item.confidence.toFixed(2)}`],
            affectedLineItemIds: [item.id],
          },
          findings.length,
        ),
      );
    }
  });

  const groupedByDate = new Map<string, BillLineItem[]>();
  lineItems.forEach((item) => {
    if (!item.serviceDate) return;
    groupedByDate.set(item.serviceDate, [...(groupedByDate.get(item.serviceDate) ?? []), item]);
  });

  groupedByDate.forEach((itemsOnDate) => {
    const hydration = itemsOnDate.find((item) => normalizeDescription(item.description).includes("hydration"));
    const duplicateEval = itemsOnDate.filter((item) => normalizeDescription(item.description).includes("evaluation"));
    if (hydration && duplicateEval.length > 1) {
      findings.push(
        createFinding(
          {
            severity: "medium",
            type: "date_overlap",
            headline: "Overlapping same-day services may need coding review",
            explanation: "Multiple evaluation-style charges on one date can indicate overlap or documentation issues.",
            evidence: [`Found ${duplicateEval.length} evaluation charges alongside hydration on ${hydration.serviceDate}`],
            affectedLineItemIds: [hydration.id, ...duplicateEval.map((item) => item.id)],
          },
          findings.length,
        ),
      );
    }
  });

  const billedTotal = Number(lineItems.reduce((sum, item) => sum + item.billedAmount, 0).toFixed(2));
  const allowedTotal = Number(lineItems.reduce((sum, item) => sum + (item.allowedAmount ?? 0), 0).toFixed(2));
  const disputeOpportunity = Number(Math.max(billedTotal - allowedTotal, 0).toFixed(2));

  if (typeof statedTotal === "number" && Math.abs(statedTotal - billedTotal) > 0.01) {
    findings.push(
      createFinding(
        {
          severity: "medium",
          type: "total_mismatch",
          headline: "Bill total does not match summed line items",
          explanation: "The declared total differs from the line-item total and should be reconciled before payment.",
          evidence: [`Stated total $${statedTotal.toFixed(2)}`, `Line-item total $${billedTotal.toFixed(2)}`],
          affectedLineItemIds: lineItems.map((item) => item.id),
        },
        findings.length,
      ),
    );
  }

  const actionPlan = [
    "Review high-severity findings and correct any low-confidence line items before disputing.",
    "Request CPT-level justification and an updated itemized statement from the provider.",
    "Escalate benchmark variance findings to the insurer if the provider cannot justify the spread.",
  ];

  const summary =
    findings.length === 0
      ? "This bill looks relatively clean against the current benchmark rules."
      : `We found ${findings.length} review items, with the strongest savings opportunity coming from duplicate or high-variance charges.`;

  return billAnalysisResultSchema.parse({
    summary,
    totals: {
      billedTotal,
      allowedTotal,
      statedTotal: statedTotal ?? null,
      disputeOpportunity,
    },
    findings,
    actionPlan,
    estimatedOpportunity: disputeOpportunity,
    normalizedLineItems: lineItems,
  });
}
