import { cleanBillText, seededBillText, seededCsv } from "@/data/demo-fixtures";
import { analyzeBill } from "@/lib/billing/analyze";
import { parseBillInput } from "@/lib/billing/parse";
import { describe, expect, it } from "vitest";

describe("bill parsing", () => {
  it("parses pipe-delimited rows into normalized line items", () => {
    const result = parseBillInput({ rawText: cleanBillText });
    expect(result.lineItems).toHaveLength(2);
    expect(result.lineItems[0]?.description).toBe("Primary Care Visit");
    expect(result.totals.billedTotal).toBe(134);
  });

  it("parses csv rows with headers", () => {
    const result = parseBillInput({ fileName: "bill.csv", fileContent: seededCsv });
    expect(result.sourceType).toBe("csv");
    expect(result.lineItems[1]?.allowedAmount).toBe(14);
  });

  it("extracts amounts and dates from messy text", () => {
    const result = parseBillInput({
      rawText: "Austin Medical Center\nER Facility Fee $2150.00 Allowed $980.00 2026-02-10",
    });
    expect(result.providerName).toBe("Austin Medical Center");
    expect(result.lineItems[0]?.serviceDate).toBe("2026-02-10");
  });

  it("marks malformed rows as uncertain instead of silently dropping all confidence", () => {
    const result = parseBillInput({
      rawText: "Mystery Charge $125.00\nShort $42",
    });
    expect(result.lineItems).toHaveLength(2);
    expect(result.uncertainFields.length).toBeGreaterThan(0);
    expect(result.extractionConfidence).toBeLessThan(0.9);
  });
});

describe("bill analysis", () => {
  it("flags duplicates and variance findings", () => {
    const parsed = parseBillInput({ rawText: seededBillText });
    const result = analyzeBill(parsed.lineItems);
    expect(result.findings.some((finding) => finding.type === "duplicate")).toBe(true);
    expect(result.findings.some((finding) => finding.type === "variance")).toBe(true);
  });

  it("flags facility fee outliers and total mismatches", () => {
    const parsed = parseBillInput({ rawText: seededBillText });
    const result = analyzeBill(parsed.lineItems, 9999);
    expect(result.findings.some((finding) => finding.type === "facility_fee")).toBe(true);
    expect(result.findings.some((finding) => finding.type === "total_mismatch")).toBe(true);
  });

  it("keeps clean bills mostly clean", () => {
    const parsed = parseBillInput({ rawText: cleanBillText });
    const result = analyzeBill(parsed.lineItems, parsed.totals.billedTotal);
    expect(result.findings.some((finding) => finding.severity === "high")).toBe(false);
    expect(result.estimatedOpportunity).toBe(28);
  });
});
