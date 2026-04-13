"""
FastAPI backend — Green Grass Heritage
Serves only the REST API and resort photos.
The frontend is a separate static site (frontend/).
"""
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.config import get_settings
from src.api.routes import router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="2.0.0",
    description=(
        "Green Grass Heritage — AI-powered booking assistant API. "
        "Serves chat, room availability, and booking endpoints."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────
# Allow the frontend dev server (port 3000) and any origin during development.
# Restrict to your actual domain(s) in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API routes ────────────────────────────────────────────────────
app.include_router(router)

# ── Serve resort photos ───────────────────────────────────────────
_root       = Path(__file__).resolve().parent.parent.parent
_photos_dir = _root / "photos"

if _photos_dir.is_dir():
    app.mount("/gallery", StaticFiles(directory=_photos_dir), name="gallery")

# ── Root health/info ──────────────────────────────────────────────
@app.get("/", tags=["info"])
async def root():
    return {
        "service": "Green Grass Heritage — API",
        "version": "2.0.0",
        "status":  "running",
        "docs":    "/docs",
        "health":  "/api/v1/health",
        "note":    "Frontend is served separately on port 3000.",
    }
