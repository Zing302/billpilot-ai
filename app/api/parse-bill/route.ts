import { parseBillInput } from "@/lib/billing/parse";
import { jsonResponse, readJson } from "@/lib/http";
import { parseBillInputSchema } from "@/lib/schemas/billpilot";
import { ZodError } from "zod";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = parseBillInputSchema.parse(await readJson(request));
    const result = parseBillInput(payload);
    return jsonResponse(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonResponse({ error: error.issues[0]?.message ?? "Invalid parse payload." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown parse error.";
    return jsonResponse({ error: message }, { status: 400 });
  }
}
