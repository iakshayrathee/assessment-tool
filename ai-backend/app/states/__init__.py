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
    prompts: Annotated[list[str], add]
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
    prompts: Annotated[list[str], add]
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
    prompts: Annotated[list[str], add]
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
    prompts: Annotated[list[str], add]
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
    prompts: Annotated[list[str], add]
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
    prompts: Annotated[list[str], add]
    error: str



# Progressive enrichment agent — same graph runs after each tab save.
# All tab dicts are optional (default {}). Confidence rises as more data arrives.

class IntakeIntelligenceState(TypedDict, total=False):
    # ── Input: data from each tab (passed directly — no DB fetch) ─────────────
    # Only the tabs that have been completed are non-empty.
    referral: dict          # areas, source, duration, severity
    demographics: dict      # age, grade, mother_tongue, instruction_language, etc.
    family: dict            # family_type, primary_caregiver, languages_at_home, etc.
    prenatal: dict          # pregnancy_normal, medications, delivery_type, etc.
    postnatal: dict         # age_of_walking, age_of_speech, etc.
    medical: dict           # health_concerns, on_medication, epileptic_history, etc.
    educational: dict       # attended_preschool, repeated_grades, etc.
    tabs_completed: list    # e.g. ["referral", "demographics", "family"]

    # ── Computed intermediate ──────────────────────────────────────────────────
    cumulative_context: dict    # assembled ChildContextObject (all tabs merged)
    contextual_flags: list      # list of fired flag names (rule-based, no LLM)

    # ── Output: 7-section profile ──────────────────────────────────────────────
    intake_profile: dict        # {
                                #   child_context_summary: str,
                                #   language_context: str,
                                #   educational_context: str,
                                #   family_home_context: str,      # available after Tab 3
                                #   contextual_factors: [str],
                                #   recommended_domains: [str],
                                #   missing_information: [str],
                                #   reasoning: str,
                                #   confidence: str,               # LOW|LOW_MEDIUM|MEDIUM|MEDIUM_HIGH|HIGH
                                # }

    # ── Metadata ──────────────────────────────────────────────────────────────
    prompts: Annotated[list[str], add]
    error: str
