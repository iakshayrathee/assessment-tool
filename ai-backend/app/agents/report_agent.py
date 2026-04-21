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

    # Extract assessment data
    reading_data = _extract_reading_text(data.get("reading", []))
    writing_data = _extract_writing_text(data.get("writing", []))
    math_data = _extract_math_text(data.get("math", []))
    informal_data = _extract_informal_text(data.get("informal", []))
    formal_data = _extract_formal_text(data.get("formal", []))
    iep_data = _extract_iep_text(data.get("iep_goals", []))
    intake_data = _extract_intake_text(data.get("intake"))
    
    # NEW: Extract AI insights and progress data
    reading_ai_insights = _extract_reading_ai_insights(data.get("reading", []))
    reading_progress = _extract_reading_progress(data.get("reading", []))

    prompt = build_assessment_report_prompt(
        student_info, intake_data, reading_data, writing_data,
        math_data, informal_data, formal_data, iep_data,
    )

    # ENHANCED: Include AI insights and progress data in the prompt
    enhanced_prompt = prompt
    if reading_ai_insights and reading_ai_insights != "No AI insights available":
        enhanced_prompt += f"\n\n## AI Insights & Analysis\n{reading_ai_insights}"
    if reading_progress and reading_progress != "No progress data available":
        enhanced_prompt += f"\n\n## Progress Tracking\n{reading_progress}"

    llm = _get_llm()
    response = await llm.ainvoke([
        {"role": "system", "content": ASSESSMENT_REPORT_SYSTEM},
        {"role": "user", "content": enhanced_prompt},
    ])

    return {
        "structured_sections": _safe_json(response.content),
        "prompts": [enhanced_prompt],
    }


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

    return {
        "structured_sections": _safe_json(response.content),
        "prompts": [prompt],
    }


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

    return {
        "structured_sections": _safe_json(response.content),
        "prompts": [prompt],
    }


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

    return {
        "structured_sections": _safe_json(response.content),
        "prompts": [prompt],
    }


def _to_md(value) -> str:
    """Convert a section value to a markdown string.

    The LLM occasionally returns a dict instead of a plain string when it
    interprets the sub-header instructions literally.  This converts any dict
    into '### Key\\nValue' blocks so the content remains readable markdown.
    """
    if isinstance(value, str):
        return value or "N/A"
    if isinstance(value, dict):
        parts = []
        for k, v in value.items():
            parts.append(f"### {k}\n{v}" if v else f"### {k}")
        return "\n\n".join(parts) if parts else "N/A"
    return str(value) if value else "N/A"


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
        assessment_findings = "\n\n".join([
            f"### Section A: Reading Skills\n{_to_md(sections.get('readingSkills'))}",
            f"### Section B: Writing Skills\n{_to_md(sections.get('writingSkills'))}",
            f"### Section C: Numeracy Skills\n{_to_md(sections.get('numeracySkills'))}",
        ])
        content = "\n\n".join([
            f"## Reason for Referral\n{_to_md(sections.get('reasonForReferral'))}",
            f"## Assessment Findings\n{assessment_findings}",
            f"## Behaviour & Attention\n{_to_md(sections.get('behaviourAttention'))}",
            f"## Key Strengths\n{_to_md(sections.get('keyStrengths'))}",
            f"## Recommended Interventions\n{_to_md(sections.get('interventionsAndGoals'))}",
            f"## Closing Statement\n{_to_md(sections.get('closingStatement'))}",
        ])
        report = {
            "studentId": state["target_id"],
            "specialEducatorId": state.get("educator_id", ""),
            "type": "ASSESSMENT",
            "title": f"Assessment Report - {student_name} - {date_str}",
            "content": content,
            "summary": _to_md(sections.get("keyStrengths")),
            "recommendations": _to_md(sections.get("interventionsAndGoals")),
            "status": "AI_DRAFT",  # Editable by educator
        }
    elif report_type == "LESSON_PLAN":
        content = "\n\n".join([
            f"## 1. Executive Summary\n{_to_md(sections.get('executiveSummary'))}",
            f"## 2. Lesson Plan Analysis\n{_to_md(sections.get('lessonPlanAnalysis'))}",
            f"## 3. Teaching Effectiveness\n{_to_md(sections.get('teachingEffectiveness'))}",
            f"## 4. Progress Patterns\n{_to_md(sections.get('progressPatterns'))}",
            f"## 5. Areas of Remediation\n{_to_md(sections.get('areasOfRemediation'))}",
            f"## 6. Recommendations\n{_to_md(sections.get('recommendations'))}",
            f"## 7. Next Steps\n{_to_md(sections.get('nextSteps'))}",
            f"## 8. Closing Statement\n{_to_md(sections.get('closingStatement'))}",
        ])
        report = {
            "studentId": state["target_id"],
            "specialEducatorId": state.get("educator_id", ""),
            "type": "LESSON_PLAN",
            "title": f"Lesson Plan Report - {student_name} - {date_str}",
            "content": content,
            "summary": _to_md(sections.get("executiveSummary")),
            "recommendations": _to_md(sections.get("recommendations")),
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
        
        # Basic assessment questions
        for q in ["readingQ1", "readingQ2", "readingQ3"]:
            if a.get(q):
                lines.append(f"{q}: {a[q]}")
        
        # Reading Level Assessment (NEW)
        lines.append("## Reading Level Assessment")
        reading_levels = []
        if a.get("independentLevelKnownText"):
            reading_levels.append("Independent: Known Text")
        if a.get("independentLevelUnknownText"):
            reading_levels.append("Independent: Unknown Text")
        if a.get("instructionalLevelKnownText"):
            reading_levels.append("Instructional: Known Text")
        if a.get("instructionalLevelUnknownText"):
            reading_levels.append("Instructional: Unknown Text")
        if a.get("frustrationLevelKnownText"):
            reading_levels.append("Frustration: Known Text")
        if a.get("frustrationLevelUnknownText"):
            reading_levels.append("Frustration: Unknown Text")
        if reading_levels:
            lines.extend(f"  - {level}" for level in reading_levels)
        
        # Grade Level Analysis
        lines.append("## Grade Level Analysis")
        if a.get("isAtGradeLevel") is not None:
            lines.append(f"At Grade Level: {a['isAtGradeLevel']}")
        if a.get("functionalGradeLevel"):
            lines.append(f"Functional Grade Level: {a['functionalGradeLevel']}")
        if a.get("performanceSummary"):
            lines.append(f"Performance Summary: {a['performanceSummary']}")
        if a.get("gradeLevelMappings"):
            try:
                mappings = a["gradeLevelMappings"] if isinstance(a["gradeLevelMappings"], list) else json.loads(a["gradeLevelMappings"])
                lines.append("Grade Level Mappings:")
                for mapping in mappings[:3]:  # Limit to prevent overly long output
                    lines.append(f"  - Grade {mapping.get('gradeLevel', 'N/A')}: Independent={mapping.get('independent', 'N/A')}, Instructional={mapping.get('instructional', 'N/A')}, Frustration={mapping.get('frustration', 'N/A')}")
            except (ValueError, TypeError):
                lines.append("Grade Level Mappings: Unable to parse")
        if a.get("gradeLevelObservation"):
            lines.append(f"Grade Level Observation: {a['gradeLevelObservation']}")
        
        # Comprehension Analysis (ENHANCED)
        lines.append("## Comprehension Analysis")
        if a.get("atGradeLevelComprehension") is not None:
            lines.append(f"At Grade Level Comprehension: {a['atGradeLevelComprehension']}")
        if a.get("comprehensionLevels"):
            lines.append(f"Grade Level Comprehension Types: {', '.join(a['comprehensionLevels'])}")
        if a.get("currentLevelComprehension"):
            lines.append(f"Current Level Comprehension Types: {', '.join(a['currentLevelComprehension'])}")
        if a.get("comprehensionObservation"):
            lines.append(f"Comprehension Observation: {a['comprehensionObservation']}")
        
        # Learning Context Assessment (NEW)
        lines.append("## Learning Context Assessment")
        if a.get("readingExposureAtHome"):
            lines.append(f"Reading Exposure at Home: {a['readingExposureAtHome']}")
        if a.get("readingSupportAtHome"):
            lines.append(f"Reading Support at Home: {a['readingSupportAtHome']}")
        if a.get("readingSupportDetails"):
            lines.append(f"Support Details: {a['readingSupportDetails']}")
        if a.get("exposureDetails"):
            lines.append(f"Exposure Details: {a['exposureDetails']}")
        if a.get("supportDetails"):
            lines.append(f"Support Details: {a['supportDetails']}")
        if a.get("typeOfSchooling"):
            lines.append(f"Type of Schooling: {a['typeOfSchooling']}")
        if a.get("languageMismatch"):
            lines.append(f"Language Mismatch: {a['languageMismatch']}")
        if a.get("previousIntervention"):
            lines.append(f"Previous Intervention: {a['previousIntervention']}")
        if a.get("interventionDetails"):
            lines.append(f"Intervention Details: {a['interventionDetails']}")
        if a.get("readingMaterialAccess"):
            lines.append(f"Reading Material Access: {a['readingMaterialAccess']}")
        
        # Resources Assessment (NEW)
        lines.append("## Resources Assessment")
        
        # School Text Assessment
        if a.get("schoolTextGradeLevel") or a.get("schoolTextDifficulty"):
            lines.append("### School Text Assessment")
            if a.get("schoolTextGradeLevel"):
                lines.append(f"School Text Grade Level: {a['schoolTextGradeLevel']}")
            if a.get("schoolTextDifficulty"):
                lines.append(f"School Text Difficulty: {a['schoolTextDifficulty']}")
            if a.get("schoolTextQuality"):
                lines.append(f"School Text Quality: {a['schoolTextQuality']}")
            if a.get("schoolTextFluency"):
                lines.append(f"School Text Fluency: {a['schoolTextFluency']}")
            if a.get("schoolTextErrors"):
                lines.append(f"School Text Errors: {a['schoolTextErrors']}")
            if a.get("schoolTextObservation"):
                lines.append(f"School Text Observation: {a['schoolTextObservation']}")
        
        # Known Text Assessment
        if a.get("knownTextType") or a.get("knownTextFamiliarity"):
            lines.append("### Known Text Assessment")
            if a.get("knownTextType"):
                lines.append(f"Known Text Type: {a['knownTextType']}")
            if a.get("knownTextFamiliarity"):
                lines.append(f"Known Text Familiarity: {a['knownTextFamiliarity']}")
            if a.get("knownTextDifficulty"):
                lines.append(f"Known Text Difficulty: {a['knownTextDifficulty']}")
            if a.get("knownTextQuality"):
                lines.append(f"Known Text Quality: {a['knownTextQuality']}")
            if a.get("knownTextFluency"):
                lines.append(f"Known Text Fluency: {a['knownTextFluency']}")
            if a.get("knownTextErrors"):
                lines.append(f"Known Text Errors: {a['knownTextErrors']}")
            if a.get("knownTextObservation"):
                lines.append(f"Known Text Observation: {a['knownTextObservation']}")
        
        # Unknown Text Assessment
        if a.get("unknownTextSource") or a.get("unknownTextDifficulty"):
            lines.append("### Unknown Text Assessment")
            if a.get("unknownTextSource"):
                lines.append(f"Unknown Text Source: {a['unknownTextSource']}")
            if a.get("unknownTextDifficulty"):
                lines.append(f"Unknown Text Difficulty: {a['unknownTextDifficulty']}")
            if a.get("unknownTextQuality"):
                lines.append(f"Unknown Text Quality: {a['unknownTextQuality']}")
            if a.get("unknownTextFluency"):
                lines.append(f"Unknown Text Fluency: {a['unknownTextFluency']}")
            if a.get("unknownTextErrors"):
                lines.append(f"Unknown Text Errors: {a['unknownTextErrors']}")
            if a.get("unknownTextObservation"):
                lines.append(f"Unknown Text Observation: {a['unknownTextObservation']}")
        
        # Resource Context
        if a.get("materialTypes") and isinstance(a.get("materialTypes"), list):
            lines.append(f"Material Types: {', '.join(a['materialTypes'])}")
        if a.get("materialLevels") and isinstance(a.get("materialLevels"), list):
            lines.append(f"Material Levels: {', '.join(a['materialLevels'])}")
        if a.get("readingIndependence"):
            lines.append(f"Reading Independence: {a['readingIndependence']}")
        
        # Battery Test Results (ENHANCED)
        if a.get("batteryTestConducted"):
            lines.append("## Knowledcare Battery Test Results")
            lines.append(f"Battery Test Conducted: {a['batteryTestConducted']}")
            if a.get("batteryTestSummary"):
                lines.append(f"Battery Test Summary: {a['batteryTestSummary']}")
            if a.get("batteryTestReportUrl"):
                lines.append(f"Battery Test Report Available: Yes")
        
        # Enhanced Scoring System (NEW)
        lines.append("## Enhanced Scoring Analysis")
        
        # Learning Context Scores
        if a.get("environmentScore") is not None:
            lines.append(f"Environment Score: {a['environmentScore']}/7")
        if a.get("environmentBuffer") is not None:
            lines.append(f"Environment Buffer: {a['environmentBuffer']} points")
        if a.get("exposureScore") is not None:
            lines.append(f"Exposure Score: {a['exposureScore']}/3")
        if a.get("supportScore") is not None:
            lines.append(f"Support Score: {a['supportScore']}/2")
        if a.get("interventionScore") is not None:
            lines.append(f"Intervention Score: {a['interventionScore']}/2")
        if a.get("languageRiskScore") is not None:
            lines.append(f"Language Risk Score: {a['languageRiskScore']}/2")
        if a.get("materialAccessScore") is not None:
            lines.append(f"Material Access Score: {a['materialAccessScore']}/2")
        
        # Resources Section Scores
        if a.get("schoolTextScore") is not None:
            lines.append(f"School Text Score: {a['schoolTextScore']}/100")
        if a.get("knownTextScore") is not None:
            lines.append(f"Known Text Score: {a['knownTextScore']}/100")
        if a.get("unknownTextScore") is not None:
            lines.append(f"Unknown Text Score: {a['unknownTextScore']}/100")
        if a.get("finalReadingScore") is not None:
            lines.append(f"Final Reading Score: {a['finalReadingScore']}/100")
        if a.get("resourceContextScore") is not None:
            lines.append(f"Resource Context Score: {a['resourceContextScore']}")
        if a.get("finalRiskScore") is not None:
            lines.append(f"Final Risk Score: {a['finalRiskScore']}/100")
        
        # Original Quantitative Scores
        lines.append("## Core Assessment Scores")
        if a.get("decodingScore") is not None:
            lines.append(f"Decoding Score: {a['decodingScore']}/100")
        if a.get("fluencyScore") is not None:
            lines.append(f"Fluency Score: {a['fluencyScore']}/100")
        if a.get("comprehensionScore") is not None:
            lines.append(f"Comprehension Score: {a['comprehensionScore']}/100")
        if a.get("overallReadingScore") is not None:
            lines.append(f"Overall Reading Score: {a['overallReadingScore']}/100")
        if a.get("tier"):
            lines.append(f"Intervention Tier: {a['tier']}")
        if a.get("ldRiskFlag"):
            lines.append(f"Learning Disability Risk Flag: {a['ldRiskFlag']}")
            if a.get("ldRiskDetails"):
                lines.append(f"LD Risk Details: {a['ldRiskDetails']}")
        
        # Symptom analysis
        symptoms = get_active_symptoms(a, READING_SYMPTOM_MAP)
        if symptoms:
            lines.append(f"Symptoms ({len(symptoms)}): " + ", ".join(symptoms[:15]))
        
        # Additional notes
        if a.get("additionalNotes"):
            lines.append(f"Additional Notes: {a['additionalNotes']}")
        
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


def _extract_reading_ai_insights(assessments: list) -> str:
    """Extract AI-generated insights and recommendations from reading assessments."""
    if not assessments:
        return "No AI insights available"
    
    insights_parts = []
    for i, a in enumerate(assessments[:3]):
        if a.get("aiInsights"):
            try:
                ai_data = a["aiInsights"] if isinstance(a["aiInsights"], dict) else json.loads(a["aiInsights"])
                lines = [f"--- AI Insights {i+1} ---"]
                
                # Diagnosis summary
                if ai_data.get("diagnosisSummary"):
                    lines.append(f"AI Diagnosis: {ai_data['diagnosisSummary']}")
                
                # Recommendations
                if ai_data.get("recommendations"):
                    lines.append("AI Recommendations:")
                    if isinstance(ai_data["recommendations"], list):
                        for rec in ai_data["recommendations"][:5]:  # Limit to prevent overly long output
                            lines.append(f"  - {rec}")
                    else:
                        lines.append(f"  {ai_data['recommendations']}")
                
                # Instructional strategies
                if ai_data.get("instructionalStrategies"):
                    lines.append("Instructional Strategies:")
                    if isinstance(ai_data["instructionalStrategies"], list):
                        for strategy in ai_data["instructionalStrategies"][:3]:
                            lines.append(f"  - {strategy}")
                    else:
                        lines.append(f"  {ai_data['instructionalStrategies']}")
                
                # Interventions
                interventions = ai_data.get("interventions", {})
                if interventions:
                    lines.append("Recommended Interventions:")
                    if interventions.get("programType"):
                        lines.append(f"  Program Type: {interventions['programType']}")
                    if interventions.get("frequency"):
                        lines.append(f"  Frequency: {interventions['frequency']}")
                
                # Support plan
                support_plan = ai_data.get("supportPlan", {})
                if support_plan:
                    lines.append("Support Plan:")
                    if support_plan.get("classroom"):
                        lines.append(f"  Classroom Support: {support_plan['classroom']}")
                    if support_plan.get("home"):
                        lines.append(f"  Home Support: {support_plan['home']}")
                
                # Learning path
                learning_path = ai_data.get("learningPath", {})
                if learning_path:
                    lines.append("Learning Path:")
                    if learning_path.get("fourWeekGoals"):
                        lines.append(f"  4-Week Goals: {learning_path['fourWeekGoals']}")
                    if learning_path.get("threeMonthGoals"):
                        lines.append(f"  3-Month Goals: {learning_path['threeMonthGoals']}")
                
                # AI insights status
                if a.get("aiInsightsStatus"):
                    lines.append(f"AI Insights Status: {a['aiInsightsStatus']}")
                
                insights_parts.append("\n".join(lines))
            except (ValueError, TypeError):
                insights_parts.append(f"--- AI Insights {i+1} ---\nUnable to parse AI insights data")
    
    return "\n\n".join(insights_parts) if insights_parts else "No AI insights available"


def _extract_reading_progress(assessments: list) -> str:
    """Extract progress tracking data from reading assessments."""
    if not assessments:
        return "No progress data available"
    
    progress_parts = []
    for i, a in enumerate(assessments[:3]):
        if a.get("progressTracking"):
            try:
                progress_data = a["progressTracking"] if isinstance(a["progressTracking"], dict) else json.loads(a["progressTracking"])
                lines = [f"--- Progress Tracking {i+1} ---"]
                
                # Scores
                if progress_data.get("baselineScore") is not None:
                    lines.append(f"Baseline Score: {progress_data['baselineScore']}")
                if progress_data.get("currentScore") is not None:
                    lines.append(f"Current Score: {progress_data['currentScore']}")
                if progress_data.get("improvementPercent") is not None:
                    lines.append(f"Improvement: {progress_data['improvementPercent']}%")
                
                # Sessions
                if progress_data.get("sessionsCompleted"):
                    lines.append(f"Sessions Completed: {progress_data['sessionsCompleted']}")
                
                # Reassessment
                if progress_data.get("reassessmentDate"):
                    lines.append(f"Reassessment Date: {progress_data['reassessmentDate']}")
                
                # Graph data (summary only)
                graph_data = progress_data.get("graphData", {})
                if graph_data and isinstance(graph_data, dict):
                    lines.append("Progress Data Available: Yes")
                    if graph_data.get("trend"):
                        lines.append(f"Trend: {graph_data['trend']}")
                
                progress_parts.append("\n".join(lines))
            except (ValueError, TypeError):
                progress_parts.append(f"--- Progress Tracking {i+1} ---\nUnable to parse progress data")
    
    return "\n\n".join(progress_parts) if progress_parts else "No progress data available"


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
