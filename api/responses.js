/**
 * Vercel serverless function: GET /api/responses
 * Reads the private Google Sheet server-side and returns { headers, rows, sample }.
 */
import { fetchResponses } from '../server/sheets.js'

export default async function handler(req, res) {
  try {
    const data = await fetchResponses()
    // Cache at the edge briefly so a burst of viewers doesn't hammer the Sheets API,
    // while staying fresh enough for a survey that updates a few times a day.
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.status(200).json(data)
  } catch (e) {
    const msg = e?.response?.data?.error?.message || e?.message || 'Failed to load survey data.'
    res.status(500).json({ error: msg })
  }
}
