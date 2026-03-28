import { BillFinding, BillLineItem, DisputeDraftResult, disputeDraftResultSchema } from "@/lib/schemas/billpilot";

export function generateDisputeDrafts(findings: BillFinding[], lineItems: BillLineItem[]): DisputeDraftResult {
  const highlighted = findings
    .filter((finding) => finding.severity === "high" || finding.severity === "medium")
    .slice(0, 4);

  const supportSummary = highlighted.map((finding) => `${finding.headline}: ${finding.evidence.join("; ")}`);

  const chargeList = highlighted
    .map((finding) => `- ${finding.headline}: ${finding.explanation}`)
    .join("\n");

  const providerDraft = `Subject: Request for billing review, itemization, and coding justification

Billing Department,

I am requesting a formal review of the charges on my recent statement for [Date of Service]. Based on my itemized review, several charges appear to warrant clarification or correction:

${chargeList}

Please provide CPT or revenue-code level justification for the flagged charges, confirm that there are no duplicate charges, and issue a corrected statement if adjustments are appropriate. I also request confirmation that all charges were applied correctly against my deductible and out-of-pocket maximum.

Please respond in writing to [Patient Name] regarding account [Account Number]. I can be reached at [Phone Number].

Sincerely,
[Patient Name]`;

  const insurerDraft = `Subject: Request for claim review and benchmark variance investigation

Claims Review Team,

I am requesting a review of my recent medical claim associated with [Date of Service]. My review identified potential benchmark variance and billing concerns that may affect adjudication:

${chargeList}

Please confirm the allowed amounts applied to these services, review whether any duplicate or unsupported charges were processed, and let me know whether a corrected claim or provider outreach is appropriate.

I would appreciate a written response tied to member ID [Member ID] and account [Account Number]. I can be reached at [Phone Number].

Sincerely,
[Patient Name]`;

  return disputeDraftResultSchema.parse({
    providerDraft,
    insurerDraft,
    supportSummary: supportSummary.length
      ? supportSummary
      : lineItems.slice(0, 3).map((item) => `${item.description}: billed $${item.billedAmount.toFixed(2)}`),
  });
}
