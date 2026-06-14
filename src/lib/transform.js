/**
 * Pure aggregation + filtering helpers. No React, no Papaparse — just data in,
 * chart-ready data out. Everything here is unit-testable in isolation.
 */

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1)
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const monthLabel = (d) => d.toLocaleString('en-US', { month: 'short', year: '2-digit' })

/** Min/max submission date across records (ignores missing). */
export function dateExtent(records) {
  const times = records.map((r) => r.timestamp).filter(Boolean).map((d) => d.getTime())
  if (!times.length) return { min: null, max: null }
  return { min: new Date(Math.min(...times)), max: new Date(Math.max(...times)) }
}

/** Responses per month -> [{ key, label, date, count }], gap-filled. */
export function responsesOverTime(records) {
  const dated = records.map((r) => r.timestamp).filter(Boolean).sort((a, b) => a - b)
  if (!dated.length) return []

  const counts = new Map()
  for (const d of dated) counts.set(monthKey(d), (counts.get(monthKey(d)) || 0) + 1)

  const out = []
  const cursor = startOfMonth(dated[0])
  const last = startOfMonth(dated[dated.length - 1])
  while (cursor <= last) {
    out.push({
      key: monthKey(cursor),
      label: monthLabel(cursor),
      date: new Date(cursor),
      count: counts.get(monthKey(cursor)) || 0,
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return out
}

/**
 * Count a categorical field but keep a fixed display order (e.g. treatment-journey
 * stages). Values not in `order` are appended afterward, count-sorted. Zero-count
 * stages in `order` are dropped so empty filters don't show bare bars.
 */
export function orderedCountBy(records, key, order = []) {
  const counts = new Map(countBy(records, key).map((d) => [d.name, d.value]))
  const ranked = []
  for (const name of order) {
    if (counts.has(name)) { ranked.push({ name, value: counts.get(name) }); counts.delete(name) }
  }
  const rest = [...counts.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  return [...ranked, ...rest]
}

/** Count a single-value categorical field -> [{ name, value }] sorted desc. */
export function countBy(records, key, { includeMissing = false } = {}) {
  const counts = new Map()
  for (const r of records) {
    const v = r[key]
    if (v == null || v === '') {
      if (includeMissing) counts.set('No answer', (counts.get('No answer') || 0) + 1)
      continue
    }
    counts.set(v, (counts.get(v) || 0) + 1)
  }
  return [...counts.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

/** Count a multi-select field (each selection counts once) -> ranked list. */
export function multiCountBy(records, key, { limit } = {}) {
  const counts = new Map()
  for (const r of records) {
    const arr = Array.isArray(r[key]) ? r[key] : []
    for (const v of arr) counts.set(v, (counts.get(v) || 0) + 1)
  }
  const ranked = [...counts.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  return limit ? ranked.slice(0, limit) : ranked
}

/** Average rating + count of rated responses. */
export function ratingStats(records, key = 'rating') {
  const vals = records.map((r) => r[key]).filter((v) => typeof v === 'number')
  if (!vals.length) return { avg: null, count: 0 }
  return { avg: vals.reduce((a, b) => a + b, 0) / vals.length, count: vals.length }
}

/** Records that have non-empty open feedback. */
export function feedbackEntries(records, key = 'comment') {
  return records
    .filter((r) => typeof r[key] === 'string' && r[key].trim())
    .map((r) => ({ id: r.__id, text: r[key].trim(), date: r.timestamp, location: r.location, rating: r.rating }))
}

/**
 * Build the set of available filters from the data + schema.
 * Returns [{ key, label, options: [values] }] for every categorical/extra field
 * that actually has values present.
 */
export function buildFilterOptions(records, fields, extras = []) {
  const defs = [
    ...fields.filter((f) => f.type === 'category'),
    ...extras,
  ]
  return defs
    .map((f) => {
      const values = [...new Set(records.map((r) => r[f.key]).filter((v) => v != null && v !== ''))].sort()
      return { key: f.key, label: f.label, options: values }
    })
    .filter((f) => f.options.length > 1) // only useful filters
}

/**
 * Apply the active filter state to records.
 * filters = { dateFrom: Date|null, dateTo: Date|null, categories: { key: Set(values) } }
 */
export function applyFilters(records, filters = {}) {
  const { dateFrom, dateTo, categories = {} } = filters
  return records.filter((r) => {
    if (dateFrom && (!r.timestamp || r.timestamp < dateFrom)) return false
    if (dateTo && (!r.timestamp || r.timestamp > dateTo)) return false
    for (const [key, selected] of Object.entries(categories)) {
      if (!selected || selected.size === 0) continue
      if (!selected.has(r[key])) return false
    }
    return true
  })
}

export const fmtDateInput = (d) => (d ? d.toISOString().slice(0, 10) : '')
export const fmtDate = (d) => (d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—')
