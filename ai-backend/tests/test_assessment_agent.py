"""
Tests for the Assessment Intelligence Agent.
"""

import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock
from app.agents.assessment_agent import (
    gather_student_context,
    analyze_symptoms,
    score_severity,
    classify_risk_and_recommend,
    build_assessment_graph,
)
from app.services.symptom_mapper import (
    count_symptoms,
    calculate_severity_score,
    get_active_symptoms,
    get_categorized_symptoms,
    READING_SYMPTOM_MAP,
    READING_CATEGORIES,
)


# ── Symptom Mapper Tests ──────────────────────────────────────────────────────

def test_count_symptoms_empty():
    assert count_symptoms(None) == 0
    assert count_symptoms({}) == 0


def test_count_symptoms_with_data():
    assessment = {
        "missesLetters": True,
        "missesWords": True,
        "substitution": False,
        "fullName": "Test Student",  # non-boolean ignored
    }
    assert count_symptoms(assessment) == 2


def test_count_symptoms_all_true():
    assessment = {k: True for k in READING_SYMPTOM_MAP.keys()}
    assert count_symptoms(assessment) == len(READING_SYMPTOM_MAP)


def test_calculate_severity_score():
    assert calculate_severity_score(0, 100) == 0.0
    assert calculate_severity_score(50, 100) == 50.0
    assert calculate_severity_score(0, 0) == 0.0


def test_get_active_symptoms():
    assessment = {
        "missesLetters": True,
        "missesWords": False,
        "substitution": True,
    }
    symptoms = get_active_symptoms(assessment, READING_SYMPTOM_MAP)
    assert "Misses letters while reading" in symptoms
    assert "Substitutes words" in symptoms
    assert len(symptoms) == 2


def test_get_categorized_symptoms():
    assessment = {
        "missesLetters": True,
        "poorFlowWhileReading": True,
        "readsWithoutUnderstanding": True,
    }
    cats = get_categorized_symptoms(assessment, READING_SYMPTOM_MAP, READING_CATEGORIES)
    assert "Decoding & Word Reading" in cats
    assert "Fluency & Reading Flow" in cats
    assert "Comprehension" in cats


# ── Risk Classification Tests ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_classify_risk_high_support():
    state = {
        "student_id": "test-student-1",
        "severity_scores": {"total_symptom_count": 35},
        "informal_assessments": [],
    }
    with patch("app.agents.assessment_agent.db_service") as mock_db, \
         patch("app.agents.assessment_agent._get_llm") as mock_llm:
        mock_db.fetch_iep_goals = AsyncMock(return_value=[])
        mock_llm.return_value.ainvoke = AsyncMock(return_value=MagicMock(
            content='{"priority_areas": ["Increase reading fluency"]}'
        ))
        result = await classify_risk_and_recommend(state)
        assert result["risk_classification"] == "HIGH_SUPPORT"


@pytest.mark.asyncio
async def test_classify_risk_moderate():
    state = {
        "student_id": "test-student-2",
        "severity_scores": {"total_symptom_count": 20},
        "informal_assessments": [],
    }
    with patch("app.agents.assessment_agent.db_service") as mock_db, \
         patch("app.agents.assessment_agent._get_llm") as mock_llm:
        mock_db.fetch_iep_goals = AsyncMock(return_value=[])
        mock_llm.return_value.ainvoke = AsyncMock(return_value=MagicMock(
            content='{"priority_areas": ["Focus on math interventions"]}'
        ))
        result = await classify_risk_and_recommend(state)
        assert result["risk_classification"] == "MODERATE_SUPPORT"


@pytest.mark.asyncio
async def test_classify_risk_on_track():
    state = {
        "student_id": "test-student-3",
        "severity_scores": {"total_symptom_count": 5},
        "informal_assessments": [],
    }
    with patch("app.agents.assessment_agent.db_service") as mock_db, \
         patch("app.agents.assessment_agent._get_llm") as mock_llm:
        mock_db.fetch_iep_goals = AsyncMock(return_value=[
            {"progressPercent": 85},
        ])
        mock_llm.return_value.ainvoke = AsyncMock(return_value=MagicMock(
            content='{"priority_areas": ["Continue current interventions"]}'
        ))
        result = await classify_risk_and_recommend(state)
        assert result["risk_classification"] == "ON_TRACK"


# ── Symptom Analysis Tests ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_analyze_symptoms():
    state = {
        "reading_assessments": [{
            "missesLetters": True,
            "missesWords": True,
            "poorFlowWhileReading": True,
        }],
        "writing_assessments": [{
            "incorrectPencilGrip": True,
            "reversals": True,
        }],
        "math_assessments": [],
    }
    result = await analyze_symptoms(state)
    analysis = result["symptom_analysis"]
    assert "reading" in analysis
    assert "writing" in analysis
    assert len(analysis["reading"]) > 0


# ── Score Severity Tests ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_score_severity():
    state = {
        "reading_assessments": [{
            "missesLetters": True,
            "missesWords": True,
        }],
        "writing_assessments": [],
        "math_assessments": [],
    }
    result = await score_severity(state)
    scores = result["severity_scores"]
    assert scores["reading_symptom_count"] == 2
    assert scores["writing_symptom_count"] == 0
    assert scores["math_symptom_count"] == 0
    assert scores["reading"] > 0


# ── Graph Build Test ──────────────────────────────────────────────────────────

def test_build_assessment_graph():
    """Ensure the graph compiles without errors."""
    graph = build_assessment_graph()
    compiled = graph.compile()
    assert compiled is not None
