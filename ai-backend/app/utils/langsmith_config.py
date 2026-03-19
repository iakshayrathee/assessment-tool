"""
LangSmith configuration utilities — semantic naming, tagging, and tracing.
"""

from langsmith import Client
from app.config import get_settings
from typing import Any
import functools


def get_langsmith_client() -> Client | None:
    """Get LangSmith client if configured."""
    settings = get_settings()
    if settings.langchain_api_key:
        return Client(api_key=settings.langchain_api_key)
    return None


def get_run_config(
    agent_name: str,
    run_name: str,
    target_id: str = "",
    tags: list[str] | None = None,
    metadata: dict | None = None,
) -> dict:
    """Build a LangSmith run configuration with semantic naming.

    Usage:
        config = get_run_config("assessment_agent", "analyze_student_123", "student-123")
        result = await agent.ainvoke(initial_state, config=config)
    """
    run_tags = [f"agent:{agent_name}"]
    if tags:
        run_tags.extend(tags)

    run_metadata = {
        "agent": agent_name,
        "target_id": target_id,
    }
    if metadata:
        run_metadata.update(metadata)

    return {
        "run_name": run_name,
        "tags": run_tags,
        "metadata": run_metadata,
        "configurable": {
            "thread_id": f"{agent_name}_{target_id}" if target_id else agent_name,
        },
    }


# Agent-specific config builders

def assessment_run_config(student_id: str, assessment_type: str = "ALL") -> dict:
    return get_run_config(
        agent_name="assessment_intelligence",
        run_name=f"assess_{student_id[:8]}_{assessment_type.lower()}",
        target_id=student_id,
        tags=[f"assessment_type:{assessment_type}", "pipeline:assessment"],
    )


def iep_run_config(student_id: str) -> dict:
    return get_run_config(
        agent_name="iep_goal_planning",
        run_name=f"iep_plan_{student_id[:8]}",
        target_id=student_id,
        tags=["pipeline:iep"],
    )


def lesson_plan_run_config(student_id: str, week: int = 1) -> dict:
    return get_run_config(
        agent_name="lesson_plan",
        run_name=f"lesson_{student_id[:8]}_w{week}",
        target_id=student_id,
        tags=[f"week:{week}", "pipeline:lesson_plan"],
    )


def report_run_config(target_id: str, report_type: str) -> dict:
    return get_run_config(
        agent_name="report_generation",
        run_name=f"report_{report_type.lower()}_{target_id[:8]}",
        target_id=target_id,
        tags=[f"report_type:{report_type}", "pipeline:report"],
    )


def risk_run_config(target_id: str, scope: str) -> dict:
    return get_run_config(
        agent_name="risk_progress",
        run_name=f"risk_{scope.lower()}_{target_id[:8]}",
        target_id=target_id,
        tags=[f"scope:{scope}", "pipeline:risk"],
    )


def educator_run_config(educator_id: str) -> dict:
    return get_run_config(
        agent_name="educator_intelligence",
        run_name=f"educator_{educator_id[:8]}",
        target_id=educator_id,
        tags=["pipeline:educator"],
    )
