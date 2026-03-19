"""
Report Generation API routes — /api/report (with caching)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agents.report_agent import get_report_agent
from app.utils.langsmith_config import report_run_config
from app.services.cache_service import make_cache_key, get_cached, set_cached
from app.config import get_settings

router = APIRouter(prefix="/api/report", tags=["Report Generation"])


class ReportRequest(BaseModel):
    report_type: str  # ASSESSMENT | LESSON_PLAN | PARENT | SCHOOL | CENTER
    target_id: str
    educator_id: str = ""
    skip_cache: bool = False


class ReportResponse(BaseModel):
    report_type: str
    target_id: str
    final_report: dict = {}
    metadata: dict = {}
    status: str = "AI_DRAFT"
    editable: bool = True
    cached: bool = False


@router.post("/generate", response_model=ReportResponse)
async def generate_report(req: ReportRequest):
    """Generate an AI report.
    
    Cost: ~$0.006 per call (GPT-4o-mini, 1 LLM call).
    With caching: $0 if student data hasn't changed.
    """
    valid_types = ("ASSESSMENT", "LESSON_PLAN", "PARENT", "SCHOOL")
    if req.report_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid report_type. Must be one of: {', '.join(valid_types)}")

    try:
        settings = get_settings()

        if settings.enable_cache and not req.skip_cache:
            cache_key = make_cache_key("report", req.target_id, {"type": req.report_type})
            cached = get_cached(cache_key)
            if cached:
                return ReportResponse(**cached, cached=True)

        agent = get_report_agent()
        config = report_run_config(req.target_id, req.report_type)

        result = await agent.ainvoke(
            {"report_type": req.report_type, "target_id": req.target_id, "educator_id": req.educator_id},
            config=config,
        )

        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])

        response_data = {
            "report_type": req.report_type,
            "target_id": req.target_id,
            "final_report": result.get("final_report", {}),
            "metadata": result.get("metadata", {}),
        }

        if settings.enable_cache:
            cache_key = make_cache_key("report", req.target_id, {"type": req.report_type})
            set_cached(cache_key, response_data, ttl=settings.cache_ttl_seconds)

        return ReportResponse(**response_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
