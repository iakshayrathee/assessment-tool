"""
IEP API routes — /api/iep (with caching)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agents.iep_agent import get_iep_agent
from app.utils.langsmith_config import iep_run_config
from app.services.cache_service import make_cache_key, get_cached, set_cached
from app.config import get_settings

router = APIRouter(prefix="/api/iep", tags=["IEP & Goal Planning"])


class IEPRequest(BaseModel):
    student_id: str
    assessment_analysis: dict = {}
    skip_cache: bool = False


class IEPResponse(BaseModel):
    student_id: str
    gap_analysis: dict = {}
    generated_goals: list = []
    generated_ltp: dict = {}
    generated_stps: list = []
    generated_wlps: list = []
    status: str = "AI_DRAFT"
    editable: bool = True
    cached: bool = False


@router.post("/generate", response_model=IEPResponse)
async def generate_iep(req: IEPRequest):
    """Generate IEP goals, LTP, STP, and WLP.
    
    Cost: ~$0.003 per call (GPT-4o-mini, 2 LLM calls — batched).
    With caching: $0 if student assessment data hasn't changed.
    """
    try:
        settings = get_settings()

        if settings.enable_cache and not req.skip_cache:
            cache_key = make_cache_key("iep", req.student_id, req.assessment_analysis)
            cached = get_cached(cache_key)
            if cached:
                return IEPResponse(**cached, cached=True)

        agent = get_iep_agent()
        config = iep_run_config(req.student_id)

        result = await agent.ainvoke(
            {"student_id": req.student_id, "assessment_analysis": req.assessment_analysis},
            config=config,
        )

        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])

        response_data = {
            "student_id": req.student_id,
            "gap_analysis": result.get("gap_analysis", {}),
            "generated_goals": result.get("generated_goals", []),
            "generated_ltp": result.get("generated_ltp", {}),
            "generated_stps": result.get("generated_stps", []),
            "generated_wlps": result.get("generated_wlps", []),
        }

        if settings.enable_cache:
            cache_key = make_cache_key("iep", req.student_id, req.assessment_analysis)
            set_cached(cache_key, response_data, ttl=settings.cache_ttl_seconds)

        return IEPResponse(**response_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
