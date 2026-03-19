"""
Lesson Plan Agent — Agent 3
Analyzes recent progress and generates weekly lesson plan suggestions.
"""

import json
from functools import lru_cache
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from app.states import LessonPlanState
from app.config import get_settings
from app.services import db_service
from app.prompts import analyze_recent_progress_prompt, generate_wlp_prompt
from app.utils.json_utils import safe_json


def _get_llm():
    s = get_settings()
    return ChatOpenAI(model=s.default_model, temperature=s.temperature, api_key=s.openai_api_key)


def _safe_json(text: str) -> dict:
    return safe_json(text)


async def gather_context(state: LessonPlanState) -> dict:
    sid = state["student_id"]
    try:
        profile = await db_service.fetch_student_profile(sid)
        sessions = await db_service.fetch_session_notes(sid, limit=5)
        wlps = await db_service.fetch_weekly_lesson_plans(sid, limit=5)
        ltps = await db_service.fetch_long_term_plans(sid, active_only=True)

        current_stp = {}
        if ltps:
            stps = await db_service.fetch_short_term_plans(ltps[0]["id"])
            if stps:
                current_stp = stps[0]

        # Build assessment summary
        reading = await db_service.fetch_reading_assessments(sid, limit=1)
        writing = await db_service.fetch_writing_assessments(sid, limit=1)
        math = await db_service.fetch_math_assessments(sid, limit=1)

        assessment_summary = {
            "has_reading": len(reading) > 0,
            "has_writing": len(writing) > 0,
            "has_math": len(math) > 0,
        }

        return {
            "student_profile": profile or {},
            "current_stp": current_stp,
            "recent_sessions": sessions,
            "assessment_summary": assessment_summary,
        }
    except Exception as e:
        return {"error": f"Failed to gather context: {str(e)}"}


async def analyze_recent_progress(state: LessonPlanState) -> dict:
    profile = state.get("student_profile", {})
    student_info = f"{profile.get('fullName', 'N/A')}, Grade {profile.get('grade', 'N/A')}"

    sessions = state.get("recent_sessions", [])
    session_str = "\n".join(
        f"- {s.get('sessionDate', 'N/A')}: Activities: {s.get('activities', 'N/A')}, "
        f"Observations: {s.get('observations', 'N/A')}, Progress: {s.get('progress', 'N/A')}"
        for s in sessions
    ) or "No recent sessions"

    stp = state.get("current_stp", {})
    goals_str = stp.get("stp_goal", stp.get("stpGoal", "No current STP goal"))

    prompt = analyze_recent_progress_prompt(
        student_info=student_info,
        recent_sessions=session_str,
        current_goals=goals_str,
    )

    llm = _get_llm()
    response = await llm.ainvoke(prompt)
    parsed = _safe_json(response.content)
    # Ensure progress_analysis is always a string, never raw LLM text
    progress_summary = parsed.get("progress_summary")
    if not isinstance(progress_summary, str):
        progress_summary = "Progress analysis unavailable"
    return {"progress_analysis": progress_summary}


async def generate_plan(state: LessonPlanState) -> dict:
    profile = state.get("student_profile", {})
    student_info = f"{profile.get('fullName', 'N/A')}, Grade {profile.get('grade', 'N/A')}"

    stp = state.get("current_stp", {})
    sessions = state.get("recent_sessions", [])
    session_str = "\n".join(
        f"- {s.get('sessionDate', 'N/A')}: {s.get('activities', 'N/A')} → {s.get('progress', 'N/A')}"
        for s in sessions[:3]
    ) or "No recent sessions"

    week = state.get("week_number", 1)

    prompt = generate_wlp_prompt(
        student_info=student_info,
        stp=json.dumps(stp, indent=2, default=str),
        week=week,
        recent_sessions=session_str,
    )

    llm = _get_llm()
    response = await llm.ainvoke(prompt)
    parsed = _safe_json(response.content)

    return {
        "lesson_plan": {**parsed, "status": "AI_DRAFT", "editable": True},
        "suggested_activities": parsed.get("activities", []),
        "suggested_resources": parsed.get("resources_used", []),
        "motivation_strategy": parsed.get("motivation_strategy", ""),
        "estimated_time": parsed.get("average_time", 45),
        "areas_of_remediation": parsed.get("areas_of_remediation", []),
    }


def build_lesson_plan_graph() -> StateGraph:
    graph = StateGraph(LessonPlanState)

    graph.add_node("gather_context", gather_context)
    graph.add_node("analyze_progress", analyze_recent_progress)
    graph.add_node("generate_plan", generate_plan)

    graph.set_entry_point("gather_context")
    graph.add_edge("gather_context", "analyze_progress")
    graph.add_edge("analyze_progress", "generate_plan")
    graph.add_edge("generate_plan", END)

    return graph


@lru_cache(maxsize=1)
def get_lesson_plan_agent():
    return build_lesson_plan_graph().compile()
