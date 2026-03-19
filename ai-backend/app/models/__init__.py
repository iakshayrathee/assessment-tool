"""
Pydantic models for structured data validation.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StudentProfile(BaseModel):
    id: str
    fullName: str = ""
    grade: str = ""
    age: Optional[int] = None
    gender: str = ""
    schoolId: Optional[str] = None
    school_name: str = ""
    status: str = "ACTIVE"


class AssessmentSummary(BaseModel):
    domain: str  # READING | WRITING | MATH
    symptom_count: int = 0
    severity_score: float = 0.0
    top_concerns: list[str] = []


class IEPGoal(BaseModel):
    domain: str
    goal_statement: str
    target_accuracy: int = 80
    strategy: str = ""
    rationale: str = ""
    priority: int = 1
    status: str = "AI_DRAFT"
    editable: bool = True


class LongTermPlan(BaseModel):
    duration_months: int = 6
    domains: list[str] = []
    diagnosis: str = ""
    suspected_ld: str = ""
    learning_strengths: list[str] = []
    challenge_areas: list[str] = []
    goals: list[dict] = []
    status: str = "AI_DRAFT"
    editable: bool = True


class ShortTermPlan(BaseModel):
    duration_weeks: int = 6
    stp_goal: str = ""
    linked_goal_statement: str = ""
    intervention_strategy: list[str] = []
    target_accuracy: int = 80
    sub_goals: list[dict] = []
    status: str = "AI_DRAFT"
    editable: bool = True


class WeeklyLessonPlan(BaseModel):
    week_number: int = 1
    topics: str = ""
    areas_of_remediation: list[str] = []
    average_time: int = 45
    motivation_strategy: str = ""
    resources_used: list[str] = []
    activities: list[dict] = []
    status: str = "AI_DRAFT"
    editable: bool = True


class RiskClassification(BaseModel):
    student_id: str
    student_name: str = ""
    risk_level: str  # HIGH_SUPPORT | MODERATE_SUPPORT | ON_TRACK
    symptom_count: int = 0
    avg_iep_progress: float = 0.0


class EarlyWarning(BaseModel):
    student_id: str
    student_name: str = ""
    reason: str = ""
    urgency: str = "MEDIUM"  # LOW | MEDIUM | HIGH


class ReportMetadata(BaseModel):
    generated_at: str = ""
    report_type: str = ""
    model_used: str = ""
    editable: bool = True
    status: str = "AI_DRAFT"
