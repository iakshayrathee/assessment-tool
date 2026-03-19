"""
Assessment API routes — /api/assessment (with caching)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agents.assessment_agent import get_assessment_agent
from app.utils.langsmith_config import assessment_run_config
from app.services.cache_service import make_cache_key, get_cached, set_cached
from app.config import get_settings

router = APIRouter(prefix="/api/assessment", tags=["Assessment Intelligence"])


class AssessmentRequest(BaseModel):
    student_id: str
    assessment_type: str = "ALL"
    skip_cache: bool = False  # Force re-processing


class AssessmentResponse(BaseModel):
    student_id: str
    symptom_analysis: dict = {}
    severity_scores: dict = {}
    domain_profile: dict = {}
    risk_classification: str = ""
    differential_indicators: list = []
    recommended_next_steps: list = []
    status: str = "AI_DRAFT"
    editable: bool = True
    cached: bool = False  # Whether this result came from cache


@router.post("/analyze", response_model=AssessmentResponse)
async def analyze_assessment(req: AssessmentRequest):
    """Run the Assessment Intelligence Agent for a student.
    
    Cost: ~$0.003 per call (GPT-4o-mini, 2 LLM calls).
    With caching: $0 if student data hasn't changed.
    """
    try:
        settings = get_settings()

        # Compute cache key once; reuse for both get and set
        cache_key = make_cache_key("assessment", req.student_id, {"type": req.assessment_type})

        # Check cache first
        if settings.enable_cache and not req.skip_cache:
            cached = get_cached(cache_key)
            if cached:
                return AssessmentResponse(**cached, cached=True)

        agent = get_assessment_agent()
        config = assessment_run_config(req.student_id, req.assessment_type)

        result = await agent.ainvoke(
            {"student_id": req.student_id, "assessment_type": req.assessment_type},
            config=config,
        )

        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])

        response_data = {
            "student_id": req.student_id,
            "symptom_analysis": result.get("symptom_analysis", {}),
            "severity_scores": result.get("severity_scores", {}),
            "domain_profile": result.get("domain_profile", {}),
            "risk_classification": result.get("risk_classification", ""),
            "differential_indicators": result.get("differential_indicators", []),
            "recommended_next_steps": result.get("recommended_next_steps", []),
        }

        # Cache the result
        if settings.enable_cache:
            set_cached(cache_key, response_data, ttl=settings.cache_ttl_seconds)

        return AssessmentResponse(**response_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
