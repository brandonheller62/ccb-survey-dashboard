/** Titled container for any chart, with empty-state handling. */
export default function ChartCard({ title, subtitle, children, isEmpty, empty = 'No data for the current filters.', className = '' }) {
  return (
    <section className={`card flex flex-col p-5 ${className}`}>
      <header className="mb-3">
        <h3 className="font-serif text-base font-semibold text-ink">{title}</h3>
        {subtitle && <p className="text-xs text-ink-soft">{subtitle}</p>}
      </header>
      <div className="min-h-[240px] flex-1">
        {isEmpty ? (
          <div className="grid h-full min-h-[200px] place-items-center text-sm text-ink-soft">{empty}</div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
