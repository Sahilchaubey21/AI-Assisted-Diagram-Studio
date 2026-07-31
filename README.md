# Sketchline — AI-Assisted Collaborative Diagramming Tool

A real-time, web-based whiteboard where multiple users draw diagrams together,
with an AI assistant that cleans up and aligns rough sketches into
presentation-ready diagrams.

Built to match the enterprise project brief: real-time collaborative canvas
(WebSockets), AI diagram interpretation/cleaning, user auth + diagram storage,
a full frontend UI, and a documented, dockerized repo.

---

## 1. What's inside

```
ai-diagram-studio/
├── backend/            FastAPI + WebSockets + SQLAlchemy
│   ├── app/
│   │   ├── main.py             App entrypoint, CORS, router wiring
│   │   ├── models.py           User, Diagram DB tables
│   │   ├── schemas.py          Request/response validation
│   │   ├── security.py         Password hashing, JWT
│   │   ├── ai_service.py       AI clean-up engine (Anthropic + heuristic fallback)
│   │   ├── websocket_manager.py  Real-time room/broadcast logic
│   │   └── routers/            auth.py, diagrams.py, ai.py, ws.py
│   └── requirements.txt
├── frontend/            React (Vite) + Tailwind
│   └── src/
│       ├── pages/       Landing, Login, Register, Dashboard, Canvas
│       ├── components/  Navbar, Toolbar, SignatureAnimation
│       ├── context/     AuthContext (JWT session state)
│       └── api/client.js   REST + WebSocket client
└── docker-compose.yml   Postgres + backend + frontend, one command
```

## 2. Key features implemented

- **Real-time collaborative canvas** — WebSocket-backed, multi-user drawing
  sync (pen strokes, shapes, cursors, presence) with no page refresh.
- **AI Clean Up** — sends rough strokes to the backend, which either calls
  Anthropic's API (if you provide a key) to interpret the sketch's structure,
  or falls back to a genuine local geometric algorithm (bounding-box shape
  classification + Ramer–Douglas–Peucker path simplification) so the feature
  fully works with zero external API keys.
- **Auth** — JWT-based register/login, passwords hashed with bcrypt.
- **Diagram storage** — save/load diagrams per user, dashboard of past work.
- **Frontend UI** — drawing tools (pen, rectangle, ellipse, line, eraser),
  color/stroke picker, undo/clear, live presence avatars and cursors.

## 3. Run it locally (fastest way — no Docker, no external DB)

**Requirements:** Python 3.11+, Node.js 18+

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # defaults to a local SQLite file, works as-is
uvicorn app.main:app --reload --port 8000
```
Backend is now running at `http://localhost:8000` (docs at `/docs`).

### Frontend (in a second terminal)
```bash
cd frontend
npm install
cp .env.example .env            # defaults already point at localhost:8000
npm run dev
```
Open `http://localhost:5173`. Register an account, create a diagram, and
open the same diagram URL in a second browser tab (or incognito window) to
see real-time collaboration working between "two users."

## 4. Run it with Docker (Postgres instead of SQLite)

```bash
docker-compose up --build
```
This starts Postgres, the backend on `:8000`, and the frontend on `:5173`.

## 5. Enabling real AI interpretation (optional)

Without any key, "AI Clean Up" already works using the built-in geometric
heuristic (straightens lines, snaps closed loops to rectangles/ellipses).

To use actual AI-based interpretation:
1. Get an API key from https://console.anthropic.com
2. Set `ANTHROPIC_API_KEY=sk-ant-...` in `backend/.env` (or as an env var
   for the `backend` service in `docker-compose.yml`)
3. Restart the backend. No frontend changes needed — it automatically uses
   whichever engine responded (`res.engine` is `"anthropic"` or `"heuristic"`).

## 6. Things I can't do for you, and how to do them

I can't run a live, persistent, publicly-reachable server or database from
my side — this repo is a real, runnable app but you (or your team) need to
run/host it. Here's what each remaining step looks like:

- **Free hosting for a demo:** Backend → [Render](https://render.com) or
  [Railway](https://railway.app) (both support Docker + Postgres add-ons
  for free/cheap tiers). Frontend → [Vercel](https://vercel.com) or
  [Netlify](https://netlify.com), pointing `VITE_API_URL`/`VITE_WS_URL`
  at your deployed backend's URL (use `wss://` not `ws://` once it's HTTPS).
- **Getting a real database:** Either use the Postgres in `docker-compose.yml`,
  or a free hosted Postgres from Railway/Supabase/Neon — just paste their
  connection string into `DATABASE_URL`.
- **Getting the AI key:** see section 5 above.
- **Custom domain / HTTPS:** handled automatically by Vercel/Render once you
  add a domain in their dashboard — no server config needed on your end.

If you hit an error at any of these steps, paste it to me and I'll debug it
with you directly.

## 7. Suggested next iteration (Week 3–4 items from the original plan)

- User-to-user diagram sharing / permissions (currently diagrams are private
  to their creator — multi-owner sharing is a natural next step)
- Export diagram to PNG/SVG/PDF
- Persistent thumbnail generation on save (canvas → PNG snapshot)
- Text/label tool on the canvas (currently AI-suggested labels come back in
  the API response but aren't yet rendered — easy follow-up)
