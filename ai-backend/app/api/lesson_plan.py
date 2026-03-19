"""
Lesson Plan API routes — /api/lesson-plan
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agents.lesson_plan_agent import get_lesson_plan_agent
from app.utils.langsmith_config import lesson_plan_run_config

router = APIRouter(prefix="/api/lesson-plan", tags=["Lesson Plan"])


class LessonPlanRequest(BaseModel):
    student_id: str
    week_number: int = 1


class LessonPlanResponse(BaseModel):
    student_id: str
    progress_analysis: str = ""
    lesson_plan: dict = {}
    suggested_activities: list = []
    suggested_resources: list = []
    motivation_strategy: str = ""
    estimated_time: int = 45
    areas_of_remediation: list = []
    status: str = "AI_DRAFT"
    editable: bool = True


@router.post("/suggest", response_model=LessonPlanResponse)
async def suggest_lesson_plan(req: LessonPlanRequest):
    """Generate a lesson plan suggestion for a student."""
    try:
        agent = get_lesson_plan_agent()
        config = lesson_plan_run_config(req.student_id, req.week_number)

        result = await agent.ainvoke(
            {
                "student_id": req.student_id,
                "week_number": req.week_number,
            },
            config=config,
        )

        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])

        return LessonPlanResponse(
            student_id=req.student_id,
            progress_analysis=result.get("progress_analysis", ""),
            lesson_plan=result.get("lesson_plan", {}),
            suggested_activities=result.get("suggested_activities", []),
            suggested_resources=result.get("suggested_resources", []),
            motivation_strategy=result.get("motivation_strategy", ""),
            estimated_time=result.get("estimated_time", 45),
            areas_of_remediation=result.get("areas_of_remediation", []),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
