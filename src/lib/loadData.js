/**
 * Client-side loader. Hits the serverless endpoint (which talks to the private
 * Google Sheet) and runs the raw rows through the same normalization layer the
 * CSV path used. The browser never sees credentials — only normalized records.
 */
import { normalizeRecords } from './normalize.js'

export async function loadResponses() {
  const res = await fetch(`${import.meta.env.BASE_URL}api/responses`, {
    headers: { Accept: 'application/json' },
  })

  let payload
  try {
    payload = await res.json()
  } catch {
    throw new Error(`Server returned an unexpected response (${res.status}).`)
  }

  if (!res.ok) throw new Error(payload?.error || `Request failed (${res.status}).`)

  const { headers = [], rows = [], sample = false, fetchedAt } = payload
  const { records, mapping, extras, fields } = normalizeRecords(rows, headers)

  return { records, headers, mapping, extras, fields, sample, fetchedAt }
}
