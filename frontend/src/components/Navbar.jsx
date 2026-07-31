import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-display text-sm font-bold text-white">
            S
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Sketchline</span>
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="btn-ghost">
                Your diagrams
              </Link>
              <div className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ backgroundColor: user.avatar_color }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm font-medium text-ink">{user.name}</span>
              </div>
              <button
                className="btn-ghost"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary">
                Start for free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
