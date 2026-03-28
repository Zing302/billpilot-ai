require("dotenv").config();
const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a medical billing expert with deep knowledge of CPT codes, CMS Medicare fee schedules, and insurance plan structures across the United States. You help patients understand realistic costs for their healthcare decisions. Always return valid, parseable JSON only — no markdown fences, no extra commentary.`;

const SCOUT_SYSTEM_PROMPT = `You are a healthcare logistics and insurance scout based in the United States. Given a ZIP code, your job is to identify the region and provide real-world facilities and dominant insurance carriers for that specific area. Always return valid, parseable JSON only — no markdown fences, no extra commentary.`;

const ADVOCATE_SYSTEM_PROMPT = `You are an expert patient advocate and medical billing negotiator. Your job is to draft highly professional, aggressive, and legally sound dispute emails directly to insurance companies or hospital billing departments. You explicitly cite issues like disallowed amounts, high-risk flags, deductible checks, and medical coding justification. Always return pure text, no markdown block wrappers.`;

app.post("/api/treatment-explorer", async (req, res) => {
  const { condition, zipCode } = req.body;
  if (!condition || !condition.trim()) {
    return res.status(400).json({ error: "condition is required" });
  }

  try {
    // --- AGENT 1: Location & Insurance Scout ---
    let localContext = null;
    if (zipCode && zipCode.trim().length >= 4) {
      const scoutPrompt = `Given the US ZIP code "${zipCode.trim()}", identify the City and State. Then provide 3 real-world medical facilities in or near that area (e.g., actual hospital names, actual urgent care clinics). Also provide 4 top commercial health insurance carriers dominant in that state.
Return ONLY valid JSON with this exact structure:
{
  "location": "City, State",
  "facilities": [
    { "name": "Real Hospital/Clinic Name", "type": "Hospital Outpatient|Hospital Inpatient|Urgent Care|Clinic / Physician Office" }
  ],
  "insurances": ["Carrier 1", "Carrier 2", "Carrier 3", "Carrier 4"]
}`;
      const scoutMsg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: SCOUT_SYSTEM_PROMPT,
        messages: [{ role: "user", content: scoutPrompt }],
      });
      const scoutRaw = scoutMsg.content[0].text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      try {
         localContext = JSON.parse(scoutRaw);
      } catch (e) {
         console.error("Scout parsing error", e);
      }
    }

    // Default fallbacks if Agent 1 fails or no zip is provided
    const facilitiesText = localContext 
       ? `Use these specific local facilities when appropriate for the settings: ${localContext.facilities.map(f => `${f.name} (${f.type})`).join(', ')}.`
       : `Use standard setting names (Hospital Outpatient, Hospital Inpatient, Clinic / Physician Office, Urgent Care, Telehealth).`;
    const plansText = localContext
       ? `Use these specific regional commercial insurance carriers for the commercial plans: ${localContext.insurances.join(', ')}. Include Medicare, Medicaid, and Uninsured as the other options (total 6 plans per setting).`
       : `Use Medicare, Medicaid, BCBS PPO, Aetna HMO, UnitedHealth PPO, Uninsured.`;

    // --- AGENT 2: Pricing Engine ---
    const userPrompt = `A patient has the following medical condition: "${condition.trim()}"${localContext ? `\nPatient Location: ${localContext.location}` : ""}

Provide a comprehensive treatment cost analysis. Return ONLY valid JSON with this exact structure (fill in all numeric values with realistic 2024-2025 figures):

{
  "condition": "formatted condition name",
  "summary": "1-2 sentence clinical overview of this condition and typical management",
  "cptCodes": [
    {
      "code": "XXXXX",
      "description": "full CPT description",
      "medicareRate": 0.00,
      "category": "Evaluation|Lab|Imaging|Procedure|Therapy|Surgery"
    }
  ],
  "treatmentSettings": [
    {
      "setting": "Setting Name (e.g. use actual facility name if provided, else generic)",
      "description": "brief setting description",
      "baseMedicareRate": 0.00,
      "plans": [
        { "name": "Plan Name", "planPays": 0.00, "patientPays": 0.00, "note": "Brief OOP explanation" }
      ]
    }
  ],
  "recommendation": {
    "optimalSetting": "setting name matching one above",
    "optimalPlan": "plan name matching one above",
    "reasoning": "2-3 sentence explanation of why this combination is optimal",
    "savingsVsWorstCase": 0.00,
    "tips": [
      "actionable tip 1",
      "actionable tip 2",
      "actionable tip 3"
    ]
  }
}

Rules:
- ${facilitiesText} Include exactly 4-5 treatment settings reflecting typical care paths for this condition.
- For EACH setting, include exactly 6 separate health plans in the "plans" array.
- ${plansText}
- Use realistic 2024-2025 CMS Medicare fee schedule rates for the baseMedicareRate
- Commercial insurer negotiated rates are typically 130-160% of Medicare
- Uninsured chargemaster rates are typically 2.5-4x Medicare rates
- Include 4-6 CPT codes covering typical diagnosis and treatment for this condition
- If the condition is not appropriate for a particular setting (e.g. surgery via telehealth), set patientPays to null and note "Not applicable"
- Make the recommendation genuinely optimal considering cost, convenience, and clinical appropriateness`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = message.content[0].text.trim();
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const data = JSON.parse(jsonStr);
    
    if (localContext) {
       data.summary += ` (Cost estimates adjusted for ${localContext.location})`;
    }
    
    res.json(data);
  } catch (err) {
    console.error("Treatment explorer error:", err);
    if (err instanceof SyntaxError) {
      res.status(500).json({ error: "AI returned malformed JSON. Please retry." });
    } else {
      res.status(500).json({ error: err.message || "Unknown error" });
    }
  }
});

// --- AGENT 3: Dispute Email Generator ---
app.post("/api/generate-dispute", async (req, res) => {
  const { lineItems } = req.body;
  
  if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
    return res.status(400).json({ error: "Invalid line items provided." });
  }

  try {
    // Format the items into a receipt-style table for the prompt
    let itemsStr = "Description | Billed | Allowed | Variance | Risk Flag\n";
    itemsStr += "--------------------------------------------------------\n";
    lineItems.forEach(i => {
       itemsStr += `${i.description} | $${i.billed} | $${i.allowed} | $${i.variance} | ${i.risk}\n`;
    });
    
    const userPrompt = `I need you to draft a formal, assertive, and highly professional dispute email to a hospital billing department regarding a recent medical bill. 

Here are the line items from the bill:
${itemsStr}

Requirements for the email:
1. Subject line should be clear and reference a request for billing review and code justification.
2. Address it to the "Billing Department".
3. Point out the specific line items flagged as "High" or "Medium" risk, noting the significant variance between the charged amount and the allowed/Medicare-benchmark amount.
4. Request a formal coding justification (CPT codes and clinical documentation) for those flagged items.
5. Explicitly request they verify that these charges have been correctly applied against my deductible and out-of-pocket maximum, and that there are no duplicate charges.
6. Use placeholders like [Patient Name], [Account Number], [Phone Number], and [Date of Service] so I can fill them in easily.
7. Tone should be firm, knowledgeable, but polite.
8. Do not include markdown greetings or conversational filler at the beginning or end of your response. Just output the raw draft email.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: ADVOCATE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    res.json({ emailDraft: message.content[0].text.trim() });
  } catch (err) {
    console.error("Dispute generation error:", err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\nBillPilot AI running at http://localhost:${PORT}`);
  console.log(`API key loaded: ${process.env.ANTHROPIC_API_KEY ? "YES" : "NO — set ANTHROPIC_API_KEY in .env"}\n`);
});
