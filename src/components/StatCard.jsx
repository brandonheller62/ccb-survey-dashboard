/** Compact KPI tile for the overview row. */
export default function StatCard({ label, value, sub }) {
  return (
    <div className="card p-5">
      <div className="text-sm font-medium text-ink-soft">{label}</div>
      <div className="mt-1 font-serif text-3xl font-semibold text-ink">{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-soft">{sub}</div>}
    </div>
  )
}
