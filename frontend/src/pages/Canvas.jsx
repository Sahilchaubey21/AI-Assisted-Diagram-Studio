import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, wsUrl } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Toolbar from '../components/Toolbar.jsx'

let idCounter = 0
function nextId() {
  idCounter += 1
  return `el_${Date.now()}_${idCounter}`
}

function drawElement(ctx, el) {
  ctx.strokeStyle = el.color || '#1B1B2F'
  ctx.fillStyle = 'transparent'
  ctx.lineWidth = el.strokeWidth || 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (el.type === 'path' && el.points && el.points.length > 1) {
    ctx.beginPath()
    ctx.moveTo(el.points[0].x, el.points[0].y)
    for (let i = 1; i < el.points.length; i++) ctx.lineTo(el.points[i].x, el.points[i].y)
    ctx.stroke()
  } else if (el.type === 'rectangle') {
    const r = 6
    const { x, y, width: w, height: h } = el
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
    ctx.stroke()
  } else if (el.type === 'ellipse') {
    ctx.beginPath()
    ctx.ellipse(el.x + el.width / 2, el.y + el.height / 2, Math.abs(el.width) / 2, Math.abs(el.height) / 2, 0, 0, Math.PI * 2)
    ctx.stroke()
  } else if (el.type === 'line' && el.points && el.points.length >= 2) {
    ctx.beginPath()
    ctx.moveTo(el.points[0].x, el.points[0].y)
    ctx.lineTo(el.points[el.points.length - 1].x, el.points[el.points.length - 1].y)
    ctx.stroke()
  }
}

export default function Canvas() {
  const { diagramId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const canvasRef = useRef(null)
  const wsRef = useRef(null)
  const draftRef = useRef(null) // in-progress local element being drawn
  const startPointRef = useRef(null)
  const cursorThrottleRef = useRef(0)

  const [elements, setElements] = useState([])
  const [title, setTitle] = useState('Untitled diagram')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [presence, setPresence] = useState([])
  const [remoteCursors, setRemoteCursors] = useState({})
  const [remoteDrafts, setRemoteDrafts] = useState({})

  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#1B1B2F')
  const [strokeWidth, setStrokeWidth] = useState(3)

  // ---------- Load diagram + connect WebSocket ----------
  useEffect(() => {
    let active = true
    api.getDiagram(diagramId).then((d) => {
      if (!active) return
      setElements(d.content || [])
      setTitle(d.title)
      setLoading(false)
    })

    const socket = new WebSocket(wsUrl(diagramId))
    wsRef.current = socket

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      handleRemoteMessage(msg)
    }

    return () => {
      active = false
      socket.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagramId])

  function handleRemoteMessage(msg) {
    switch (msg.type) {
      case 'presence':
        setPresence(msg.users || [])
        break
      case 'cursor_move':
        setRemoteCursors((prev) => ({ ...prev, [msg.user_id]: { x: msg.x, y: msg.y, name: msg.user_name, color: msg.color } }))
        break
      case 'draw_start':
        setRemoteDrafts((prev) => ({ ...prev, [msg.stroke_id]: { ...msg.element, points: [msg.point] } }))
        break
      case 'draw_point':
        setRemoteDrafts((prev) => {
          const existing = prev[msg.stroke_id]
          if (!existing) return prev
          return { ...prev, [msg.stroke_id]: { ...existing, points: [...existing.points, msg.point] } }
        })
        break
      case 'draw_end':
        setRemoteDrafts((prev) => {
          const { [msg.stroke_id]: finished, ...rest } = prev
          if (finished) setElements((els) => [...els, { ...finished, id: msg.stroke_id }])
          return rest
        })
        break
      case 'shape_add':
        setElements((els) => [...els, msg.element])
        break
      case 'shape_remove':
        setElements((els) => els.filter((e) => e.id !== msg.element_id))
        break
      case 'clear':
        setElements([])
        break
      case 'ai_replace':
        setElements(msg.elements || [])
        break
      default:
        break
    }
  }

  function send(payload) {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }

  // ---------- Redraw canvas whenever elements or remote drafts change ----------
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    elements.forEach((el) => drawElement(ctx, el))
    Object.values(remoteDrafts).forEach((el) => drawElement(ctx, el))
  }, [elements, remoteDrafts])

  function getPoint(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  function handlePointerDown(e) {
    const point = getPoint(e)
    startPointRef.current = point

    if (tool === 'pen') {
      const id = nextId()
      draftRef.current = { id, type: 'path', points: [point], color, strokeWidth }
      send({ type: 'draw_start', stroke_id: id, point, element: { type: 'path', color, strokeWidth } })
    } else if (tool === 'eraser') {
      eraseNear(point)
    } else {
      const id = nextId()
      draftRef.current = { id, type: tool, x: point.x, y: point.y, width: 0, height: 0, points: [point, point], color, strokeWidth }
    }
  }

  function handlePointerMove(e) {
    const point = getPoint(e)

    // Throttled cursor broadcast for presence
    const now = Date.now()
    if (now - cursorThrottleRef.current > 45) {
      cursorThrottleRef.current = now
      send({ type: 'cursor_move', x: point.x, y: point.y })
    }

    if (!draftRef.current) return

    if (tool === 'pen') {
      draftRef.current.points.push(point)
      send({ type: 'draw_point', stroke_id: draftRef.current.id, point })
      // live-render the in-progress local stroke
      const ctx = canvasRef.current.getContext('2d')
      drawElement(ctx, draftRef.current)
    } else if (tool === 'rectangle' || tool === 'ellipse') {
      const start = startPointRef.current
      draftRef.current.x = Math.min(start.x, point.x)
      draftRef.current.y = Math.min(start.y, point.y)
      draftRef.current.width = Math.abs(point.x - start.x)
      draftRef.current.height = Math.abs(point.y - start.y)
      redrawWithDraft()
    } else if (tool === 'line') {
      draftRef.current.points = [startPointRef.current, point]
      redrawWithDraft()
    }
  }

  function redrawWithDraft() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    elements.forEach((el) => drawElement(ctx, el))
    Object.values(remoteDrafts).forEach((el) => drawElement(ctx, el))
    if (draftRef.current) drawElement(ctx, draftRef.current)
  }

  function handlePointerUp() {
    if (!draftRef.current) return
    const finished = draftRef.current
    draftRef.current = null

    if (tool === 'pen') {
      send({ type: 'draw_end', stroke_id: finished.id })
      setElements((els) => [...els, finished])
    } else if (['rectangle', 'ellipse', 'line'].includes(tool)) {
      if (finished.width < 3 && finished.height < 3 && tool !== 'line') return
      setElements((els) => [...els, finished])
      send({ type: 'shape_add', element: finished })
    }
  }

  function eraseNear(point) {
    const threshold = 14
    setElements((els) => {
      let removedId = null
      const kept = els.filter((el) => {
        const hit = isNear(el, point, threshold)
        if (hit) removedId = el.id
        return !hit
      })
      if (removedId) send({ type: 'shape_remove', element_id: removedId })
      return kept
    })
  }

  function isNear(el, point, threshold) {
    if (el.type === 'rectangle' || el.type === 'ellipse') {
      return (
        point.x >= el.x - threshold &&
        point.x <= el.x + el.width + threshold &&
        point.y >= el.y - threshold &&
        point.y <= el.y + el.height + threshold
      )
    }
    const pts = el.points || []
    return pts.some((p) => Math.hypot(p.x - point.x, p.y - point.y) < threshold)
  }

  function handleUndo() {
    setElements((els) => {
      if (els.length === 0) return els
      const last = els[els.length - 1]
      send({ type: 'shape_remove', element_id: last.id })
      return els.slice(0, -1)
    })
  }

  function handleClear() {
    if (!confirm('Clear the entire canvas for everyone?')) return
    setElements([])
    send({ type: 'clear' })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.updateDiagram(diagramId, { title, content: elements })
    } finally {
      setSaving(false)
    }
  }

  async function handleAiCleanUp() {
    const pathStrokes = elements.filter((el) => el.type === 'path')
    if (pathStrokes.length === 0) return
    setCleaning(true)
    try {
      const canvas = canvasRef.current
      const res = await api.cleanUp(
        pathStrokes.map((s) => ({ id: s.id, points: s.points, color: s.color, width: s.strokeWidth || 3 })),
        canvas.width,
        canvas.height,
      )
      const cleanedShapes = res.shapes.map((s) => ({ ...s, strokeWidth: 3 }))
      const nonPathElements = elements.filter((el) => el.type !== 'path')
      const merged = [...nonPathElements, ...cleanedShapes]
      setElements(merged)
      send({ type: 'ai_replace', elements: merged })
    } catch (err) {
      alert(`AI clean up failed: ${err.message}`)
    } finally {
      setCleaning(false)
    }
  }

  const handleTitleBlur = useCallback(() => {
    handleSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, elements])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-signal border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-canvas">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-line bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="btn-ghost !px-2.5 !py-1.5" aria-label="Back to dashboard">
            ←
          </button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="rounded-lg border border-transparent bg-transparent px-2 py-1 font-display text-base font-semibold text-ink hover:border-line focus:border-signal focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {presence.map((p) => (
              <span
                key={p.user_id}
                title={p.name}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white"
                style={{ backgroundColor: p.color }}
              >
                {p.name.charAt(0).toUpperCase()}
              </span>
            ))}
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-teal-light px-3 py-1 text-xs font-medium text-teal">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" /> Live
          </span>
          <button onClick={handleAiCleanUp} disabled={cleaning} className="btn-primary !bg-signal disabled:opacity-60">
            {cleaning ? 'Cleaning up…' : '✨ AI Clean Up'}
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-secondary disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      {/* Canvas area */}
      <div className="relative flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1400}
          height={900}
          className="h-full w-full cursor-crosshair bg-white"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />

        {/* Remote cursors */}
        {Object.entries(remoteCursors).map(([uid, c]) => (
          <div
            key={uid}
            className="pointer-events-none absolute z-20 flex items-center gap-1.5 transition-transform duration-75"
            style={{ transform: `translate(${c.x}px, ${c.y}px)` }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill={c.color}>
              <path d="M1 1l5.5 13 2-5.5L14 6.5z" />
            </svg>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white shadow-soft"
              style={{ backgroundColor: c.color }}
            >
              {c.name}
            </span>
          </div>
        ))}

        {/* Floating toolbar */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
          <Toolbar
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            strokeWidth={strokeWidth}
            setStrokeWidth={setStrokeWidth}
            onUndo={handleUndo}
            onClear={handleClear}
          />
        </div>
      </div>
    </div>
  )
}
