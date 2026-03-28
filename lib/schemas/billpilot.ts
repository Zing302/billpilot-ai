import { z } from "zod";

export const severitySchema = z.enum(["high", "medium", "low", "review"]);
export const findingTypeSchema = z.enum([
  "duplicate",
  "variance",
  "facility_fee",
  "coding_suspect",
  "ambiguity",
  "date_overlap",
  "total_mismatch",
]);

export const lineItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  billedAmount: z.number().nonnegative(),
  allowedAmount: z.number().nonnegative().nullable(),
  serviceDate: z.string().nullable(),
  quantity: z.number().int().positive().nullable(),
  normalizedCategory: z.string(),
  confidence: z.number().min(0).max(1),
});

export const parseTotalsSchema = z.object({
  billedTotal: z.number().nonnegative(),
  allowedTotal: z.number().nonnegative(),
  statedTotal: z.number().nonnegative().nullable().default(null),
});

export const uncertainFieldSchema = z.object({
  lineItemId: z.string(),
  field: z.enum(["description", "allowedAmount", "serviceDate", "quantity"]),
  reason: z.string(),
});

export const billParseResultSchema = z.object({
  sourceType: z.enum(["rawText", "textFile", "csv", "pdf", "normalized"]),
  providerName: z.string().nullable(),
  serviceDates: z.array(z.string()),
  lineItems: z.array(lineItemSchema),
  extractionConfidence: z.number().min(0).max(1),
  uncertainFields: z.array(uncertainFieldSchema),
  totals: parseTotalsSchema,
});

export const billFindingSchema = z.object({
  id: z.string(),
  severity: severitySchema,
  type: findingTypeSchema,
  headline: z.string(),
  explanation: z.string(),
  evidence: z.array(z.string()),
  affectedLineItemIds: z.array(z.string()),
});

export const billAnalysisResultSchema = z.object({
  summary: z.string(),
  totals: parseTotalsSchema.extend({
    disputeOpportunity: z.number().nonnegative(),
  }),
  findings: z.array(billFindingSchema),
  actionPlan: z.array(z.string()),
  estimatedOpportunity: z.number().nonnegative(),
  normalizedLineItems: z.array(lineItemSchema),
});

export const cptCodeSchema = z.object({
  code: z.string(),
  description: z.string(),
  category: z.string(),
  medicareRate: z.number().nonnegative(),
});

export const treatmentPlanSchema = z.object({
  name: z.string(),
  planPays: z.number().nonnegative().nullable(),
  patientPays: z.number().nonnegative().nullable(),
  note: z.string(),
});

export const treatmentSettingSchema = z.object({
  settingId: z.string().optional(),
  setting: z.string(),
  description: z.string(),
  baseMedicareRate: z.number().nonnegative(),
  benchmarkType: z.enum(["cms-anchor", "modeled"]),
  plans: z.array(treatmentPlanSchema),
});

export const treatmentRecommendationSchema = z.object({
  optimalSetting: z.string(),
  optimalPlan: z.string(),
  reasoning: z.string(),
  savingsVsWorstCase: z.number().nonnegative(),
  tips: z.array(z.string()),
});

export const localFacilitySchema = z.object({
  name: z.string(),
  type: z.string(),
  settingId: z.string().optional(),
});

export const localMarketContextSchema = z.object({
  zipCode: z.string(),
  locationLabel: z.string(),
  regionalNote: z.string(),
  insurers: z.array(z.string()),
  insurancePlans: z.array(z.string()),
  facilities: z.array(localFacilitySchema),
});

export const treatmentExplorerResultSchema = z.object({
  condition: z.string(),
  supported: z.boolean(),
  summary: z.string(),
  cptCodes: z.array(cptCodeSchema),
  treatmentSettings: z.array(treatmentSettingSchema),
  recommendation: treatmentRecommendationSchema.nullable(),
  methodology: z.array(z.string()),
  localContext: localMarketContextSchema.nullable().default(null),
  suggestedConditions: z.array(z.string()).optional(),
});

export const parseBillInputSchema = z
  .object({
    rawText: z.string().optional(),
    fileName: z.string().optional(),
    fileContent: z.string().optional(),
    mimeType: z.string().optional(),
    normalizedLineItems: z.array(lineItemSchema).optional(),
  })
  .refine(
    (value) =>
      Boolean(value.rawText?.trim()) ||
      Boolean(value.fileContent?.trim()) ||
      Boolean(value.normalizedLineItems?.length),
    { message: "Provide rawText, fileContent, or normalizedLineItems." },
  );

export const analyzeBillInputSchema = z.object({
  lineItems: z.array(lineItemSchema).min(1),
  statedTotal: z.number().nonnegative().nullable().optional(),
});

export const generateDisputeInputSchema = z.object({
  findings: z.array(billFindingSchema).min(1),
  lineItems: z.array(lineItemSchema).min(1),
  recipientMode: z.enum(["provider", "insurer"]).optional().default("provider"),
});

export const disputeDraftResultSchema = z.object({
  providerDraft: z.string(),
  insurerDraft: z.string(),
  supportSummary: z.array(z.string()),
});

export const treatmentExplorerInputSchema = z.object({
  condition: z.string().min(1),
  zipCode: z.string().trim().max(10).optional(),
});

export type BillLineItem = z.infer<typeof lineItemSchema>;
export type BillParseResult = z.infer<typeof billParseResultSchema>;
export type BillFinding = z.infer<typeof billFindingSchema>;
export type BillAnalysisResult = z.infer<typeof billAnalysisResultSchema>;
export type TreatmentSetting = z.infer<typeof treatmentSettingSchema>;
export type TreatmentExplorerResult = z.infer<typeof treatmentExplorerResultSchema>;
export type DisputeDraftResult = z.infer<typeof disputeDraftResultSchema>;
