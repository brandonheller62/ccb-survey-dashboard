/**
 * Diagnostic: validates the Google Sheets credentials in .env.local and attempts
 * a live read — WITHOUT printing any secret values. Run: node scripts/check-connection.js
 */
import { loadEnv } from 'vite'

Object.assign(process.env, loadEnv('development', process.cwd(), ''))

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || ''
const key = process.env.GOOGLE_PRIVATE_KEY || ''
const sheetId = process.env.GOOGLE_SHEET_ID || ''
const range = process.env.GOOGLE_SHEET_RANGE || 'Form Responses 1'

const ok = (b) => (b ? '✅' : '❌')
console.log('\n— Credential checks (no secrets printed) —')
console.log(`${ok(/@.+\.iam\.gserviceaccount\.com$/.test(email.trim()))} Service account email looks valid${email ? ` (…@${email.split('@')[1] || '?'})` : ' — MISSING'}`)

const normKey = key.replace(/\\n/g, '\n').trim()
const hasBegin = normKey.includes('-----BEGIN PRIVATE KEY-----')
const hasEnd = normKey.includes('-----END PRIVATE KEY-----')
console.log(`${ok(hasBegin && hasEnd)} Private key has BEGIN/END markers`)
console.log(`${ok(normKey.length > 1000)} Private key length looks right (${normKey.length} chars; expect ~1700)`)
console.log(`${ok(sheetId.trim().length > 20)} Sheet ID present (${sheetId ? `${sheetId.trim().length} chars` : 'MISSING'})`)
console.log(`   Range: "${range}"`)

if (!email || !hasBegin || !hasEnd || !sheetId) {
  console.log('\n⚠️  Fix the ❌ items above, then re-run. (Still using sample data until all pass.)\n')
  process.exit(1)
}

console.log('\n— Live connection test —')
try {
  const { fetchResponses } = await import('../server/sheets.js')
  const data = await fetchResponses()
  if (data.sample) {
    console.log('❌ Fell back to sample data — env vars not picked up. Check .env.local location.')
    process.exit(1)
  }
  console.log(`✅ Connected! Read ${data.rows.length} response rows, ${data.headers.length} columns.`)
  console.log(`   First column header: "${data.headers[0]}"`)
  console.log('\n🎉 Live Sheet is wired up. Restart the dev server to see it in the dashboard.\n')
} catch (e) {
  const msg = e?.response?.data?.error?.message || e?.message || String(e)
  console.log(`❌ Connection failed: ${msg}`)
  if (/permission|403|forbidden/i.test(msg)) {
    console.log('   → Most likely: you haven\'t shared the Sheet with the service account email (Share → Viewer).')
  } else if (/not found|404|unable to parse range/i.test(msg)) {
    console.log('   → Check the Sheet ID, and that the tab is named exactly "' + range + '" (set GOOGLE_SHEET_RANGE if different).')
  } else if (/invalid_grant|DECODER|PEM|private key/i.test(msg)) {
    console.log('   → The private key looks malformed. Re-copy the full "private_key" value from the JSON, wrapped in quotes.')
  }
  console.log('')
  process.exit(1)
}
