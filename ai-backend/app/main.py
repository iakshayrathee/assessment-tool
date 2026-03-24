"""
FastAPI Application Entry Point — AI Backend for the Assessment Tool.

Provides 6 AI agent endpoints:
  POST /api/assessment/analyze    — Assessment Intelligence Agent
  POST /api/iep/generate          — IEP & Goal Planning Agent
  POST /api/lesson-plan/suggest   — Lesson Plan Agent
  POST /api/report/generate       — Report Generation Agent
  POST /api/risk/analyze          — Risk & Progress Agent
  POST /api/educator/insights     — Educator Intelligence Agent

Health check:
  GET /health
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import configure_langsmith, get_settings, validate_required_settings
from app.services.db_service import close_engine
from app.services.cache_service import cache_stats, invalidate, invalidate_all
from app.api.assessment import router as assessment_router
from app.api.iep import router as iep_router
from app.api.lesson_plan import router as lesson_plan_router
from app.api.reports import router as report_router
from app.api.risk import router as risk_router
from app.api.educator import router as educator_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle."""
    # Startup
    import os
    print("[AI Backend] Startup — checking env vars...")
    print(f"[AI Backend] OPENAI_API_KEY set: {bool(os.environ.get('OPENAI_API_KEY'))}")
    print(f"[AI Backend] DATABASE_URL set: {bool(os.environ.get('DATABASE_URL'))}")
    print(f"[AI Backend] BACKEND_API_URL: {os.environ.get('BACKEND_API_URL', '(not set)')}")
    print(f"[AI Backend] REDIS_URL set: {bool(os.environ.get('REDIS_URL'))}")
    print(f"[AI Backend] PORT: {os.environ.get('PORT', '(not set, defaulting to 8000)')}")

    validate_required_settings()  # Fail fast if OPENAI_API_KEY is missing
    configure_langsmith()
    settings = get_settings()
    print(f"[AI Backend] Starting — model: {settings.default_model}")
    print(f"[AI Backend] LangSmith tracing: {settings.langchain_tracing_v2}")
    db_url_safe = settings.database_url[:40].replace("://", "://<redacted>@") if "://" in settings.database_url else settings.database_url[:40]
    print(f"[AI Backend] Database URL prefix: {db_url_safe}...")

    yield

    # Shutdown
    await close_engine()
    print("🧠 AI Backend shutdown complete")


app = FastAPI(
    title="Assessment Tool AI Backend",
    description="AI-powered agents for student assessment analysis, IEP planning, "
                "lesson plan generation, report creation, risk analysis, and educator insights.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — origins loaded from settings (set cors_origins in .env for production)
_settings = get_settings()
_cors_origins = [
    o.strip() for o in _settings.cors_origins.split(",") if o.strip()
] or ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(assessment_router)
app.include_router(iep_router)
app.include_router(lesson_plan_router)
app.include_router(report_router)
app.include_router(risk_router)
app.include_router(educator_router)


@app.get("/health")
async def health_check():
    settings = get_settings()
    stats = cache_stats()
    return {
        "status": "healthy",
        "service": "ai-backend",
        "model": settings.default_model,
        "report_model": settings.report_model,
        "langsmith_enabled": settings.langchain_tracing_v2,
        "cache": stats,
        "optimizations": {
            "json_mode": settings.use_json_mode,
            "caching_enabled": settings.enable_cache,
            "batch_calls": settings.enable_batch_calls,
        },
    }


@app.get("/cache/stats")
async def get_cache_stats():
    """View cache statistics to monitor cost savings."""
    return cache_stats()


@app.post("/cache/invalidate/{agent}/{target_id}")
async def invalidate_cache(agent: str, target_id: str):
    """Invalidate cache for a specific agent + target (e.g., after new assessment)."""
    count = invalidate(agent, target_id)
    return {"invalidated": count, "agent": agent, "target_id": target_id}


@app.post("/cache/clear")
async def clear_cache():
    """Clear all cached results."""
    count = invalidate_all()
    return {"cleared": count}


@app.get("/")
async def root():
    return {
        "service": "Assessment Tool AI Backend",
        "version": "1.0.0",
        "endpoints": {
            "assessment": "POST /api/assessment/analyze",
            "iep": "POST /api/iep/generate",
            "lesson_plan": "POST /api/lesson-plan/suggest",
            "report": "POST /api/report/generate",
            "risk": "POST /api/risk/analyze",
            "educator": "POST /api/educator/insights",
            "health": "GET /health",
            "docs": "GET /docs",
        },
    }
