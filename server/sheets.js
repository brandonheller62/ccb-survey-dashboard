/**
 * Server-only Google Sheets reader. Runs inside the Vercel serverless function
 * (and the Vite dev middleware) — NEVER imported into the client bundle, so the
 * service-account credentials never reach the browser and the Sheet stays private.
 *
 * Required env vars (set in Vercel → Settings → Environment Variables, or .env.local):
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL   the service account's ...@...iam.gserviceaccount.com
 *   GOOGLE_PRIVATE_KEY             the service account private key (\n-escaped is fine)
 *   GOOGLE_SHEET_ID                the id from the Sheet URL (/d/<THIS>/edit)
 *   GOOGLE_SHEET_RANGE             optional, defaults to "Form Responses 1"
 *
 * If credentials are absent we fall back to the bundled sample CSV so the UI is
 * explorable in local dev before the Sheet is wired up.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import Papa from 'papaparse'
import { JWT } from 'google-auth-library'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadSample() {
  const csv = readFileSync(join(__dirname, '..', 'public', 'sample-survey.csv'), 'utf8')
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: 'greedy' })
  return redact({
    headers: parsed.meta.fields ?? [],
    rows: parsed.data,
    sample: true,
    fetchedAt: new Date().toISOString(),
  })
}

/**
 * PRIVACY: strip open-ended / free-text columns before any data leaves the server.
 * The charts only need the multiple-choice fields (treatment, stage, item checklists),
 * so patient-written comments never reach the browser — safe to embed publicly.
 * Item *checklists* ("...find useful? (Select all that apply)") are kept; free-text
 * follow-ups ("most meaningful item listed above", "anything else you'd like to share",
 * "products not listed above") are dropped.
 */
const FREE_TEXT = [
  /listed above/i,
  /not listed above/i,
  /significantly helped/i,
  /most comforting|meaningful/i,
  /anything else/i,
  /like to share/i,
  /comment|suggestion|feedback/i,
]
function redact({ headers, rows, ...rest }) {
  const keep = headers.filter((h) => !FREE_TEXT.some((p) => p.test(h)))
  const dropped = headers.length - keep.length
  const cleanRows = rows.map((row) => Object.fromEntries(keep.map((h) => [h, row[h]])))
  return { headers: keep, rows: cleanRows, redactedColumns: dropped, ...rest }
}

export async function fetchResponses() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const rawKey = process.env.GOOGLE_PRIVATE_KEY
  const sheetId = process.env.GOOGLE_SHEET_ID
  const range = process.env.GOOGLE_SHEET_RANGE || 'Form Responses 1'

  if (!email || !rawKey || !sheetId) return loadSample()

  // Vercel stores multiline secrets with literal \n — restore real newlines.
  const key = rawKey.replace(/\\n/g, '\n')
  const jwt = new JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`
  const { data } = await jwt.request({ url })

  const values = data.values || []
  const [headerRow = [], ...rest] = values
  const headers = headerRow.map((h) => String(h).trim())
  const rows = rest.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])))

  return redact({ headers, rows, sample: false, fetchedAt: new Date().toISOString() })
}
