import Anthropic from "@anthropic-ai/sdk";
import { enrichLocalMarketContext, getLocalMarketContext, normalizeZipCode, type LocalMarketContext } from "@/data/local-markets";
import { localMarketContextSchema } from "@/lib/schemas/billpilot";

const SCOUT_SYSTEM_PROMPT =
  "You are a healthcare logistics scout based in the United States. Given a ZIP code, identify the likely city and state, then return nearby facilities, dominant commercial carriers, and six plan display names for that area. Return valid JSON only.";

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export async function resolveLocalMarketContext(zipCode?: string): Promise<LocalMarketContext | null> {
  const normalizedZip = normalizeZipCode(zipCode);
  const fallback = getLocalMarketContext(normalizedZip);
  if (!normalizedZip || !/^\d{5}$/.test(normalizedZip)) return fallback;

  const client = getClient();
  if (!client) return fallback;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      system: SCOUT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Given ZIP code ${normalizedZip}, return JSON with this exact shape:
{
  "zipCode": "${normalizedZip}",
  "locationLabel": "City, State",
  "regionalNote": "One sentence about why setting and network selection matter in this market.",
  "insurers": ["Carrier 1", "Carrier 2", "Carrier 3", "Carrier 4"],
  "insurancePlans": ["Medicare (Parts B+D)", "Carrier 1 PPO", "Carrier 2 EPO", "Carrier 3 PPO", "Carrier 4 HMO", "State Medicaid"],
  "facilities": [
    { "name": "Real facility name", "type": "Hospital Outpatient|Urgent Care|Clinic", "settingId": "primary-care|urgent-care|hospital-outpatient|specialist|endocrinology-clinic|retail-pharmacy|hospital-education" }
  ]
}`,
        },
      ],
    });

    const textBlock = message.content.find((item) => item.type === "text");
    const raw = textBlock?.text?.trim();
    if (!raw) return fallback;
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, ""));
    const parsedContext = localMarketContextSchema.parse({
      ...fallback,
      ...parsed,
      insurancePlans: parsed.insurancePlans ?? fallback?.insurancePlans,
    });
    return enrichLocalMarketContext(parsedContext);
  } catch {
    return fallback;
  }
}
