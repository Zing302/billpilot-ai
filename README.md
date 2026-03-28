# BillPilot AI

Medical bills are opaque, inflated, and nearly impossible to challenge. BillPilot AI solves both sides of the problem: benchmark treatment costs before you book care, and audit itemized bills after they arrive — generating dispute-ready letters to both your provider and insurer.

Built with Next.js 15, TypeScript, and optional Claude-powered local market context. Submitted to the OpenAI x Handshake Codex Creator Challenge.

---

## What It Does

### Plan Care
Enter a medical condition and optional ZIP code. BillPilot maps the likely CPT billing codes for that episode, benchmarks costs against CMS Medicare rates, and compares patient out-of-pocket across care settings (primary care, urgent care, specialist, telehealth, hospital outpatient) and insurance plan types. ZIP-aware local market context can be enriched with Claude for real facility names, dominant carriers, and region-specific plan labeling.

**Supported conditions (31):** Annual Physical · Ankle Sprain · Anxiety Follow-up · Appendectomy Follow-up · ACL MRI Pathway · Asthma Follow-up · Back Pain Workup · Bronchitis · Cholesterol Follow-up · Contraception Consult · Depression Follow-up · Dermatology Visit · Ear Infection · GERD Follow-up · Hypertension Follow-up · IBS Follow-up · Kidney Stone Follow-up · Knee Pain Workup · Migraine Visit · Physical Therapy Evaluation · Pink Eye · Pneumonia Follow-up · Pregnancy Confirmation Visit · Shoulder Pain Workup · Sinus Infection · Sleep Apnea Consult · Strep Throat Workup · Thyroid Follow-up · Type 1 Diabetes Mellitus · Type 2 Diabetes Follow-up · Urinary Tract Infection

### Review Bill
Paste or upload an itemized bill (TXT, CSV, or free-text). BillPilot parses it into structured line items, runs a benchmark analysis to flag anomalies, then generates two targeted outreach letters — one for your provider's billing department and one for your insurer's claims review team.

**What the analyzer detects:**
- Duplicate charges (same description, amount, and service date)
- Benchmark variance (billed amount substantially above the allowed/CMS anchor)
- High facility fees warranting itemization
- Low-confidence or ambiguous line items needing manual confirmation
- Same-day service overlap (e.g., multiple evaluation charges alongside ancillary services)
- Total mismatch between stated bill total and summed line items

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, vanilla CSS (no framework) |
| Validation | Zod |
| AI | Anthropic Claude (Haiku 4.5 for local market context) |
| Unit tests | Vitest |
| E2E tests | Playwright |

---

## Architecture

```
/app
  /api
    /parse-bill          → POST: raw text/file → structured line items
    /analyze-bill        → POST: line items → findings + totals
    /generate-dispute    → POST: findings + line items → provider + insurer drafts
    /treatment-explorer  → POST: condition + ZIP → benchmarked cost table
  layout.tsx
  page.tsx
  globals.css

/components
  /bill
    bill-panel.tsx       → Review Bill workflow (4-step: Paste → Review → Analyze → Draft)
  /explorer
    explorer-panel.tsx   → Plan Care workflow (form → results + local market)
  /ui
    tab-bar.tsx          → Accessible tablist navigation
    stat-card.tsx        → Metric display component
    copy-button.tsx      → Clipboard with state feedback
    status-message.tsx   → Live region status announcements

/hooks
  use-bill-audit.ts      → Bill workflow state machine (parse → analyze → draft)
  use-explorer.ts        → Treatment explorer state + API calls
  use-clipboard.ts       → Clipboard with auto-reset

/lib
  /billing
    parse.ts             → Bill parser (pipe, CSV, and messy free-text)
    analyze.ts           → Rule-based anomaly detection (6 finding types)
  /dispute
    generate.ts          → Deterministic dispute letter generation
  /treatment
    explorer.ts          → Condition → CPT → cost matrix engine
    local-scout.ts       → Claude AI call for ZIP-aware market context
  /schemas
    billpilot.ts         → Zod schemas for all data structures
  format.ts              → Currency formatting utilities
  http.ts                → Request/response helpers

/data
  conditions.ts          → 31 condition definitions with CPT codes + pricing anchors
  local-markets.ts       → Hardcoded market contexts (fallback when AI unavailable)
  demo-fixtures.ts       → Pre-seeded bill examples for immediate demo

/demo                    → Original vanilla JS prototype (reference only)
```

---

## How the Bill Parser Works

The parser accepts three input shapes and routes each to the appropriate strategy:

| Input | Strategy | Confidence |
|---|---|---|
| Pipe-delimited text (`Desc\|Billed\|Allowed\|Date`) | Field split | 0.97 |
| CSV file with header row | Column mapping | 0.96 |
| Free-form text with dollar amounts | Regex extraction | 0.64–0.80 |

Every parsed line item carries an `extractionConfidence` score. Fields that are missing or ambiguous are surfaced as `uncertainFields` with a specific reason, so users know exactly what to verify before sending a dispute.

---

## How the Treatment Explorer Works

1. The condition input is matched against 31 hardcoded definitions by slug or name.
2. Each definition includes the relevant CPT billing codes with CMS Medicare rates as the pricing floor.
3. If a ZIP code is provided, `local-scout.ts` can call Claude Haiku to resolve the actual city, nearby facilities, dominant commercial carriers, and region-specific plan display names for that market.
4. Patient costs are modeled per setting per plan using each plan's copay model (flat-by-setting or percentage-of-base with an OOP cap).
5. The optimal path is selected as the lowest modeled patient cost with a clinically valid setting, and the savings gap vs the worst-case path is calculated.

**Without an API key:** The explorer falls back to hardcoded local market contexts for a set of pre-configured ZIP codes (major metro areas). All cost modeling runs without any API dependency — Claude is only used for market localization.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install and run

```bash
cd /path/to/hackathon-win-agent
npm install
npm run dev
```

Open the URL shown in the terminal (default: `http://localhost:3000`).

### Enable AI-powered local market context (optional)

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:

```
ANTHROPIC_API_KEY=your_key_here
```

Without this key, the treatment explorer still works fully — it falls back to hardcoded market contexts for pre-configured ZIP codes and national/state market fallbacks. With the key, ZIP lookups can be enriched with Claude Haiku for more specific local facility and carrier naming.

---

## API Reference

All endpoints accept and return JSON. Validation is handled by Zod on every route — malformed input returns a `400` with a specific error message.

### `POST /api/treatment-explorer`

Benchmark treatment costs for a condition and optional ZIP code.

**Request**
```json
{
  "condition": "Knee Pain Workup",
  "zipCode": "60601"
}
```

**Response** — `TreatmentExplorerResult`
```json
{
  "condition": "Knee Pain Workup",
  "supported": true,
  "summary": "...",
  "cptCodes": [...],
  "treatmentSettings": [...],
  "recommendation": {
    "optimalSetting": "Primary Care",
    "optimalPlan": "Medicare (Parts B+D)",
    "savingsVsWorstCase": 412.00,
    "reasoning": "...",
    "tips": [...]
  },
  "methodology": [...],
  "localContext": { "locationLabel": "Chicago, Illinois", ... }
}
```

---

### `POST /api/parse-bill`

Parse raw bill text or a structured file into line items.

**Request** (text input)
```json
{
  "rawText": "Emergency Room Facility Fee|2150.00|980.00|2026-02-10\nDuplicate Lab Processing Charge|310.00|120.00|2026-02-10"
}
```

**Request** (file input)
```json
{
  "fileName": "bill.csv",
  "fileContent": "description,billed,allowed,date\nPrimary Care Visit,110,92,2026-02-14",
  "mimeType": "text/csv"
}
```

**Response** — `BillParseResult`
```json
{
  "sourceType": "csv",
  "providerName": null,
  "lineItems": [...],
  "extractionConfidence": 0.96,
  "uncertainFields": [],
  "totals": {
    "billedTotal": 110.00,
    "allowedTotal": 92.00,
    "statedTotal": null
  }
}
```

---

### `POST /api/analyze-bill`

Run anomaly detection on parsed line items.

**Request**
```json
{
  "lineItems": [...],
  "statedTotal": 4520.00
}
```

**Response** — `BillAnalysisResult`
```json
{
  "summary": "Found 4 review items...",
  "findings": [
    {
      "id": "finding-1",
      "severity": "high",
      "type": "duplicate",
      "headline": "Possible duplicate charge: Duplicate Lab Processing Charge",
      "explanation": "...",
      "evidence": [...],
      "affectedLineItemIds": ["line-5", "line-6"]
    }
  ],
  "totals": { "billedTotal": 4520.00, "allowedTotal": 2070.00, "disputeOpportunity": 2450.00 },
  "actionPlan": [...],
  "estimatedOpportunity": 2450.00
}
```

---

### `POST /api/generate-dispute`

Generate provider and insurer dispute letters from analysis findings.

**Request**
```json
{
  "findings": [...],
  "lineItems": [...]
}
```

**Response** — `DisputeDraftResult`
```json
{
  "providerDraft": "Subject: Request for billing review...\n\n...",
  "insurerDraft": "Subject: Request for claim review...\n\n...",
  "supportSummary": [...]
}
```

---

## Running Tests

```bash
# Unit tests (bill parsing, analysis, treatment explorer)
npm test

# E2E tests (requires dev server running)
npm run test:e2e

# Production build check
npm run build
```

---

## Design Decisions

**Why two separate dispute letters?** Providers and insurers have different roles in the billing chain and respond to different arguments. The provider letter requests CPT-level justification and a corrected statement. The insurer letter requests claim review and asks whether a corrected claim or provider outreach is appropriate. Combining them into one email reduces specificity and the likelihood of a productive response.

**Why deterministic dispute generation (no AI)?** Dispute letters benefit from precision, not creativity. Hard-coded templates with evidence injected from the analysis findings are more reliable, faster, and produce output that users can immediately trust and send. AI-generated prose would introduce variability in a context where consistency matters.

**Why Claude only for market localization?** The cost modeling engine is fully deterministic — condition definitions, CPT codes, and pricing anchors are hardcoded against CMS data. Claude is used only for the ZIP-to-market-context translation, where the task is genuinely knowledge-retrieval (what facilities and carriers exist near this ZIP code), not reasoning. This keeps AI usage narrowly scoped and the app functional even when the API is unavailable.

**Why no CSS framework?** The design system is small enough that a single `globals.css` with CSS custom properties provides full control without the overhead of Tailwind or a component library. The design is intentionally minimal — borders over shadows, muted palette, compact inputs — to keep the UI from competing with the data.

---

## Limitations and Known Gaps

- **PDF text extraction** — PDF uploads are not supported yet. For now, paste bill text directly or upload TXT/CSV exports.
- **Condition coverage** — 31 conditions are supported in the treatment explorer. Entering an unsupported condition returns a graceful fallback with a list of suggested alternatives.
- **Cost estimates are modeled, not real** — Patient cost estimates are derived from CMS Medicare benchmark rates and modeled plan design assumptions. Actual costs depend on your specific plan, deductible status, network, and provider. This tool is for informational purposes only and is not medical advice.
- **Dispute letters require personalization** — Generated letters include bracketed placeholders (`[Patient Name]`, `[Account Number]`, etc.) that must be filled in before sending.

---

## Disclaimer

Cost estimates are based on CMS Medicare benchmark data and modeled plan design assumptions. BillPilot AI is for informational purposes only. It is not medical advice and does not constitute legal or financial counsel. Always verify charges directly with your provider and insurer before initiating a formal dispute.
