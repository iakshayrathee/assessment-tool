"""
Database service — async PostgreSQL connection pool for read-only access.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from app.config import get_settings
from typing import Any
import json


_engine = None
_session_factory = None


async def get_engine():
    global _engine
    if _engine is None:
        settings = get_settings()
        _engine = create_async_engine(
            settings.database_url,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            echo=False,
        )
    return _engine


async def get_session() -> AsyncSession:
    global _session_factory
    if _session_factory is None:
        engine = await get_engine()
        _session_factory = async_sessionmaker(engine, expire_on_commit=False)
    return _session_factory()


async def fetch_one(query: str, params: dict | None = None) -> dict | None:
    """Execute a query and return a single row as dict."""
    async with await get_session() as session:
        result = await session.execute(text(query), params or {})
        row = result.mappings().first()
        return dict(row) if row else None


async def fetch_all(query: str, params: dict | None = None) -> list[dict]:
    """Execute a query and return all rows as list of dicts."""
    async with await get_session() as session:
        result = await session.execute(text(query), params or {})
        return [dict(row) for row in result.mappings().all()]


async def fetch_student_profile(student_id: str) -> dict | None:
    """Fetch full student profile with school info."""
    return await fetch_one(
        """
        SELECT s.*, sch.name as school_name
        FROM students s
        LEFT JOIN schools sch ON s."schoolId" = sch.id
        WHERE s.id = :student_id
        """,
        {"student_id": student_id},
    )


async def fetch_intake_form(student_id: str) -> dict | None:
    """Fetch the latest intake form for a student."""
    return await fetch_one(
        """
        SELECT * FROM intake_forms
        WHERE "studentId" = :student_id
        ORDER BY "createdAt" DESC LIMIT 1
        """,
        {"student_id": student_id},
    )


async def fetch_reading_assessments(student_id: str, limit: int = 5) -> list[dict]:
    return await fetch_all(
        """
        SELECT * FROM reading_skill_assessments
        WHERE "studentId" = :student_id
        ORDER BY "createdAt" DESC LIMIT :limit
        """,
        {"student_id": student_id, "limit": limit},
    )


async def fetch_writing_assessments(student_id: str, limit: int = 5) -> list[dict]:
    return await fetch_all(
        """
        SELECT * FROM writing_skill_assessments
        WHERE "studentId" = :student_id
        ORDER BY "createdAt" DESC LIMIT :limit
        """,
        {"student_id": student_id, "limit": limit},
    )


async def fetch_math_assessments(student_id: str, limit: int = 5) -> list[dict]:
    return await fetch_all(
        """
        SELECT * FROM math_skill_assessments
        WHERE "studentId" = :student_id
        ORDER BY "createdAt" DESC LIMIT :limit
        """,
        {"student_id": student_id, "limit": limit},
    )


async def fetch_informal_assessments(student_id: str, limit: int = 5) -> list[dict]:
    return await fetch_all(
        """
        SELECT * FROM assessments
        WHERE "studentId" = :student_id
        ORDER BY "createdAt" DESC LIMIT :limit
        """,
        {"student_id": student_id, "limit": limit},
    )


async def fetch_formal_assessments(student_id: str, limit: int = 3) -> list[dict]:
    return await fetch_all(
        """
        SELECT * FROM formal_assessments
        WHERE "studentId" = :student_id
        ORDER BY "createdAt" DESC LIMIT :limit
        """,
        {"student_id": student_id, "limit": limit},
    )


async def fetch_iep_goals(student_id: str, active_only: bool = True) -> list[dict]:
    status_filter = "AND status IN ('NOT_STARTED', 'IN_PROGRESS')" if active_only else ""
    return await fetch_all(
        f"""
        SELECT * FROM iep_goals
        WHERE "studentId" = :student_id {status_filter}
        ORDER BY "createdAt" DESC
        """,
        {"student_id": student_id},
    )


async def fetch_long_term_plans(student_id: str, active_only: bool = True) -> list[dict]:
    # Column uses @map("student_id") in Prisma — actual DB column is snake_case
    status_filter = "AND status = 'ACTIVE'" if active_only else ""
    return await fetch_all(
        f"""
        SELECT * FROM long_term_plans
        WHERE student_id = :student_id {status_filter}
        ORDER BY created_at DESC
        """,
        {"student_id": student_id},
    )


async def fetch_short_term_plans(ltp_id: str) -> list[dict]:
    # Column uses @map("long_term_plan_id") in Prisma — actual DB column is snake_case
    return await fetch_all(
        """
        SELECT * FROM short_term_plans
        WHERE long_term_plan_id = :ltp_id
        ORDER BY created_at DESC
        """,
        {"ltp_id": ltp_id},
    )


async def fetch_weekly_lesson_plans(student_id: str, limit: int = 10) -> list[dict]:
    # Column uses @map("student_id") in Prisma — actual DB column is snake_case
    return await fetch_all(
        """
        SELECT * FROM weekly_lesson_plans
        WHERE student_id = :student_id
        ORDER BY created_at DESC LIMIT :limit
        """,
        {"student_id": student_id, "limit": limit},
    )


async def fetch_educator_profile(educator_id: str) -> dict | None:
    """Fetch the special educator profile for the given educator ID."""
    return await fetch_one(
        """
        SELECT sep.*, u.email
        FROM special_educator_profiles sep
        LEFT JOIN users u ON u.id = sep."userId"
        WHERE sep.id = :educator_id
        """,
        {"educator_id": educator_id},
    )


async def fetch_session_notes(student_id: str, limit: int = 10) -> list[dict]:
    return await fetch_all(
        """
        SELECT * FROM session_notes
        WHERE "studentId" = :student_id
        ORDER BY "sessionDate" DESC LIMIT :limit
        """,
        {"student_id": student_id, "limit": limit},
    )


async def fetch_iep_documents(student_id: str, limit: int = 5) -> list[dict]:
    return await fetch_all(
        """
        SELECT * FROM iep_documents
        WHERE "studentId" = :student_id
        ORDER BY "createdAt" DESC LIMIT :limit
        """,
        {"student_id": student_id, "limit": limit},
    )


async def fetch_iep_progress_updates(goal_id: str) -> list[dict]:
    return await fetch_all(
        """
        SELECT * FROM iep_progress
        WHERE "goalId" = :goal_id
        ORDER BY "updateDate" ASC
        """,
        {"goal_id": goal_id},
    )


async def fetch_school_students(school_id: str) -> list[dict]:
    return await fetch_all(
        """
        SELECT s.*, 
            (SELECT COUNT(*) FROM reading_skill_assessments r WHERE r."studentId" = s.id) as reading_count,
            (SELECT COUNT(*) FROM writing_skill_assessments w WHERE w."studentId" = s.id) as writing_count,
            (SELECT COUNT(*) FROM math_skill_assessments m WHERE m."studentId" = s.id) as math_count
        FROM students s
        WHERE s."schoolId" = :school_id AND s.status = 'ACTIVE'
        """,
        {"school_id": school_id},
    )


async def fetch_educator_students(educator_id: str) -> list[dict]:
    return await fetch_all(
        """
        SELECT s.* FROM students s
        JOIN student_assignments sa ON sa."studentId" = s.id
        WHERE sa."specialEducatorId" = :educator_id AND sa."isActive" = true
        """,
        {"educator_id": educator_id},
    )


async def close_engine():
    global _engine, _session_factory
    if _engine:
        await _engine.dispose()
        _engine = None
        _session_factory = None
