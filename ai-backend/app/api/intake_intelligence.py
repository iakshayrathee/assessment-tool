"""
Intake Intelligence API — POST /api/intake/profile

Generates or enriches the cumulative AI intake profile from multi-tab form data.
Called after each tab's "Save & Continue" — accepts partial data.
Uses caching to avoid re-running when no data has changed.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.agents.intake_agent import get_intake_agent
from app.services.cache_service import make_cache_key, get_cached, set_cached
from app.config import get_settings

router = APIRouter(prefix="/api/intake", tags=["Intake Intelligence"])


# ── Request / Response models ─────────────────────────────────────────────────

class IntakeProfileRequest(BaseModel):
    # Tab data — all optional; empty dict if tab not yet completed
    referral:     dict = {}
    demographics: dict = {}
    family:       dict = {}
    prenatal:     dict = {}
    postnatal:    dict = {}
    medical:      dict = {}
    educational:  dict = {}
    tabs_completed: list[str] = []
    skip_cache:   bool = False


class IntakeProfileResponse(BaseModel):
    # ── 7-section profile ──────────────────────────────────────────────────────
    child_context_summary: str = ""
    language_context:       str = ""
    educational_context:    str = ""
    family_home_context:    str = ""         # populated after Family tab
    contextual_factors:     list = []
    recommended_domains:    list = []
    missing_information:    list = []
    reasoning:              str = ""

    # ── Metadata ───────────────────────────────────────────────────────────────
    cumulative_context:  dict = {}
    contextual_flags:    list = []
    confidence:          str  = "LOW"
    tabs_completed:      list = []
    cached:              bool = False


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post("/profile", response_model=IntakeProfileResponse)
async def generate_intake_profile(req: IntakeProfileRequest):
    """Generate / update the cumulative AI Intake Profile.

    Accepts partial data — only the tabs included in tabs_completed are used.
    The same endpoint is called progressively after each tab save.
    Cost: ~$0.001/call, fully cacheable by input hash.
    """
    try:
        settings = get_settings()

        # Build the full input dict for cache keying
        input_payload = {
            "referral":      req.referral,
            "demographics":  req.demographics,
            "family":        req.family,
            "prenatal":      req.prenatal,
            "postnatal":     req.postnatal,
            "medical":       req.medical,
            "educational":   req.educational,
            "tabs_completed": sorted(req.tabs_completed),
        }

        cache_key = make_cache_key("intake", "profile", input_payload)

        # Check cache first
        if settings.enable_cache and not req.skip_cache:
            cached = get_cached(cache_key)
            if cached:
                return IntakeProfileResponse(**cached, cached=True)

        # Run the 3-node LangGraph
        agent = get_intake_agent()
        result = await agent.ainvoke({
            "referral":      req.referral,
            "demographics":  req.demographics,
            "family":        req.family,
            "prenatal":      req.prenatal,
            "postnatal":     req.postnatal,
            "medical":       req.medical,
            "educational":   req.educational,
            "tabs_completed": req.tabs_completed,
        })

        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])

        profile = result.get("intake_profile", {})
        ctx     = result.get("cumulative_context", {})
        flags   = result.get("contextual_flags", [])

        response_data = {
            "child_context_summary": profile.get("child_context_summary", ""),
            "language_context":      profile.get("language_context", ""),
            "educational_context":   profile.get("educational_context", ""),
            "family_home_context":   profile.get("family_home_context", ""),
            "contextual_factors":    profile.get("contextual_factors", []),
            "recommended_domains":   profile.get("recommended_domains", []),
            "missing_information":   profile.get("missing_information", []),
            "reasoning":             profile.get("reasoning", ""),
            "cumulative_context":    ctx,
            "contextual_flags":      flags,
            "confidence":            profile.get("confidence", ctx.get("confidence", "LOW")),
            "tabs_completed":        profile.get("tabs_completed", req.tabs_completed),
        }

        # Cache the result
        if settings.enable_cache:
            set_cached(cache_key, response_data, ttl=settings.cache_ttl_seconds)

        return IntakeProfileResponse(**response_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
