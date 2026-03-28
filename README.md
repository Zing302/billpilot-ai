# BillPilot AI

BillPilot AI is a Next.js application for comparing healthcare treatment costs before care and reviewing medical bills after care.

## Product

- `Plan care`: map a condition to likely CPT codes, localize by ZIP code, and compare modeled patient costs across settings and plans
- `Review bill`: parse bill text or file input, detect common billing issues, and generate provider and insurer draft messages

## Stack

- Next.js App Router
- TypeScript
- Zod
- Vitest
- Playwright

## Local Development

```bash
npm install
npm run dev
```

Open the local URL shown by Next.js in the terminal.

## Tests

```bash
npm test
npm run build
```

## Environment

Copy `.env.example` if you want to enable the optional Anthropic-powered local market scout.

```bash
cp .env.example .env.local
```

Set:

- `ANTHROPIC_API_KEY`

Do not commit real API keys or local `.env` files.

## Repository Notes

- `.gitignore` excludes local env files, editor folders, build output, and the contest PDF
- the checked-in app is the typed Next.js implementation under `app/`, `components/`, `hooks/`, `lib/`, and `data/`
- the older `demo/` folder is still present for reference, but the main app is the Next.js version
