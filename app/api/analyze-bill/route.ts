import { analyzeBill } from "@/lib/billing/analyze";
import { jsonResponse, readJson } from "@/lib/http";
import { analyzeBillInputSchema } from "@/lib/schemas/billpilot";
import { ZodError } from "zod";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = analyzeBillInputSchema.parse(await readJson(request));
    const result = analyzeBill(payload.lineItems, payload.statedTotal);
    return jsonResponse(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonResponse({ error: error.issues[0]?.message ?? "Invalid analysis payload." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown analysis error.";
    return jsonResponse({ error: message }, { status: 400 });
  }
}
