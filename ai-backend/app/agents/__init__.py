"""
AI Backend Agents package.
"""

from app.agents.assessment_agent import get_assessment_agent
from app.agents.iep_agent import get_iep_agent
from app.agents.lesson_plan_agent import get_lesson_plan_agent
from app.agents.report_agent import get_report_agent
from app.agents.risk_agent import get_risk_agent
from app.agents.educator_agent import get_educator_agent

__all__ = [
    "get_assessment_agent",
    "get_iep_agent",
    "get_lesson_plan_agent",
    "get_report_agent",
    "get_risk_agent",
    "get_educator_agent",
]
