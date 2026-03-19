"""
State definitions for all LangGraph agents.
Each state is a TypedDict used as the graph's state schema.
"""

from typing import TypedDict, Annotated, Any
from operator import add


# ── Agent 1: Assessment Intelligence ──────────────────────────────────────────

class AssessmentState(TypedDict, total=False):
    # Input
    student_id: str
    assessment_type: str  # READING | WRITING | MATH | ALL

    # Gathered context
    student_profile: dict
    intake_data: dict
    reading_assessments: list[dict]
    writing_assessments: list[dict]
    math_assessments: list[dict]
    informal_assessments: list[dict]
    formal_assessments: list[dict]

    # Analysis outputs
    symptom_analysis: dict          # categorized symptoms per domain
    severity_scores: dict           # { reading: 0-100, writing: 0-100, math: 0-100 }
    domain_profile: dict            # strengths, weaknesses, patterns per domain
    risk_classification: str        # HIGH_SUPPORT | MODERATE_SUPPORT | ON_TRACK
    differential_indicators: list   # dyslexia, dyscalculia, dysgraphia indicators
    recommended_next_steps: list    # actionable recommendations

    # Metadata
    error: str


# ── Agent 2: IEP & Goal Planning ─────────────────────────────────────────────

class IEPPlanningState(TypedDict, total=False):
    # Input
    student_id: str
    assessment_analysis: dict       # from Assessment Intelligence Agent

    # Gathered context
    student_profile: dict
    existing_iep_goals: list[dict]
    existing_ltps: list[dict]
    existing_stps: list[dict]

    # Generated outputs
    gap_analysis: dict              # unaddressed areas
    generated_goals: list[dict]     # SMART goals per domain
    generated_ltp: dict             # long-term plan structure
    generated_stps: list[dict]      # short-term plans
    generated_wlps: list[dict]      # weekly lesson plan templates

    # Metadata
    error: str


# ── Agent 3: Lesson Plan ─────────────────────────────────────────────────────

class LessonPlanState(TypedDict, total=False):
    # Input
    student_id: str
    week_number: int

    # Gathered context
    student_profile: dict
    current_stp: dict
    recent_sessions: list[dict]
    recent_evaluations: list[dict]
    assessment_summary: dict

    # Generated outputs
    progress_analysis: str
    suggested_activities: list[dict]
    suggested_resources: list[str]
    motivation_strategy: str
    estimated_time: int
    areas_of_remediation: list[str]
    lesson_plan: dict               # complete lesson plan

    # Metadata
    error: str


# ── Agent 4: Report Generation ───────────────────────────────────────────────

class ReportState(TypedDict, total=False):
    # Input
    report_type: str                # ASSESSMENT | LESSON_PLAN | PARENT | SCHOOL | CENTER
    target_id: str                  # student_id, school_id, or center_id
    educator_id: str

    # Gathered context
    raw_data: dict

    # Generated outputs
    structured_sections: dict       # report sections
    final_report: dict              # formatted report
    metadata: dict                  # title, date, etc.

    # Metadata
    error: str


# ── Agent 5: Risk & Progress ─────────────────────────────────────────────────

class RiskProgressState(TypedDict, total=False):
    # Input
    scope: str                      # STUDENT | SCHOOL | CENTER
    target_id: str

    # Gathered data
    student_profiles: list[dict]
    assessment_data: list[dict]

    # Analysis outputs
    risk_classifications: list[dict]
    progress_trends: dict
    early_warnings: list[dict]
    recommendations: list[dict]

    # Metadata
    error: str


# ── Agent 6: Educator Intelligence ───────────────────────────────────────────

class EducatorIntelligenceState(TypedDict, total=False):
    # Input
    educator_id: str

    # Gathered context
    educator_profile: dict
    assigned_students: list[dict]
    student_outcomes: list[dict]

    # Analysis outputs
    performance_summary: dict
    mentoring_insights: list[str]
    training_recommendations: list[str]
    student_priority_list: list[dict]

    # Metadata
    error: str
