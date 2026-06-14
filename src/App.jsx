import { useCallback, useEffect, useState } from 'react'
import Logo from './components/Logo.jsx'
import Dashboard from './components/Dashboard.jsx'
import { loadResponses } from './lib/loadData.js'

const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''

// ?embed=1 renders just the charts (no header/footer/refresh) for iframe-embedding
// inside cancercarebaskets.org.
const EMBED = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('embed') === '1'

export default function App() {
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [dataset, setDataset] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const data = await loadResponses()
      setDataset(data)
      setStatus('ready')
    } catch (e) {
      setError(e.message || String(e))
      setStatus('error')
    }
  }, [])

  useEffect(() => { load() }, [load])

  // In embed mode, report our height to the parent page so the iframe can size
  // itself with no inner scrollbar.
  useEffect(() => {
    if (!EMBED) return
    const post = () => window.parent?.postMessage(
      { type: 'ccb-embed-height', height: document.body.scrollHeight }, '*',
    )
    post()
    const ro = new ResizeObserver(post)
    ro.observe(document.body)
    window.addEventListener('load', post)
    return () => { ro.disconnect(); window.removeEventListener('load', post) }
  }, [status, dataset])

  return (
    <div className={EMBED ? 'bg-transparent' : 'min-h-screen'}>
      {!EMBED && (
        <header className="sticky top-0 z-10 border-b border-ccb-100 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Logo />
            <div className="flex items-center gap-3 text-sm text-ink-soft">
              {dataset && (
                <span className="hidden sm:inline">
                  {dataset.records.length} responses
                  {dataset.fetchedAt && ` · updated ${fmtTime(dataset.fetchedAt)}`}
                </span>
              )}
              <button className="btn-ghost" onClick={load} disabled={status === 'loading'}>
                <svg viewBox="0 0 24 24" className={`h-4 w-4 ${status === 'loading' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={EMBED ? 'mx-auto max-w-6xl px-2 py-4' : 'mx-auto max-w-6xl px-4 py-8'}>
        {dataset?.sample && status === 'ready' && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>Showing sample data.</strong> No Google Sheet is connected yet — add the service-account
            credentials (see README) and refresh to see live survey responses.
          </div>
        )}

        {status === 'loading' && <LoadingState />}
        {status === 'error' && <ErrorState message={error} onRetry={load} />}
        {status === 'ready' && dataset && <Dashboard records={dataset.records} dataset={dataset} />}
      </main>

      {!EMBED && (
        <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-ink-soft">
          Cancer Care Baskets · Comfort &amp; hope, one basket at a time.
        </footer>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="grid place-items-center py-24 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ccb-200 border-t-ccb-500" />
      <p className="mt-4 text-sm text-ink-soft">Loading survey responses…</p>
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="mx-auto max-w-lg">
      <div className="card border border-ccb-200 p-8 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-ccb-100 text-ccb-600">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-serif text-lg font-semibold text-ink">Couldn't load the survey data</h2>
        <p className="mt-2 break-words text-sm text-ink-soft">{message}</p>
        <button className="btn-primary mt-5" onClick={onRetry}>Try again</button>
      </div>
    </div>
  )
}
