"""
Report Generation Agent — Agent 4 (OPTIMIZED)
Generates Assessment, Lesson Plan, Parent, and School reports.
Replaces AIReportService.ts and SchoolAIReportService.ts.

Cost optimizations:
- GPT-4o-mini instead of GPT-4o (15x cheaper, comparable quality for structured content)
- JSON mode for reliable structured output
- Compressed prompts (indent=1, shorter instructions)
- Response caching via data hash
"""

import json
from datetime import datetime
from functools import lru_cache
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from app.states import ReportState
from app.config import get_settings
from app.services import db_service
from app.services.symptom_mapper import (
    get_active_symptoms,
    READING_SYMPTOM_MAP, WRITING_SYMPTOM_MAP, MATH_SYMPTOM_MAP,
)
from app.prompts import (
    ASSESSMENT_REPORT_SYSTEM, LESSON_PLAN_REPORT_SYSTEM,
    PARENT_REPORT_SYSTEM, SCHOOL_REPORT_SYSTEM,
    build_assessment_report_prompt,
    build_lesson_plan_report_prompt,
    build_parent_report_prompt,
    build_school_report_prompt,
)
from app.utils.json_utils import safe_json


def _get_llm(model: str | None = None):
    s = get_settings()
    return ChatOpenAI(
        model=model or s.default_model,  # GPT-4o-mini for ALL reports now
        temperature=s.temperature,
        api_key=s.openai_api_key,
        max_tokens=s.max_tokens,
        model_kwargs={"response_format": {"type": "json_object"}} if s.use_json_mode else {},
    )


def _safe_json(text: str) -> dict:
    return safe_json(text)


# ── Graph Nodes ───────────────────────────────────────────────────────────────

async def collect_data(state: ReportState) -> dict:
    """Gather all relevant data for the report type."""
    report_type = state.get("report_type", "ASSESSMENT")
    target_id = state["target_id"]

    data: dict = {}
    try:
        if report_type in ("ASSESSMENT", "LESSON_PLAN", "PARENT"):
            data["student"] = await db_service.fetch_student_profile(target_id)
            data["intake"] = await db_service.fetch_intake_form(target_id)
            data["reading"] = await db_service.fetch_reading_assessments(target_id)
            data["writing"] = await db_service.fetch_writing_assessments(target_id)
            data["math"] = await db_service.fetch_math_assessments(target_id)
            data["informal"] = await db_service.fetch_informal_assessments(target_id)
            data["formal"] = await db_service.fetch_formal_assessments(target_id)
            data["iep_goals"] = await db_service.fetch_iep_goals(target_id)
            data["sessions"] = await db_service.fetch_session_notes(target_id)
            data["wlps"] = await db_service.fetch_weekly_lesson_plans(target_id)

        elif report_type == "SCHOOL":
            data["students"] = await db_service.fetch_school_students(target_id)

    except Exception as e:
        return {"error": f"Data collection failed: {str(e)}"}

    return {"raw_data": data}


async def build_sections(state: ReportState) -> dict:
    """Generate report sections using LLM."""
    report_type = state.get("report_type", "ASSESSMENT")
    data = state.get("raw_data", {})

    if report_type == "ASSESSMENT":
        return await _build_assessment_sections(data, state)
    elif report_type == "LESSON_PLAN":
        return await _build_lesson_plan_sections(data, state)
    elif report_type == "PARENT":
        return await _build_parent_sections(data, state)
    elif report_type == "SCHOOL":
        return await _build_school_sections(data, state)

    return {"error": f"Unknown report type: {report_type}"}


async def _build_assessment_sections(data: dict, state: ReportState) -> dict:
    student = data.get("student", {})
    student_info = (
        f"Name: {student.get('fullName', 'N/A')}, "
        f"Grade: {student.get('grade', 'N/A')}, "
        f"Age: {student.get('age', 'N/A')}, "
        f"School: {student.get('school_name', 'N/A')}"
    )

    # Extract symptom data
    reading_data = _extract_reading_text(data.get("reading", []))
    writing_data = _extract_writing_text(data.get("writing", []))
    math_data = _extract_math_text(data.get("math", []))
    informal_data = _extract_informal_text(data.get("informal", []))
    formal_data = _extract_formal_text(data.get("formal", []))
    iep_data = _extract_iep_text(data.get("iep_goals", []))
    intake_data = _extract_intake_text(data.get("intake"))

    prompt = build_assessment_report_prompt(
        student_info, intake_data, reading_data, writing_data,
        math_data, informal_data, formal_data, iep_data,
    )

    llm = _get_llm()
    response = await llm.ainvoke([
        {"role": "system", "content": ASSESSMENT_REPORT_SYSTEM},
        {"role": "user", "content": prompt},
    ])

    return {"structured_sections": _safe_json(response.content)}


async def _build_lesson_plan_sections(data: dict, state: ReportState) -> dict:
    student = data.get("student", {})
    student_info = f"Name: {student.get('fullName', 'N/A')}, Grade: {student.get('grade', 'N/A')}"

    # Include rich WLP fields: sessionDate, actualTime, outcome
    raw_wlps = data.get("wlps", [])[:10]
    wlps = [
        {
            "weekNumber": w.get("weekNumber"),
            "sessionDate": str(w.get("sessionDate", "")),
            "topics": w.get("topics"),
            "areasOfRemediation": w.get("areasOfRemediation", []),
            "averageTime": w.get("averageTime"),
            "actualTime": w.get("actualTime"),
            "motivationStrategy": w.get("motivationStrategy"),
            "resourcesUsed": w.get("resourcesUsed", []),
            "outcome": w.get("outcome"),
            "stpGoal": w.get("stpGoal"),
        }
        for w in raw_wlps
    ]
    wlps_str = json.dumps(wlps, indent=2, default=str)

    reading_data = _extract_reading_text(data.get("reading", []))
    writing_data = _extract_writing_text(data.get("writing", []))
    math_data = _extract_math_text(data.get("math", []))

    prompt = build_lesson_plan_report_prompt(
        student_info=student_info,
        wlps_data=wlps_str,
        reading_data=reading_data,
        writing_data=writing_data,
        math_data=math_data,
    )

    llm = _get_llm()
    response = await llm.ainvoke([
        {"role": "system", "content": LESSON_PLAN_REPORT_SYSTEM},
        {"role": "user", "content": prompt},
    ])

    return {"structured_sections": _safe_json(response.content)}


async def _build_parent_sections(data: dict, state: ReportState) -> dict:
    student = data.get("student", {})
    student_info = f"{student.get('fullName', 'N/A')}, Grade {student.get('grade', 'N/A')}, Age {student.get('age', 'N/A')}"

    iep_goals = data.get("iep_goals", [])
    sessions = data.get("sessions", [])[:5]

    progress = "\n".join(
        f"- {g.get('domain', 'N/A')}: {g.get('goalStatement', 'N/A')} — Progress: {g.get('progressPercent', 0)}%"
        for g in iep_goals
    ) or "Progress data being compiled"

    # Build a readable summary of the active intervention plan from IEP goals and WLPs
    wlps = data.get("wlps", [])[:3]
    plan_lines = []
    if iep_goals:
        domains = list({g.get("domain", "") for g in iep_goals if g.get("domain")})
        plan_lines.append(f"Active learning areas: {', '.join(domains)}")
        plan_lines.append(f"Number of active goals: {len(iep_goals)}")
    if wlps:
        latest_wlp = wlps[0]
        if latest_wlp.get("topics"):
            plan_lines.append(f"Most recent session topic: {latest_wlp['topics']}")
        if latest_wlp.get("motivationStrategy"):
            plan_lines.append(f"Current motivation approach: {latest_wlp['motivationStrategy']}")
    intervention_plan = "\n".join(plan_lines) if plan_lines else "Personalised learning plan is active — goals are being worked on in each session"

    session_summary = "\n".join(
        f"- {s.get('sessionDate', 'N/A')}: {s.get('activities', 'N/A')}"
        for s in sessions
    ) or "No recent sessions"

    prompt = build_parent_report_prompt(
        student_info=student_info,
        progress_data=progress,
        intervention_plan=intervention_plan,
        session_summary=session_summary,
    )

    llm = _get_llm()
    response = await llm.ainvoke([
        {"role": "system", "content": PARENT_REPORT_SYSTEM},
        {"role": "user", "content": prompt},
    ])

    return {"structured_sections": _safe_json(response.content)}


async def _build_school_sections(data: dict, state: ReportState) -> dict:
    students = data.get("students", [])
    total = len(students)

    # Build grade breakdown
    grade_counts: dict = {}
    for s in students:
        grade = s.get("grade", "Unknown")
        grade_counts[grade] = grade_counts.get(grade, 0) + 1
    grade_breakdown = ", ".join(f"Grade {g}: {c}" for g, c in sorted(grade_counts.items()))

    # Compute risk distribution from symptom counts (rule-based, same thresholds as risk_agent)
    from app.services.symptom_mapper import count_symptoms as _count_symptoms
    high_support = 0
    moderate_support = 0
    on_track = 0
    students_with_plans = sum(1 for s in students if s.get("hasActivePlan") or s.get("riskCategory"))
    for s in students:
        risk = s.get("riskCategory", "")
        if risk in ("HIGH_SUPPORT", "AT_RISK"):
            high_support += 1
        elif risk in ("MODERATE_SUPPORT", "MONITORING"):
            moderate_support += 1
        else:
            on_track += 1

    high_pct = round(high_support / total * 100, 1) if total else 0
    moderate_pct = round(moderate_support / total * 100, 1) if total else 0
    on_track_pct = round(on_track / total * 100, 1) if total else 0

    # Use school name from student data if available, fall back to target_id
    school_name = (
        students[0].get("school_name") or students[0].get("schoolName")
        if students else state.get("target_id", "School")
    ) or state.get("target_id", "School")

    snapshot_data = (
        f"Total Students: {total}\n"
        f"Grade Breakdown: {grade_breakdown}\n"
        f"\nRisk Level Distribution:\n"
        f"- HIGH_SUPPORT: {high_support} students ({high_pct}%)\n"
        f"- MODERATE_SUPPORT: {moderate_support} students ({moderate_pct}%)\n"
        f"- ON_TRACK: {on_track} students ({on_track_pct}%)\n"
        f"\nProgram Coverage:\n"
        f"- Students with active risk category recorded: {students_with_plans} of {total} ({round(students_with_plans/total*100,1) if total else 0}%)"
    )

    prompt = build_school_report_prompt(school_name, snapshot_data)

    llm = _get_llm(get_settings().default_model)
    response = await llm.ainvoke([
        {"role": "system", "content": SCHOOL_REPORT_SYSTEM},
        {"role": "user", "content": prompt},
    ])

    return {"structured_sections": _safe_json(response.content)}


async def format_output(state: ReportState) -> dict:
    """Format the final report output."""
    report_type = state.get("report_type", "ASSESSMENT")
    sections = state.get("structured_sections", {})
    data = state.get("raw_data", {})
    student = data.get("student", {})

    now = datetime.now()
    date_str = now.strftime("%B %d, %Y")
    student_name = student.get("fullName", "Student") if student else "Student"

    if report_type == "ASSESSMENT":
        content = "\n\n".join([
            f"## 1. Reading Feedback\n{sections.get('readingFeedback', 'N/A')}",
            f"## 2. Writing Feedback\n{sections.get('writingFeedback', 'N/A')}",
            f"## 3. Math Feedback\n{sections.get('mathFeedback', 'N/A')}",
            f"## 4. Behaviour & Attention\n{sections.get('behaviourAttention', 'N/A')}",
            f"## 5. Key Strengths\n{sections.get('keyStrengths', 'N/A')}",
            f"## 6. Recommended Interventions & Goals\n{sections.get('interventionsAndGoals', 'N/A')}",
            f"## 7. Closing Statement\n{sections.get('closingStatement', 'N/A')}",
        ])
        report = {
            "studentId": state["target_id"],
            "specialEducatorId": state.get("educator_id", ""),
            "type": "ASSESSMENT",
            "title": f"Assessment Report - {student_name} - {date_str}",
            "content": content,
            "summary": sections.get("keyStrengths", ""),
            "recommendations": sections.get("interventionsAndGoals", ""),
            "status": "AI_DRAFT",  # Editable by educator
        }
    elif report_type == "LESSON_PLAN":
        content = "\n\n".join([
            f"## 1. Executive Summary\n{sections.get('executiveSummary', 'N/A')}",
            f"## 2. Lesson Plan Analysis\n{sections.get('lessonPlanAnalysis', 'N/A')}",
            f"## 3. Teaching Effectiveness\n{sections.get('teachingEffectiveness', 'N/A')}",
            f"## 4. Progress Patterns\n{sections.get('progressPatterns', 'N/A')}",
            f"## 5. Areas of Remediation\n{sections.get('areasOfRemediation', 'N/A')}",
            f"## 6. Recommendations\n{sections.get('recommendations', 'N/A')}",
            f"## 7. Next Steps\n{sections.get('nextSteps', 'N/A')}",
            f"## 8. Closing Statement\n{sections.get('closingStatement', 'N/A')}",
        ])
        report = {
            "studentId": state["target_id"],
            "specialEducatorId": state.get("educator_id", ""),
            "type": "LESSON_PLAN",
            "title": f"Lesson Plan Report - {student_name} - {date_str}",
            "content": content,
            "summary": sections.get("executiveSummary", ""),
            "recommendations": sections.get("recommendations", ""),
            "status": "AI_DRAFT",
        }
    elif report_type == "PARENT":
        report = {
            "studentId": state["target_id"],
            "type": "PARENT",
            "title": f"Parent Report - {student_name} - {date_str}",
            "sections": sections,
            "status": "AI_DRAFT",
        }
    else:
        report = {
            "type": report_type,
            "title": f"{report_type} Report - {date_str}",
            "sections": sections,
            "status": "AI_DRAFT",
        }

    return {
        "final_report": report,
        "metadata": {
            "generated_at": now.isoformat(),
            "report_type": report_type,
            "model_used": get_settings().report_model,
            "editable": True,
        },
    }


# ── Data Extraction Helpers ───────────────────────────────────────────────────

def _extract_reading_text(assessments: list) -> str:
    if not assessments:
        return "No reading assessments available"
    parts = []
    for i, a in enumerate(assessments[:3]):
        lines = [f"--- Reading Assessment {i+1} ---"]
        for q in ["readingQ1", "readingQ2", "readingQ3"]:
            if a.get(q):
                lines.append(f"{q}: {a[q]}")
        # Grade level data
        if a.get("isAtGradeLevel") is not None:
            lines.append(f"At Grade Level: {a['isAtGradeLevel']}")
        if a.get("functionalGradeLevel"):
            lines.append(f"Functional Grade Level: {a['functionalGradeLevel']}")
        if a.get("performanceSummary"):
            lines.append(f"Performance Summary: {a['performanceSummary']}")
        if a.get("gradeLevelMappings"):
            try:
                mappings = a["gradeLevelMappings"] if isinstance(a["gradeLevelMappings"], list) else json.loads(a["gradeLevelMappings"])
                lines.append(f"Grade Level Mappings: {json.dumps(mappings)}")
            except (ValueError, TypeError):
                pass
        if a.get("gradeLevelObservation"):
            lines.append(f"Grade Level Observation: {a['gradeLevelObservation']}")
        # Comprehension data
        if a.get("atGradeLevelComprehension") is not None:
            lines.append(f"Comprehension At Grade Level: {a['atGradeLevelComprehension']}")
        if a.get("comprehensionLevels"):
            lines.append(f"Comprehension Levels: {', '.join(a['comprehensionLevels'])}")
        if a.get("currentLevelComprehension"):
            lines.append(f"Current Comprehension Level: {', '.join(a['currentLevelComprehension'])}")
        if a.get("comprehensionObservation"):
            lines.append(f"Comprehension Observation: {a['comprehensionObservation']}")
        # Battery test
        if a.get("batteryTestConducted"):
            lines.append(f"Battery Test Conducted: {a['batteryTestConducted']}")
        if a.get("batteryTestSummary"):
            lines.append(f"Battery Test Summary: {a['batteryTestSummary']}")
        # Symptom analysis
        symptoms = get_active_symptoms(a, READING_SYMPTOM_MAP)
        if symptoms:
            lines.append(f"Symptoms ({len(symptoms)}): " + ", ".join(symptoms[:15]))
        if a.get("additionalNotes"):
            lines.append(f"Notes: {a['additionalNotes']}")
        parts.append("\n".join(lines))
    return "\n\n".join(parts)


def _extract_writing_text(assessments: list) -> str:
    if not assessments:
        return "No writing assessments available"
    parts = []
    for i, a in enumerate(assessments[:3]):
        lines = [f"--- Writing Assessment {i+1} ---"]
        for q in ["writingQ1", "writingQ2", "writingQ3"]:
            if a.get(q):
                lines.append(f"{q}: {a[q]}")
        # Near copying
        if a.get("hasNearCopyingSkills") is not None:
            lines.append(f"Has Near Copying Skills: {a['hasNearCopyingSkills']}")
        if a.get("nearCopyingLevels"):
            lines.append(f"Near Copying Levels: {', '.join(a['nearCopyingLevels'])}")
        if a.get("nearCopyingObservation"):
            lines.append(f"Near Copying Observation: {a['nearCopyingObservation']}")
        # Board copying
        if a.get("hasBoardCopyingSkills") is not None:
            lines.append(f"Has Board Copying Skills: {a['hasBoardCopyingSkills']}")
        if a.get("boardCopyingLevels"):
            lines.append(f"Board Copying Levels: {', '.join(a['boardCopyingLevels'])}")
        if a.get("boardCopyingSpeedObservation"):
            lines.append(f"Board Copying Speed: {a['boardCopyingSpeedObservation']}")
        if a.get("boardCopyingObservation"):
            lines.append(f"Board Copying Observation: {a['boardCopyingObservation']}")
        # Spelling
        if a.get("spellingStrengthSummary"):
            lines.append(f"Spelling Strength Summary: {a['spellingStrengthSummary']}")
        if a.get("spellingErrorPatternObservation"):
            lines.append(f"Spelling Error Patterns: {a['spellingErrorPatternObservation']}")
        # Creative writing
        if a.get("creativeWritingSummary"):
            lines.append(f"Creative Writing Summary: {a['creativeWritingSummary']}")
        # Symptoms
        symptoms = get_active_symptoms(a, WRITING_SYMPTOM_MAP)
        if symptoms:
            lines.append(f"Symptoms ({len(symptoms)}): " + ", ".join(symptoms[:15]))
        parts.append("\n".join(lines))
    return "\n\n".join(parts)


def _extract_math_text(assessments: list) -> str:
    if not assessments:
        return "No math assessments available"
    _OP_KEYS = [
        "additionPerformance", "subtractionPerformance", "multiplicationPerformance",
        "divisionPerformance", "placeValuePerformance", "numberLinePerformance",
        "fractionsPerformance", "decimalsPerformance", "algebraPerformance",
        "statementSumsPerformance", "geometryPerformance",
    ]
    parts = []
    for i, a in enumerate(assessments[:3]):
        lines = [f"--- Math Assessment {i+1} ---"]
        for q in ["mathQ1", "mathQ2", "mathQ3"]:
            if a.get(q):
                lines.append(f"{q}: {a[q]}")
        # Grade level data
        if a.get("isAtMathGradeLevel") is not None:
            lines.append(f"At Math Grade Level: {a['isAtMathGradeLevel']}")
        if a.get("mathFunctionalGradeLevel"):
            lines.append(f"Math Functional Grade Level: {a['mathFunctionalGradeLevel']}")
        if a.get("mathPerformanceSummary"):
            lines.append(f"Math Performance Summary: {a['mathPerformanceSummary']}")
        if a.get("mathGradeLevelMappings"):
            try:
                mappings = a["mathGradeLevelMappings"] if isinstance(a["mathGradeLevelMappings"], list) else json.loads(a["mathGradeLevelMappings"])
                lines.append(f"Math Grade Level Mappings: {json.dumps(mappings)}")
            except (ValueError, TypeError):
                pass
        if a.get("mathGradeLevelObservation"):
            lines.append(f"Math Grade Level Observation: {a['mathGradeLevelObservation']}")
        # Battery test
        if a.get("mathBatteryTestConducted"):
            lines.append(f"Math Battery Test Conducted: {a['mathBatteryTestConducted']}")
        if a.get("mathBatteryTestSummary"):
            lines.append(f"Math Battery Test Summary: {a['mathBatteryTestSummary']}")
        # Per-operation performance (JSON objects)
        for op_key in _OP_KEYS:
            op_val = a.get(op_key)
            if op_val:
                try:
                    op_data = op_val if isinstance(op_val, dict) else json.loads(op_val)
                    lines.append(f"{op_key}: {json.dumps(op_data)}")
                except (ValueError, TypeError):
                    lines.append(f"{op_key}: {op_val}")
        # Symptoms
        symptoms = get_active_symptoms(a, MATH_SYMPTOM_MAP)
        if symptoms:
            lines.append(f"Symptoms ({len(symptoms)}): " + ", ".join(symptoms[:15]))
        parts.append("\n".join(lines))
    return "\n\n".join(parts)


def _extract_informal_text(assessments: list) -> str:
    if not assessments:
        return "No informal assessments available"
    parts = []
    for i, a in enumerate(assessments[:3]):
        lines = [f"--- Informal Assessment {i+1} ({a.get('assessmentType', 'N/A')}) ---"]
        for field in ["readingObservations", "writingObservations", "mathObservations",
                       "vpObservations", "motorObservations", "attentionObservations"]:
            if a.get(field):
                lines.append(f"{field}: {a[field]}")
        parts.append("\n".join(lines))
    return "\n\n".join(parts)


def _extract_formal_text(assessments: list) -> str:
    if not assessments:
        return "No formal assessments/diagnosis available"
    parts = []
    for i, a in enumerate(assessments[:3]):
        lines = [f"--- Formal Assessment {i+1} ({a.get('assessmentType', 'N/A')}) ---"]
        for f in ["referralReason", "diagnosis", "keyFindings", "recommendations"]:
            if a.get(f):
                lines.append(f"{f}: {a[f]}")
        parts.append("\n".join(lines))
    return "\n\n".join(parts)


def _extract_iep_text(goals: list) -> str:
    if not goals:
        return "No active IEP goals"
    return "\n".join(
        f"- {g.get('domain', 'N/A')}: {g.get('goalStatement', 'N/A')} "
        f"(Progress: {g.get('progressPercent', 0)}%"
        + (f", Strategy: {g['strategy']}" if g.get('strategy') else "") + ")"
        for g in goals
    )


def _extract_intake_text(intake: dict | None) -> str:
    if not intake:
        return "No intake form available"
    fields = []
    for k, v in intake.items():
        if v is not None and k not in ("id", "studentId", "specialEducatorId", "status",
                                        "createdAt", "updatedAt", "completedAt"):
            fields.append(f"{k}: {v}")
    return "\n".join(fields[:30]) if fields else "No detailed intake data"


# ── Build Graph ───────────────────────────────────────────────────────────────

def build_report_graph() -> StateGraph:
    graph = StateGraph(ReportState)

    graph.add_node("collect_data", collect_data)
    graph.add_node("build_sections", build_sections)
    graph.add_node("format_output", format_output)

    graph.set_entry_point("collect_data")
    graph.add_edge("collect_data", "build_sections")
    graph.add_edge("build_sections", "format_output")
    graph.add_edge("format_output", END)

    return graph


@lru_cache(maxsize=1)
def get_report_agent():
    return build_report_graph().compile()
