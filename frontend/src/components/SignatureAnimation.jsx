export default function SignatureAnimation() {
  return (
    <div className="relative aspect-[4/3] w-full max-w-xl select-none">
      <svg
        viewBox="0 0 480 360"
        className="h-full w-full"
        role="img"
        aria-label="A rough hand-drawn flowchart animating into a clean, aligned version of itself"
      >
        {/* soft backdrop grid, evokes an infinite canvas */}
        <defs>
          <pattern id="dotgrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill="#E4E5F1" />
          </pattern>
        </defs>
        <rect width="480" height="360" fill="url(#dotgrid)" rx="24" />

        {/* ROUGH sketch layer */}
        <g className="animate-sketch-fade" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M56 66 Q120 52 176 70 Q142 84 140 122 Q138 150 60 140 Q38 108 56 66 Z" stroke="#1B1B2F" strokeWidth="3.4" />
          <path d="M232 58 Q300 50 336 78 Q310 96 306 118 Q234 128 226 96 Q222 74 232 58 Z" stroke="#1B1B2F" strokeWidth="3.4" />
          <path d="M96 168 Q90 210 112 246 Q150 268 188 250 Q214 236 208 200 Q202 172 168 172 Q126 168 96 168 Z" stroke="#1B1B2F" strokeWidth="3.4" />
          <path d="M292 150 L298 246" stroke="#1B1B2F" strokeWidth="3" />
          <path d="M158 138 Q168 158 178 172" stroke="#1B1B2F" strokeWidth="3" />
          <path d="M204 214 Q250 224 280 216" stroke="#1B1B2F" strokeWidth="3" />
          <circle cx="360" cy="200" r="26" stroke="#1B1B2F" strokeWidth="3" transform="rotate(-4 360 200)" />
          <path d="M306 200 Q322 202 334 200" stroke="#1B1B2F" strokeWidth="3" />
        </g>

        {/* CLEAN, snapped-to-grid layer */}
        <g className="animate-clean-fade" strokeLinecap="round" strokeLinejoin="round">
          <rect x="48" y="52" width="112" height="64" rx="10" fill="#EDEAFD" stroke="#6C5CE7" strokeWidth="2.5" />
          <rect x="232" y="48" width="104" height="60" rx="10" fill="#EDEAFD" stroke="#6C5CE7" strokeWidth="2.5" />
          <rect x="88" y="176" width="120" height="76" rx="12" fill="#E3FBF8" stroke="#17C3B2" strokeWidth="2.5" />
          <line x1="292" y1="108" x2="292" y2="176" stroke="#8B8DA3" strokeWidth="2" markerEnd="url(#arrow)" />
          <line x1="160" y1="84" x2="232" y2="78" stroke="#8B8DA3" strokeWidth="2" markerEnd="url(#arrow)" />
          <line x1="208" y1="214" x2="284" y2="214" stroke="#8B8DA3" strokeWidth="2" />
          <circle cx="360" cy="200" r="24" fill="#FFF3DC" stroke="#FFB627" strokeWidth="2.5" />
          <line x1="284" y1="214" x2="336" y2="200" stroke="#8B8DA3" strokeWidth="2" markerEnd="url(#arrow)" />
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#8B8DA3" />
            </marker>
          </defs>
        </g>

        {/* Wand cursor drifting near the rectangle being cleaned */}
        <g className="animate-cursor-drift">
          <circle cx="150" cy="70" r="3" fill="#6C5CE7" />
        </g>
      </svg>

      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-line bg-white px-4 py-1.5 shadow-soft">
        <span className="font-mono text-[11px] tracking-wide text-slate">rough sketch → clean diagram, live</span>
      </div>
    </div>
  )
}
