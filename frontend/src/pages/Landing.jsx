import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import SignatureAnimation from '../components/SignatureAnimation.jsx'

const FEATURES = [
  {
    title: 'Draw together, live',
    body: 'Every stroke, shape, and cursor syncs across your team in real time over WebSockets — no refresh, no conflicts.',
    accent: 'signal',
  },
  {
    title: 'One click to clean up',
    body: 'Rough boxes and wobbly circles snap into an aligned, presentable diagram the moment you ask the AI to tidy up.',
    accent: 'teal',
  },
  {
    title: 'Saved, not lost',
    body: 'Diagrams autosave to your account and reopen exactly where you left off, from any device you sign into.',
    accent: 'amber',
  },
]

const STEPS = [
  { label: 'Sketch', body: 'Rough out boxes, arrows, and notes with the pen tool — speed over precision.' },
  { label: 'Invite', body: 'Share the diagram link. Teammates join the same canvas and draw alongside you.' },
  { label: 'Clean up', body: 'Hit "AI Clean Up" to snap shapes to a grid and straighten every connector.' },
  { label: 'Present', body: 'Save it, and it is ready to drop into a doc or deck — no redrawing required.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />

      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="eyebrow">Real-time · AI-assisted · Free to start</span>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink md:text-5xl">
            Sketch fast.
            <br />
            Let the AI make it presentable.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate">
            Sketchline is a collaborative whiteboard built for teams who think in boxes and arrows.
            Draw messy, draw fast — the AI cleans up and aligns it while you keep moving.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link to="/register" className="btn-primary">
              Start diagramming
            </Link>
            <Link to="/login" className="btn-secondary">
              I have an account
            </Link>
          </div>
        </div>
        <div className="flex justify-center">
          <SignatureAnimation />
        </div>
      </section>

      <section className="border-y border-line bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <span className="eyebrow">Why teams switch</span>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6">
                <div
                  className={`mb-4 h-9 w-9 rounded-lg ${
                    f.accent === 'signal' ? 'bg-signal-light' : f.accent === 'teal' ? 'bg-teal-light' : 'bg-amber-light'
                  }`}
                />
                <h3 className="font-display text-lg font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <span className="eyebrow">How it works</span>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.label} className="relative pl-0">
              <span className="font-mono text-xs text-slate-light">{String(i + 1).padStart(2, '0')}</span>
              <h4 className="mt-2 font-display text-base font-semibold text-ink">{s.label}</h4>
              <p className="mt-1.5 text-sm leading-relaxed text-slate">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="card flex flex-col items-start justify-between gap-6 bg-ink p-10 md:flex-row md:items-center">
          <div>
            <h3 className="font-display text-2xl font-semibold text-white">Ready to sketch with your team?</h3>
            <p className="mt-1.5 text-sm text-white/70">No credit card. Your first diagram takes under a minute.</p>
          </div>
          <Link to="/register" className="btn-primary shrink-0">
            Create your first diagram
          </Link>
        </div>
      </section>

      <footer className="border-t border-line py-8">
        <div className="mx-auto max-w-6xl px-6 text-sm text-slate-light">
          Sketchline — built as an AI-assisted collaborative diagramming demo.
        </div>
      </footer>
    </div>
  )
}
