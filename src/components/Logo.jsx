/** Simple inline CCB wordmark — heart + name, no external asset needed. */
export default function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-ccb-500 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M12 21s-7.5-4.6-10-9.3C.6 8.3 2.2 5 5.4 5c2 0 3.3 1.1 4.1 2.3l.7 1 .7-1C11.7 6.1 13 5 15 5c3.2 0 4.8 3.3 3.4 6.7C19.5 16.4 12 21 12 21z" />
        </svg>
      </span>
      <div className="leading-tight">
        <div className="font-serif text-lg font-semibold text-ink">Cancer Care Baskets</div>
        <div className="text-xs text-ink-soft">Comfort &amp; hope, one basket at a time.</div>
      </div>
    </div>
  )
}
