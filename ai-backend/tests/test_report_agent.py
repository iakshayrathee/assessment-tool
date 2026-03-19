"""
Tests for the Report Generation Agent.
"""

import pytest
from unittest.mock import AsyncMock, patch
from app.agents.report_agent import (
    build_report_graph,
    _extract_reading_text,
    _extract_writing_text,
    _extract_iep_text,
    _extract_intake_text,
)
from app.services.symptom_mapper import READING_SYMPTOM_MAP


def test_extract_reading_text_empty():
    assert "No reading assessments available" in _extract_reading_text([])


def test_extract_reading_text_with_data():
    data = [{
        "readingQ1": "Below grade level",
        "missesLetters": True,
        "missesWords": True,
        "additionalNotes": "Struggles with phonics",
    }]
    text = _extract_reading_text(data)
    assert "Below grade level" in text
    assert "Symptoms" in text


def test_extract_iep_text_empty():
    assert "No active IEP goals" in _extract_iep_text([])


def test_extract_iep_text_with_data():
    goals = [
        {"domain": "READING", "goalStatement": "Improve decoding", "progressPercent": 60},
    ]
    text = _extract_iep_text(goals)
    assert "READING" in text
    assert "Improve decoding" in text
    assert "60%" in text


def test_extract_intake_text_none():
    assert "No intake form" in _extract_intake_text(None)


def test_extract_intake_text_with_data():
    intake = {
        "id": "123",
        "studentId": "456",
        "familyType": "Nuclear",
        "dominantWritingHand": "RIGHT",
    }
    text = _extract_intake_text(intake)
    assert "familyType: Nuclear" in text
    assert "dominantWritingHand: RIGHT" in text
    assert "id:" not in text  # metadata fields excluded


def test_build_report_graph():
    graph = build_report_graph()
    compiled = graph.compile()
    assert compiled is not None
