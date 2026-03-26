"""
Educator Intelligence Agent — Agent 6
Analyzes educator effectiveness and provides mentoring insights.
"""

import json
import asyncio
from functools import lru_cache
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from app.states import EducatorIntelligenceState
from app.config import get_settings
from app.services import db_service
from app.services.symptom_mapper import count_symptoms
from app.prompts import analyze_educator_performance_prompt
from app.utils.json_utils import safe_json


def _get_llm():
    s = get_settings()
    return ChatOpenAI(model=s.default_model, temperature=s.temperature, api_key=s.openai_api_key)


def _safe_json(text: str) -> dict:
    return safe_json(text)


async def gather_educator_data(state: EducatorIntelligenceState) -> dict:
    eid = state["educator_id"]
    try:
        educator, students = await asyncio.gather(
            db_service.fetch_educator_profile(eid),
            db_service.fetch_educator_students(eid),
        )

        if educator is None:
            return {
                "error": (
                    f"Educator profile not found for ID: {eid}. "
                    "Ensure the SpecialEducatorProfile ID (not User ID) is being sent."
                )
            }

        return {
            "educator_profile": educator,
            "assigned_students": students,
        }
    except Exception as e:
        return {"error": f"Failed to gather educator data: {str(e)}"}


async def analyze_student_outcomes(state: EducatorIntelligenceState) -> dict:
    if state.get("error"):
        return {}
    students = state.get("assigned_students", [])

    async def _fetch_one(student: dict) -> dict:
        sid = student["id"]
        goals, reading, writing, math, sessions = await asyncio.gather(
            db_service.fetch_iep_goals(sid, active_only=True),
            db_service.fetch_reading_assessments(sid, limit=1),
            db_service.fetch_writing_assessments(sid, limit=1),
            db_service.fetch_math_assessments(sid, limit=1),
            db_service.fetch_session_notes(sid, limit=5),
        )
        avg_progress = 0
        if goals:
            avg_progress = sum(g.get("progressPercent", 0) for g in goals) / len(goals)
        total_symptoms = (
            count_symptoms(reading[0] if reading else None)
            + count_symptoms(writing[0] if writing else None)
            + count_symptoms(math[0] if math else None)
        )
        if total_symptoms >= 30 or avg_progress < 30:
            status = "AT_RISK"
        elif total_symptoms >= 15 or avg_progress < 60:
            status = "NEEDS_ATTENTION"
        else:
            status = "ON_TRACK"
        return {
            "student_id": sid,
            "student_name": student.get("fullName", ""),
            "grade": student.get("grade", ""),
            "status": status,
            "avg_iep_progress": round(avg_progress, 1),
            "total_symptoms": total_symptoms,
            "session_count": len(sessions),
            "active_goals": len(goals),
        }

    outcomes = await asyncio.gather(*[_fetch_one(s) for s in students[:20]])
    return {"student_outcomes": list(outcomes)}


async def evaluate_and_recommend(state: EducatorIntelligenceState) -> dict:
    if state.get("error"):
        return {}
    educator = state.get("educator_profile", {}) or {}
    outcomes = state.get("student_outcomes", [])

    specializations = educator.get('specializationAreas', [])
    if isinstance(specializations, str):
        specializations = [specializations]
    educator_info = (
        f"Name: {educator.get('fullName', educator.get('name', 'N/A'))}, "
        f"Experience: {educator.get('yearsOfExperience', 'N/A')} years, "
        f"Specializations: {', '.join(specializations) if specializations else 'Not specified'}"
    )

    outcomes_str = json.dumps(outcomes, indent=2, default=str)

    total = len(outcomes)
    improving = sum(1 for o in outcomes if o["status"] == "ON_TRACK")
    at_risk = sum(1 for o in outcomes if o["status"] == "AT_RISK")

    session_str = f"Total students: {total}, On Track: {improving}, At Risk: {at_risk}"

    prompt = analyze_educator_performance_prompt(
        educator_info=educator_info,
        student_outcomes=outcomes_str,
        session_data=session_str,
    )

    llm = _get_llm()
    response = await llm.ainvoke(prompt)
    parsed = _safe_json(response.content)

    # Build priority list from outcomes
    priority_list = sorted(
        [o for o in outcomes if o["status"] != "ON_TRACK"],
        key=lambda x: x["total_symptoms"],
        reverse=True,
    )

    return {
        "performance_summary": parsed.get("performance_summary", {}),
        "mentoring_insights": parsed.get("mentoring_insights", []),
        "training_recommendations": [
            t.get("topic", str(t)) if isinstance(t, dict) else str(t)
            for t in parsed.get("training_recommendations", [])
        ],
        "student_priority_list": priority_list[:10],
        "prompts": [prompt],
    }


def build_educator_graph() -> StateGraph:
    graph = StateGraph(EducatorIntelligenceState)

    graph.add_node("gather_data", gather_educator_data)
    graph.add_node("analyze_outcomes", analyze_student_outcomes)
    graph.add_node("evaluate", evaluate_and_recommend)

    graph.set_entry_point("gather_data")
    graph.add_edge("gather_data", "analyze_outcomes")
    graph.add_edge("analyze_outcomes", "evaluate")
    graph.add_edge("evaluate", END)

    return graph


@lru_cache(maxsize=1)
def get_educator_agent():
    return build_educator_graph().compile()
