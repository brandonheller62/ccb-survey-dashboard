/**
 * Schema normalization.
 *
 * Google Forms exports use the *full question text* as column headers, and those
 * change whenever someone tweaks the wording. Rather than hard-code exact names,
 * we match each header against keyword patterns and map it to a stable canonical
 * field key. Unrecognized columns are still surfaced (auto-typed) so new survey
 * questions show up as filters/charts without a code change.
 */

// type: 'date' | 'category' | 'multi' | 'number' | 'text'
export const CANONICAL_FIELDS = [
  { key: 'timestamp', label: 'Submitted', type: 'date', patterns: [/timestamp/i, /submitted/i, /date/i] },
  { key: 'journey', label: 'Treatment Journey', type: 'category', patterns: [/journey/i, /where (are|you).*(treatment|process)/i, /stage/i] },
  { key: 'treatment', label: 'Treatment Type', type: 'category', patterns: [/type of treatment/i, /treatment.*receiv/i, /chemo.*radiation/i, /treatment\(s\)/i, /undergoing/i] },
  { key: 'location', label: 'Delivery Location', type: 'category', patterns: [/hospital/i, /delivery location/i, /location/i, /campus/i, /site/i] },
  { key: 'age', label: 'Age Range', type: 'category', patterns: [/age/i] },
  { key: 'source', label: 'How They Heard', type: 'category', patterns: [/how did you hear/i, /referr/i, /find (out )?about/i] },
  // Multi-select item checklists. The real form splits these across several
  // branched columns ("...find useful? (Select all that apply)"), so these are
  // intentionally narrow to the checklists and exclude the free-text
  // "most meaningful item(s) listed above" follow-ups.
  { key: 'chemoItems', label: 'Most-Requested Chemo Items', type: 'multi', patterns: [/chemo.*find useful/i, /chemo.*select all/i, /most helpful/i] },
  { key: 'radItems', label: 'Most-Requested Radiation Items', type: 'multi', patterns: [/radiation.*find useful/i, /radiation.*select all/i, /radiation.*want/i] },
  { key: 'rating', label: 'Experience Rating', type: 'number', patterns: [/rate/i, /rating/i, /satisf/i, /stars?/i] },
  { key: 'comment', label: 'Open Feedback', type: 'text', patterns: [/share with us/i, /comment/i, /feedback/i, /anything else/i, /suggestion/i] },
]

const cleanHeader = (h) => String(h ?? '').replace(/\s+/g, ' ').trim()

/**
 * Map raw CSV headers -> canonical keys.
 * Returns { mapping: { canonicalKey: rawHeader }, extras: [{ key, label, header, type }] }
 * `extras` are columns we couldn't classify but want to keep as auto-typed fields.
 */
export function mapHeaders(headers = []) {
  const mapping = {}
  const used = new Set()

  for (const field of CANONICAL_FIELDS) {
    const matches = headers.filter(
      (h) => !used.has(h) && field.patterns.some((p) => p.test(cleanHeader(h))),
    )
    if (!matches.length) continue
    if (field.type === 'multi') {
      // Combine every matching column (the form branches selections across several).
      mapping[field.key] = matches
      matches.forEach((h) => used.add(h))
    } else {
      mapping[field.key] = matches[0]
      used.add(matches[0])
    }
  }

  const extras = headers
    .filter((h) => cleanHeader(h) && !used.has(h))
    .map((h) => ({ key: `extra:${h}`, label: cleanHeader(h), header: h, type: 'category' }))

  return { mapping, extras }
}

const MISSING = new Set(['', 'n/a', 'na', 'none', 'null', 'undefined', '-', '—'])
const isMissing = (v) => v == null || MISSING.has(String(v).trim().toLowerCase())

export function parseDate(v) {
  if (isMissing(v)) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export function parseNumber(v) {
  if (isMissing(v)) return null
  const m = String(v).match(/-?\d+(\.\d+)?/)
  return m ? Number(m[0]) : null
}

/** Split a multi-select answer ("a, b; c") into a clean array. */
export function parseMulti(v) {
  if (isMissing(v)) return []
  return String(v)
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter((s) => s && !isMissing(s))
}

export function cleanCategory(v) {
  return isMissing(v) ? null : String(v).trim()
}

/**
 * Turn raw row objects (keyed by raw header) into normalized records keyed by
 * canonical field key, with values coerced to the right type and missing values
 * handled consistently.
 */
export function normalizeRecords(rawRows = [], headers = []) {
  const { mapping, extras } = mapHeaders(headers)
  const fieldByKey = Object.fromEntries(CANONICAL_FIELDS.map((f) => [f.key, f]))

  const records = rawRows
    .map((row, i) => {
      const rec = { __id: i, __raw: row }
      for (const [key, header] of Object.entries(mapping)) {
        const type = fieldByKey[key].type
        if (type === 'multi') {
          // header is an array of columns — merge + dedupe each respondent's picks.
          const cols = Array.isArray(header) ? header : [header]
          const merged = cols.flatMap((h) => parseMulti(row[h]))
          rec[key] = [...new Set(merged)]
          continue
        }
        const raw = row[header]
        if (type === 'date') rec[key] = parseDate(raw)
        else if (type === 'number') rec[key] = parseNumber(raw)
        else if (type === 'text') rec[key] = isMissing(raw) ? '' : String(raw).trim()
        else rec[key] = cleanCategory(raw)
      }
      for (const ex of extras) rec[ex.key] = cleanCategory(row[ex.header])
      return rec
    })
    // drop fully-empty rows that Google sometimes appends
    .filter((rec) => Object.keys(rec).some((k) => !k.startsWith('__') && rec[k] != null && rec[k] !== '' && !(Array.isArray(rec[k]) && rec[k].length === 0)))

  return { records, mapping, extras, fields: CANONICAL_FIELDS }
}
