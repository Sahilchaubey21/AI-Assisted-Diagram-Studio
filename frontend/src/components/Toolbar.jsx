const TOOLS = [
  { id: 'pen', label: 'Pen', icon: '✎' },
  { id: 'rectangle', label: 'Rectangle', icon: '▭' },
  { id: 'ellipse', label: 'Ellipse', icon: '◯' },
  { id: 'line', label: 'Line', icon: '╱' },
  { id: 'eraser', label: 'Eraser', icon: '⌫' },
]

const COLORS = ['#1B1B2F', '#6C5CE7', '#17C3B2', '#FFB627', '#FF6B9D', '#4C6FFF']

export default function Toolbar({ tool, setTool, color, setColor, strokeWidth, setStrokeWidth, onUndo, onClear }) {
  return (
    <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-line bg-white px-2 py-2 shadow-card">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTool(t.id)}
          title={t.label}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-base transition-colors ${
            tool === t.id ? 'bg-signal text-white' : 'text-slate hover:bg-canvasdim hover:text-ink'
          }`}
        >
          {t.icon}
        </button>
      ))}

      <div className="mx-1 h-6 w-px bg-line" />

      <div className="flex items-center gap-1.5 px-1">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            title={c}
            className={`h-6 w-6 rounded-full border-2 transition-transform ${
              color === c ? 'scale-110 border-ink' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="mx-1 h-6 w-px bg-line" />

      <input
        type="range"
        min="1"
        max="12"
        value={strokeWidth}
        onChange={(e) => setStrokeWidth(Number(e.target.value))}
        className="w-16 accent-signal"
        title="Stroke width"
      />

      <div className="mx-1 h-6 w-px bg-line" />

      <button onClick={onUndo} title="Undo" className="flex h-9 w-9 items-center justify-center rounded-full text-slate hover:bg-canvasdim hover:text-ink">
        ↶
      </button>
      <button onClick={onClear} title="Clear canvas" className="flex h-9 w-9 items-center justify-center rounded-full text-slate hover:bg-red-50 hover:text-red-500">
        🗑
      </button>
    </div>
  )
}
