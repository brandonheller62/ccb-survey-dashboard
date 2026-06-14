# CLAUDE.md

Guidance for Claude Code (and humans) working in this repo.

## What this is

A survey analytics dashboard for **Cancer Care Baskets (CCB)**, a nonprofit that delivers
comfort baskets to chemotherapy and radiation patients in South Florida. It reads patient
feedback survey responses (collected via Google Forms → Google Sheets) and visualizes them.

**Tagline:** "Comfort & hope, one basket at a time." Brand color is a warm rose/pink
(`ccb-500 = #e54b85`, full scale in `tailwind.config.js`).

## Stack

- **React 18 + Vite 5** (JSX, not TypeScript)
- **Tailwind CSS 3** for styling (brand palette + `.card`/`.btn-*` components in `index.css`)
- **Recharts 2** for charts
- **Papaparse** for CSV parsing (server-side sample fallback only)
- **google-auth-library** for the service-account JWT
- Deploys to **Vercel** (static frontend + one serverless function)

## Architecture — the important part

The dashboard reads a **private** Google Sheet. Credentials live ONLY server-side; the
browser never sees them and the Sheet is never published publicly.

```
Browser ── GET /api/responses ──► serverless function ──► server/sheets.js
                                                            └─ JWT (service account)
                                                            └─ Google Sheets API (read-only)
   ◄── normalized records ── src/lib/loadData.js ── { headers, rows } ◄──┘
```

- **`server/sheets.js`** — SERVER ONLY. Reads the Sheet via service-account JWT. If env
  vars are absent, falls back to `public/sample-survey.csv` so the UI works in local dev.
  **Never import this into client/`src` code** — it would leak credentials into the bundle.
- **`api/responses.js`** — the Vercel serverless function. Thin wrapper over `fetchResponses()`.
- **`vite.config.js`** — a dev-only middleware serves the same `/api/responses` so
  `npm run dev` exercises the real path without `vercel dev`. Loads `.env.local` into
  `process.env` for the middleware.
- **`src/lib/loadData.js`** — client fetches `/api/responses`, then runs rows through
  `normalize.js`.

## Code conventions

- **Keep parsing/transform logic in `src/lib/`, never in components.** Components render;
  `lib/` computes.
  - `normalize.js` — maps messy Google Forms headers → stable canonical keys via keyword
    patterns (so re-wording a survey question doesn't break the dashboard), handles missing
    values, coerces types. Unrecognized columns become auto-typed "extra" fields.
  - `transform.js` — pure aggregation + filtering helpers (no React, no Papaparse). Unit-
    testable in isolation.
  - `loadData.js` — the fetch + normalize entry point for the UI.
- **Components** live in `src/components/`. Reusable shells: `ChartCard`, `StatCard`. Brand
  bits: `Logo`. Keep them presentational.
- Charts use the brand palette; gradient fill id is `ccbFill`.

## Commands

```bash
npm run dev                  # Vite dev server (serves /api/responses via middleware)
npm run build                # production build
npm run preview              # preview the production build
npm run gen:sample           # regenerate public/sample-survey.csv
node scripts/check-connection.js   # validate Google Sheets creds + do a live read (masks secrets)
```

## Environment / secrets

Server-side only. Local dev reads `.env.local`; production reads Vercel env vars. See
`.env.example` for the full list:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY` (multi-line, wrapped in double quotes; `\n` escapes handled in code)
- `GOOGLE_SHEET_ID` (from the Sheet URL: `/d/<ID>/edit`)
- `GOOGLE_SHEET_RANGE` (default `Form Responses 1`)

**The service account must be granted Viewer access on the Sheet** (Share → paste the
service-account email). Without that you'll get a 403/permission error.

`.env.local` is gitignored. Never commit credentials.

## Status

- ✅ Phase 1: live Google Sheets connection (private serverless), Overview (KPIs +
  responses-over-time).
- ⏭️ Phase 2 (pending): `FilterBar` (date range + location + categorical fields), the four
  charts (respondent demographics, patient journey status, most-requested chemo items,
  most-requested radiation items), `FeedbackList`, and a user-facing `README.md` with
  CCB mission + Google Forms/Sheets export instructions.

The real Sheet has ~19 columns; `normalize.js` keyword mappings may need tuning to the
actual question wording before the four charts map cleanly.
