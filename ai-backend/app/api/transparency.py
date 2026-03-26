"""
Transparency API — /api/transparency

Triggers existing AI agents (from app.agents) and returns their full state
including raw DB data gathered, prompts used, and AI responses.
No new agents or custom flows — purely invokes the existing compiled LangGraph agents.
"""

import time
import traceback
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agents import (
    get_assessment_agent,
    get_iep_agent,
    get_lesson_plan_agent,
    get_report_agent,
    get_risk_agent,
    get_educator_agent,
)

router = APIRouter(prefix="/api/transparency", tags=["Transparency"])


class TransparencyRequest(BaseModel):
    agent: str  # assessment | iep | lesson_plan | report | risk | educator
    student_id: str = ""
    educator_id: str = ""
    target_id: str = ""
    report_type: str = "ASSESSMENT"
    week_number: int = 1
    scope: str = "STUDENT"


def _ser(obj):
    """Make any object JSON-serialisable."""
    if obj is None:
        return None
    if isinstance(obj, (str, int, float, bool)):
        return obj
    if isinstance(obj, dict):
        return {k: _ser(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_ser(v) for v in obj]
    if isinstance(obj, datetime):
        return obj.isoformat()
    try:
        return str(obj)
    except Exception:
        return repr(obj)


@router.post("/trigger")
async def trigger_agent(req: TransparencyRequest):
    """
    Trigger an existing AI agent and return its FULL LangGraph state.
    This uses the exact same compiled agent from app.agents — no custom logic.
    The returned state contains all raw data, intermediate analyses, and AI responses.
    """
    start = time.time()
    agent_name = req.agent.lower().strip()

    try:
        if agent_name == "assessment":
            if not req.student_id:
                raise HTTPException(status_code=400, detail="student_id is required")
            agent = get_assessment_agent()
            state = await agent.ainvoke({
                "student_id": req.student_id,
                "assessment_type": "ALL",
            })

        elif agent_name == "iep":
            if not req.student_id:
                raise HTTPException(status_code=400, detail="student_id is required")
            agent = get_iep_agent()
            state = await agent.ainvoke({
                "student_id": req.student_id,
                "assessment_analysis": {},
            })

        elif agent_name == "lesson_plan":
            if not req.student_id:
                raise HTTPException(status_code=400, detail="student_id is required")
            agent = get_lesson_plan_agent()
            state = await agent.ainvoke({
                "student_id": req.student_id,
                "week_number": req.week_number,
            })

        elif agent_name == "report":
            tid = req.target_id or req.student_id
            if not tid:
                raise HTTPException(status_code=400, detail="target_id or student_id is required")
            agent = get_report_agent()
            state = await agent.ainvoke({
                "report_type": req.report_type,
                "target_id": tid,
                "educator_id": req.educator_id,
            })

        elif agent_name == "risk":
            tid = req.target_id or req.student_id
            if not tid:
                raise HTTPException(status_code=400, detail="target_id or student_id is required")
            agent = get_risk_agent()
            state = await agent.ainvoke({
                "scope": req.scope,
                "target_id": tid,
            })

        elif agent_name == "educator":
            if not req.educator_id:
                raise HTTPException(status_code=400, detail="educator_id is required")
            agent = get_educator_agent()
            state = await agent.ainvoke({
                "educator_id": req.educator_id,
            })

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown agent: {agent_name}. Must be one of: assessment, iep, lesson_plan, report, risk, educator",
            )

        elapsed = round(time.time() - start, 2)
        return {
            "agent": agent_name,
            "timestamp": datetime.now().isoformat(),
            "elapsed_seconds": elapsed,
            "state": _ser(state),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"{agent_name} agent error: {str(e)}\n{traceback.format_exc()}",
        )
