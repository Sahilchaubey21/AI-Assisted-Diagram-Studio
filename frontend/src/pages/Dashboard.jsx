import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { api } from '../api/client.js'

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [diagrams, setDiagrams] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api
      .listDiagrams()
      .then(setDiagrams)
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    setCreating(true)
    try {
      const diagram = await api.createDiagram('Untitled diagram')
      navigate(`/canvas/${diagram.id}`)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation()
    if (!confirm('Delete this diagram? This cannot be undone.')) return
    await api.deleteDiagram(id)
    setDiagrams((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Your diagrams</h1>
            <p className="mt-1 text-sm text-slate">Pick one up where you left off, or start fresh.</p>
          </div>
          <button onClick={handleCreate} disabled={creating} className="btn-primary disabled:opacity-60">
            {creating ? 'Creating…' : '+ New diagram'}
          </button>
        </div>

        {loading ? (
          <div className="mt-16 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-signal border-t-transparent" />
          </div>
        ) : diagrams.length === 0 ? (
          <div className="card mt-8 flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="h-12 w-12 rounded-xl bg-signal-light" />
            <h3 className="font-display text-lg font-semibold text-ink">Nothing here yet</h3>
            <p className="max-w-xs text-sm text-slate">
              Create your first diagram and invite your team to sketch alongside you.
            </p>
            <button onClick={handleCreate} className="btn-primary mt-2">
              Create a diagram
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {diagrams.map((d) => (
              <button
                key={d.id}
                onClick={() => navigate(`/canvas/${d.id}`)}
                className="card group relative flex flex-col overflow-hidden text-left transition-transform hover:-translate-y-0.5"
              >
                <div className="flex h-32 items-center justify-center bg-canvasdim">
                  {d.thumbnail ? (
                    <img src={d.thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                      <rect x="6" y="8" width="20" height="14" rx="3" stroke="#6C5CE7" strokeWidth="2" />
                      <circle cx="42" cy="38" r="9" stroke="#17C3B2" strokeWidth="2" />
                      <line x1="20" y1="22" x2="20" y2="30" stroke="#8B8DA3" strokeWidth="2" />
                    </svg>
                  )}
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-display text-sm font-semibold text-ink">{d.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-light">Updated {timeAgo(d.updated_at)}</p>
                  </div>
                  <span
                    onClick={(e) => handleDelete(d.id, e)}
                    role="button"
                    tabIndex={0}
                    className="rounded-lg p-1.5 text-slate-light opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    aria-label="Delete diagram"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 4h10M6.5 4V2.5h3V4M4.5 4l.5 9.5h6l.5-9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
