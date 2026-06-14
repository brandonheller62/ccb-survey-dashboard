# Cancer Care Baskets — Survey Analytics Dashboard

A live analytics dashboard that turns patient feedback surveys into the charts that decide
**what goes in the next care basket**. Built for [Cancer Care Baskets](https://cancercarebaskets.org),
a nonprofit delivering comfort baskets to chemotherapy and radiation patients at Mount Sinai
Comprehensive Cancer Center in South Florida.

> **Comfort & hope, one basket at a time.**

**[🔗 Live dashboard](https://ccb-survey-dashboard.vercel.app)** · embedded on
**[cancercarebaskets.org](https://cancercarebaskets.org/#impact)**, where it updates
automatically as new survey responses arrive.

The organization has always been data-informed — surveying patients and adjusting basket
contents based on what they actually find helpful. This dashboard makes that loop live:
responses flow in through Google Forms, and the charts update automatically, so the next
basket is shaped by the most recent feedback instead of a hand-made spreadsheet.

<!-- Add a screenshot here once deployed: -->
<!-- ![Dashboard screenshot](docs/screenshot.png) -->

---

## What it shows

- **KPIs** — total responses, busiest month, and the collection date range
- **Who responded to our survey** — donut of treatment type (chemotherapy / radiation / both)
- **Where patients are in their journey** — responses by treatment stage
- **Most-requested chemotherapy items** — ranked, aggregated across the form's branched columns
- **Most-requested radiation therapy items** — ranked, same aggregation

These mirror the charts on the live website — but driven by live data instead of static images.

## Why it's more than a chart library

A few problems made this non-trivial, and the solutions are the interesting part:

- **The Google Sheet stays private.** Survey responses include sensitive patient context, so
  the Sheet is never "published to the web." A serverless function holds a Google
  **service-account** credential and reads the Sheet server-side; the browser only ever
  receives chart-ready data.
- **Patient free-text never leaves the server.** Open-ended comment columns are stripped
  before any response reaches the browser, so the dashboard is safe to embed publicly while
  the raw feedback stays private. (See `server/sheets.js`.)
- **Messy, branching survey schema.** Google Forms exports use the full question text as
  column headers, and the form branches — so chemo and radiation item selections are
  scattered across *six* differently-worded columns. The normalization layer
  (`src/lib/normalize.js`) maps headers to stable fields by keyword and merges multi-select
  answers across all matching columns, so re-wording a question doesn't break the dashboard.

## Tech stack

- **React 18 + Vite 5** (frontend)
- **Tailwind CSS 3** (styling; brand palette matches cancercarebaskets.org)
- **Recharts 2** (visualizations)
- **Google Sheets API** via a **Vercel serverless function** + `google-auth-library`
- **Papaparse** (CSV parsing for the sample-data fallback)
- Deploys to **Vercel** (static frontend + one serverless function)

## Architecture

```
Browser ── GET /api/responses ──► serverless function ──► server/sheets.js
                                                            ├─ JWT (service account)
                                                            ├─ Google Sheets API (read-only)
                                                            └─ redact free-text columns
   ◄── normalized records ── src/lib/loadData.js ── { headers, rows } ◄──┘
```

Parsing/transform logic lives in `src/lib/` (pure, testable) and never inside components:

| File | Responsibility |
|------|----------------|
| `server/sheets.js` | Reads the private Sheet; redacts free-text. **Server-only.** |
| `api/responses.js` | Vercel serverless endpoint (`GET /api/responses`). |
| `src/lib/normalize.js` | Header → canonical-field mapping, missing-value + type handling. |
| `src/lib/transform.js` | Aggregations + filtering (counts, rankings, date extent). |
| `src/lib/loadData.js` | Client fetch + normalize entry point. |
| `src/components/charts/` | The four chart components. |

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

With no credentials configured it runs on bundled **sample data** so the UI is fully
explorable. To connect a real Sheet, see below.

### Connect your Google Sheet

1. In the [Google Cloud Console](https://console.cloud.google.com): create a project and
   **enable the Google Sheets API**.
2. **Create a service account** → add a **JSON key** → download it.
3. Open your responses Google Sheet → **Share** → paste the service account's email
   (`…@….iam.gserviceaccount.com`) → **Viewer**.
4. Copy `.env.example` to `.env.local` and fill in:

   ```
   GOOGLE_SERVICE_ACCOUNT_EMAIL=…@….iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----\n"
   GOOGLE_SHEET_ID=…            # the id in the Sheet URL: /d/<THIS>/edit
   GOOGLE_SHEET_RANGE=Form Responses 1
   ```

5. Verify the connection (validates credentials and does a live read, **without printing
   secrets**):

   ```bash
   node scripts/check-connection.js
   ```

### Exporting data from Google Forms / Sheets

Google Forms automatically writes responses to a linked Google Sheet (**Responses → View in
Sheets**). This dashboard reads that Sheet directly via the API, so **no manual CSV export is
needed** — new submissions appear on the next refresh. The default tab is `Form Responses 1`;
set `GOOGLE_SHEET_RANGE` if yours differs.

## Deploying to Vercel

1. Import the repo at [vercel.com](https://vercel.com) (**Add New → Project**).
2. Add the four environment variables above under **Settings → Environment Variables**.
3. Deploy. The frontend and the `/api/responses` function deploy together.

## Embedding into the website

The dashboard renders a chrome-free, transparent, auto-resizing view at `/?embed=1`, intended
to be dropped into cancercarebaskets.org:

```html
<iframe id="ccb-dashboard" src="https://ccb-survey-dashboard.vercel.app/?embed=1"
        title="Cancer Care Baskets — live survey results"
        style="width:100%;border:0;display:block;min-height:1200px" loading="lazy"></iframe>
<script>
  window.addEventListener('message', function (e) {
    if (e && e.data && e.data.type === 'ccb-embed-height') {
      var f = document.getElementById('ccb-dashboard');
      if (f) f.style.height = e.data.height + 'px';
    }
  });
</script>
```

Framing is restricted via a Content-Security-Policy header (`vercel.json`) to the
`cancercarebaskets.org`, Netlify, and Vercel domains, so the dashboard can't be embedded
by arbitrary third-party sites.

## Scripts

```bash
npm run dev          # dev server (serves /api/responses via Vite middleware)
npm run build        # production build
npm run preview      # preview the production build
npm run gen:sample   # regenerate public/sample-survey.csv
node scripts/check-connection.js   # validate creds + live read (masks secrets)
```

---

Built by [Brandon Heller](https://github.com/brandonheller62) for Cancer Care Baskets.
