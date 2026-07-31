from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, diagrams, ai, ws

# Creates tables on first run. For production, swap this for real
# migrations (e.g. Alembic) instead of create_all.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Diagram Studio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(diagrams.router)
app.include_router(ai.router)
app.include_router(ws.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
