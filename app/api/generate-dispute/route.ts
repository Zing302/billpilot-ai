import { generateDisputeDrafts } from "@/lib/dispute/generate";
import { jsonResponse, readJson } from "@/lib/http";
import { generateDisputeInputSchema } from "@/lib/schemas/billpilot";
import { ZodError } from "zod";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = generateDisputeInputSchema.parse(await readJson(request));
    const result = generateDisputeDrafts(payload.findings, payload.lineItems);
    return jsonResponse(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonResponse({ error: error.issues[0]?.message ?? "Invalid dispute payload." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown dispute error.";
    return jsonResponse({ error: message }, { status: 400 });
  }
}
