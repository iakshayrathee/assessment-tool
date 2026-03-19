"""
Risk & Progress Agent — Agent 5
Classifies risk for students/schools, analyzes trends, and detects early warnings.
"""

import asyncio
import json
from functools import lru_cache
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from app.states import RiskProgressState
from app.config import get_settings
from app.services import db_service
from app.services.symptom_mapper import count_symptoms
from app.prompts import analyze_risk_trends_prompt
from app.utils.json_utils import safe_json


def _get_llm():
    s = get_settings()
    return ChatOpenAI(model=s.default_model, temperature=s.temperature, api_key=s.openai_api_key)


def _safe_json(text: str) -> dict:
    return safe_json(text)


async def gather_population(state: RiskProgressState) -> dict:
    scope = state.get("scope", "STUDENT")
    target_id = state["target_id"]

    try:
        if scope == "STUDENT":
            profile = await db_service.fetch_student_profile(target_id)
            reading = await db_service.fetch_reading_assessments(target_id, limit=3)
            writing = await db_service.fetch_writing_assessments(target_id, limit=3)
            math = await db_service.fetch_math_assessments(target_id, limit=3)
            goals = await db_service.fetch_iep_goals(target_id, active_only=False)

            return {
                "student_profiles": [profile] if profile else [],
                "assessment_data": [{
                    "student_id": target_id,
                    "reading": reading,
                    "writing": writing,
                    "math": math,
                    "iep_goals": goals,
                }],
            }

        elif scope == "SCHOOL":
            students = await db_service.fetch_school_students(target_id)
            batch = students[:50]  # cap at 50 students

            async def _fetch_student_data(s: dict) -> dict:
                reading, writing, math, goals = await asyncio.gather(
                    db_service.fetch_reading_assessments(s["id"], limit=1),
                    db_service.fetch_writing_assessments(s["id"], limit=1),
                    db_service.fetch_math_assessments(s["id"], limit=1),
                    db_service.fetch_iep_goals(s["id"], active_only=True),
                )
                return {
                    "student_id": s["id"],
                    "student_name": s.get("fullName", ""),
                    "grade": s.get("grade", ""),
                    "reading": reading,
                    "writing": writing,
                    "math": math,
                    "iep_goals": goals,
                }

            assessment_data = await asyncio.gather(*[_fetch_student_data(s) for s in batch])

            return {
                "student_profiles": students,
                "assessment_data": list(assessment_data),
            }
    except Exception as e:
        return {"error": f"Failed to gather population: {str(e)}"}

    return {"student_profiles": [], "assessment_data": []}


async def classify_risk_batch(state: RiskProgressState) -> dict:
    """Classify risk for each student using rule-based + AI enhancement."""
    assessment_data = state.get("assessment_data", [])
    classifications = []

    for data in assessment_data:
        reading_count = count_symptoms(data["reading"][0] if data.get("reading") else None)
        writing_count = count_symptoms(data["writing"][0] if data.get("writing") else None)
        math_count = count_symptoms(data["math"][0] if data.get("math") else None)
        total = reading_count + writing_count + math_count

        goals = data.get("iep_goals", [])
        avg_progress = 100
        if goals:
            progresses = [g.get("progressPercent", 0) for g in goals]
            avg_progress = sum(progresses) / len(progresses) if progresses else 100

        if total >= 30 or avg_progress < 30:
            risk = "HIGH_SUPPORT"
        elif total >= 15 or avg_progress < 60:
            risk = "MODERATE_SUPPORT"
        else:
            risk = "ON_TRACK"

        classifications.append({
            "student_id": data.get("student_id", ""),
            "student_name": data.get("student_name", ""),
            "risk_level": risk,
            "symptom_count": total,
            "avg_iep_progress": round(avg_progress, 1),
            "reading_symptoms": reading_count,
            "writing_symptoms": writing_count,
            "math_symptoms": math_count,
        })

    return {"risk_classifications": classifications}


async def analyze_trends(state: RiskProgressState) -> dict:
    """Use LLM to analyze risk trends for individual students."""
    classifications = state.get("risk_classifications", [])
    if not classifications:
        return {"progress_trends": {}, "early_warnings": []}

    # For individual student analysis, use LLM
    if state.get("scope") == "STUDENT" and classifications:
        student = classifications[0]
        assessment_data = state.get("assessment_data", [{}])[0]

        # Build richer historical summary including per-assessment symptom counts
        reading_trend = [
            {"index": i + 1, "symptoms": count_symptoms(r)}
            for i, r in enumerate(assessment_data.get("reading", []))
        ]
        writing_trend = [
            {"index": i + 1, "symptoms": count_symptoms(w)}
            for i, w in enumerate(assessment_data.get("writing", []))
        ]
        math_trend = [
            {"index": i + 1, "symptoms": count_symptoms(m)}
            for i, m in enumerate(assessment_data.get("math", []))
        ]
        goal_details = [
            {"domain": g.get("domain"), "progress": g.get("progressPercent", 0), "status": g.get("status")}
            for g in assessment_data.get("iep_goals", [])
        ]
        historical = json.dumps({
            "reading_trend": reading_trend,
            "writing_trend": writing_trend,
            "math_trend": math_trend,
            "current_symptom_total": student.get("symptom_count", 0),
            "reading_symptoms": student.get("reading_symptoms", 0),
            "writing_symptoms": student.get("writing_symptoms", 0),
            "math_symptoms": student.get("math_symptoms", 0),
            "iep_progress": student.get("avg_iep_progress", 0),
            "iep_goal_details": goal_details,
        }, indent=2)

        prompt = analyze_risk_trends_prompt(
            student_info=f"{student.get('student_name', 'N/A')}",
            historical_data=historical,
            current_risk=student.get("risk_level", "UNKNOWN"),
        )

        llm = _get_llm()
        response = await llm.ainvoke(prompt)
        parsed = _safe_json(response.content)

        return {
            "progress_trends": parsed,
            "early_warnings": parsed.get("early_warnings", []),
        }

    # For school-level, aggregate without LLM
    high = sum(1 for c in classifications if c["risk_level"] == "HIGH_SUPPORT")
    moderate = sum(1 for c in classifications if c["risk_level"] == "MODERATE_SUPPORT")
    on_track = sum(1 for c in classifications if c["risk_level"] == "ON_TRACK")
    total = len(classifications)

    warnings = [
        c for c in classifications
        if c["risk_level"] == "HIGH_SUPPORT" and c.get("avg_iep_progress", 100) < 20
    ]

    return {
        "progress_trends": {
            "total_students": total,
            "high_support": high,
            "moderate_support": moderate,
            "on_track": on_track,
            "high_support_pct": round(high / total * 100, 1) if total else 0,
        },
        "early_warnings": [
            {
                "student_id": w["student_id"],
                "student_name": w["student_name"],
                "reason": f"High support with only {w['avg_iep_progress']}% IEP progress",
                "urgency": "HIGH",
            }
            for w in warnings
        ],
    }


async def generate_risk_recommendations(state: RiskProgressState) -> dict:
    classifications = state.get("risk_classifications", [])
    warnings = state.get("early_warnings", [])

    recommendations = []
    for w in warnings[:5]:
        if not isinstance(w, dict):
            continue
        recommendations.append({
            "student_id": w.get("student_id", ""),
            "action": f"Immediate review needed for {w.get('student_name', 'student')}",
            "reason": w.get("reason", ""),
            "priority": "HIGH",
        })

    # Add general recommendations for high-support students
    high_support = [c for c in classifications if c["risk_level"] == "HIGH_SUPPORT"]
    for hs in high_support[:10]:
        if hs.get("student_id") not in [r.get("student_id") for r in recommendations]:
            recommendations.append({
                "student_id": hs["student_id"],
                "action": f"Review intervention plan for {hs.get('student_name', 'student')}",
                "reason": f"{hs['symptom_count']} symptoms, {hs['avg_iep_progress']}% IEP progress",
                "priority": "MEDIUM",
            })

    return {"recommendations": recommendations}


def build_risk_graph() -> StateGraph:
    graph = StateGraph(RiskProgressState)

    graph.add_node("gather_population", gather_population)
    graph.add_node("classify_risk", classify_risk_batch)
    graph.add_node("analyze_trends", analyze_trends)
    graph.add_node("generate_recommendations", generate_risk_recommendations)

    graph.set_entry_point("gather_population")
    graph.add_edge("gather_population", "classify_risk")
    graph.add_edge("classify_risk", "analyze_trends")
    graph.add_edge("analyze_trends", "generate_recommendations")
    graph.add_edge("generate_recommendations", END)

    return graph


@lru_cache(maxsize=1)
def get_risk_agent():
    return build_risk_graph().compile()
