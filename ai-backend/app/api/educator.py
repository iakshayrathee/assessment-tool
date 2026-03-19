"""
Educator Intelligence API routes — /api/educator
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agents.educator_agent import get_educator_agent
from app.utils.langsmith_config import educator_run_config

router = APIRouter(prefix="/api/educator", tags=["Educator Intelligence"])


class EducatorRequest(BaseModel):
    educator_id: str


class EducatorResponse(BaseModel):
    educator_id: str
    performance_summary: dict = {}
    mentoring_insights: list = []
    training_recommendations: list = []
    student_priority_list: list = []


@router.post("/insights", response_model=EducatorResponse)
async def get_educator_insights(req: EducatorRequest):
    """Analyze an educator's effectiveness and provide mentoring insights."""
    try:
        agent = get_educator_agent()
        config = educator_run_config(req.educator_id)

        result = await agent.ainvoke(
            {"educator_id": req.educator_id},
            config=config,
        )

        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])

        return EducatorResponse(
            educator_id=req.educator_id,
            performance_summary=result.get("performance_summary", {}),
            mentoring_insights=result.get("mentoring_insights", []),
            training_recommendations=result.get("training_recommendations", []),
            student_priority_list=result.get("student_priority_list", []),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
