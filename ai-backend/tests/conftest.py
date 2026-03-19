"""
Pytest configuration and shared fixtures.
"""

import pytest
import os
from unittest.mock import patch


@pytest.fixture(autouse=True)
def mock_env_vars():
    """Set minimal env vars for testing without real API keys."""
    env = {
        "OPENAI_API_KEY": "sk-test-key",
        "DATABASE_URL": "postgresql+asyncpg://test:test@localhost:5432/test",
        "BACKEND_API_URL": "http://localhost:5000",
        "LANGCHAIN_TRACING_V2": "false",
        "LANGCHAIN_API_KEY": "ls-test-key",
        "LANGCHAIN_PROJECT": "test-project",
        "REDIS_URL": "redis://localhost:6379/0",
    }
    with patch.dict(os.environ, env):
        # Clear the cached settings
        from app.config import get_settings
        get_settings.cache_clear()
        yield
        get_settings.cache_clear()


@pytest.fixture
def sample_student_profile():
    return {
        "id": "student-test-123",
        "fullName": "Test Student",
        "grade": "3",
        "age": 8,
        "gender": "MALE",
        "schoolId": "school-test-1",
        "school_name": "Test School",
        "status": "ACTIVE",
    }


@pytest.fixture
def sample_reading_assessment():
    return {
        "id": "ra-test-1",
        "studentId": "student-test-123",
        "missesLetters": True,
        "missesWords": True,
        "substitution": False,
        "omissionBeginning": True,
        "poorFlowWhileReading": True,
        "choppyReading": True,
        "readsWithoutUnderstanding": True,
        "readingQ1": "Below Grade Level",
    }


@pytest.fixture
def sample_writing_assessment():
    return {
        "id": "wa-test-1",
        "studentId": "student-test-123",
        "incorrectPencilGrip": True,
        "holdsPencilTooTightly": True,
        "reversals": True,
        "poorSpacingBetweenLetters": True,
        "writingQ1": "Poor letter formation observed",
    }


@pytest.fixture
def sample_iep_goals():
    return [
        {
            "id": "goal-1",
            "studentId": "student-test-123",
            "domain": "READING",
            "goalStatement": "Improve decoding skills to 80% accuracy",
            "targetAccuracy": 80,
            "status": "IN_PROGRESS",
            "progressPercent": 45,
        },
        {
            "id": "goal-2",
            "studentId": "student-test-123",
            "domain": "WRITING",
            "goalStatement": "Improve letter formation to 75% accuracy",
            "targetAccuracy": 75,
            "status": "NOT_STARTED",
            "progressPercent": 0,
        },
    ]
