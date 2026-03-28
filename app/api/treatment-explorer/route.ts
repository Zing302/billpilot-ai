import { jsonResponse, readJson } from "@/lib/http";
import { treatmentExplorerInputSchema } from "@/lib/schemas/billpilot";
import { exploreTreatment } from "@/lib/treatment/explorer";
import { resolveLocalMarketContext } from "@/lib/treatment/local-scout";
import { ZodError } from "zod";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = treatmentExplorerInputSchema.parse(await readJson(request));
    const localContext = await resolveLocalMarketContext(payload.zipCode);
    const result = exploreTreatment(payload.condition, payload.zipCode, localContext);
    return jsonResponse(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonResponse({ error: error.issues[0]?.message ?? "Invalid explorer payload." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown explorer error.";
    return jsonResponse({ error: message }, { status: 400 });
  }
}
