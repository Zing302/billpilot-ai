import { cleanBillText, seededBillText, seededCsv } from "@/data/demo-fixtures";
import { POST as analyzeBillPost } from "@/app/api/analyze-bill/route";
import { POST as generateDisputePost } from "@/app/api/generate-dispute/route";
import { POST as parseBillPost } from "@/app/api/parse-bill/route";
import { POST as treatmentExplorerPost } from "@/app/api/treatment-explorer/route";
import { parseBillInput } from "@/lib/billing/parse";
import { describe, expect, it } from "vitest";

async function readJson(response: Response) {
  return response.json();
}

describe("route handlers", () => {
  it("parse-bill accepts raw text", async () => {
    const response = await parseBillPost(
      new Request("http://localhost/api/parse-bill", {
        method: "POST",
        body: JSON.stringify({ rawText: cleanBillText }),
      }),
    );
    expect(response.status).toBe(200);
    const payload = await readJson(response);
    expect(payload.lineItems).toHaveLength(2);
  });

  it("parse-bill accepts csv", async () => {
    const response = await parseBillPost(
      new Request("http://localhost/api/parse-bill", {
        method: "POST",
        body: JSON.stringify({ fileName: "bill.csv", fileContent: seededCsv }),
      }),
    );
    const payload = await readJson(response);
    expect(payload.sourceType).toBe("csv");
  });

  it("parse-bill rejects pdf uploads until text extraction exists", async () => {
    const response = await parseBillPost(
      new Request("http://localhost/api/parse-bill", {
        method: "POST",
        body: JSON.stringify({ fileName: "bill.pdf", fileContent: "fake pdf body", mimeType: "application/pdf" }),
      }),
    );
    expect(response.status).toBe(400);
    expect((await readJson(response)).error).toContain("PDF upload is not supported yet");
  });

  it("parse-bill rejects empty payloads", async () => {
    const response = await parseBillPost(
      new Request("http://localhost/api/parse-bill", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("analyze-bill returns findings for seeded problematic input", async () => {
    const parsed = parseBillInput({ rawText: seededBillText });
    const response = await analyzeBillPost(
      new Request("http://localhost/api/analyze-bill", {
        method: "POST",
        body: JSON.stringify({ lineItems: parsed.lineItems }),
      }),
    );
    const payload = await readJson(response);
    expect(payload.findings.length).toBeGreaterThan(0);
  });

  it("analyze-bill rejects missing line items", async () => {
    const response = await analyzeBillPost(
      new Request("http://localhost/api/analyze-bill", {
        method: "POST",
        body: JSON.stringify({ lineItems: [] }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("generate-dispute creates both draft variants", async () => {
    const parsed = parseBillInput({ rawText: seededBillText });
    const analysis = await analyzeBillPost(
      new Request("http://localhost/api/analyze-bill", {
        method: "POST",
        body: JSON.stringify({ lineItems: parsed.lineItems }),
      }),
    );
    const analysisPayload = await readJson(analysis);
    const response = await generateDisputePost(
      new Request("http://localhost/api/generate-dispute", {
        method: "POST",
        body: JSON.stringify({ findings: analysisPayload.findings, lineItems: parsed.lineItems }),
      }),
    );
    const payload = await readJson(response);
    expect(payload.providerDraft).toContain("Billing Department");
    expect(payload.insurerDraft).toContain("Claims Review Team");
  });

  it("treatment-explorer returns typed supported and unsupported payloads", async () => {
    const supported = await treatmentExplorerPost(
      new Request("http://localhost/api/treatment-explorer", {
        method: "POST",
        body: JSON.stringify({ condition: "Type 1 Diabetes", zipCode: "76092" }),
      }),
    );
    const unsupported = await treatmentExplorerPost(
      new Request("http://localhost/api/treatment-explorer", {
        method: "POST",
        body: JSON.stringify({ condition: "Rare zebra syndrome" }),
      }),
    );
    const supportedPayload = await readJson(supported);
    expect(supportedPayload.supported).toBe(true);
    expect(supportedPayload.localContext.locationLabel).toContain("Arlington");
    expect(supportedPayload.treatmentSettings[0].plans).toHaveLength(6);
    expect((await readJson(unsupported)).supported).toBe(false);
  });

  it("treatment-explorer supports newly added launch-set conditions", async () => {
    const response = await treatmentExplorerPost(
      new Request("http://localhost/api/treatment-explorer", {
        method: "POST",
        body: JSON.stringify({ condition: "Asthma Follow-up", zipCode: "98101" }),
      }),
    );
    const payload = await readJson(response);
    expect(payload.supported).toBe(true);
    expect(payload.condition).toBe("Asthma Follow-up");
    expect(payload.localContext.locationLabel).toContain("Seattle");
  });

  it("treatment-explorer normalizes zip+4 input", async () => {
    const response = await treatmentExplorerPost(
      new Request("http://localhost/api/treatment-explorer", {
        method: "POST",
        body: JSON.stringify({ condition: "Type 1 Diabetes", zipCode: "76092-1234" }),
      }),
    );
    const payload = await readJson(response);
    expect(payload.localContext.zipCode).toBe("76092");
    expect(payload.localContext.locationLabel).toContain("Arlington");
  });

  it("treatment-explorer resolves national fallback markets for unseeded zips", async () => {
    const response = await treatmentExplorerPost(
      new Request("http://localhost/api/treatment-explorer", {
        method: "POST",
        body: JSON.stringify({ condition: "Type 1 Diabetes", zipCode: "98101" }),
      }),
    );
    const payload = await readJson(response);
    expect(payload.localContext.locationLabel).toContain("Seattle");
    expect(payload.localContext.insurancePlans[1]).toContain("Premera");
  });
});
