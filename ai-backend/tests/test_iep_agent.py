"""
Tests for the IEP & Goal Planning Agent.
"""

import pytest
from unittest.mock import AsyncMock, patch
from app.agents.iep_agent import (
    analyze_gaps,
    build_iep_graph,
)


@pytest.mark.asyncio
async def test_analyze_gaps_identifies_uncovered_domains():
    state = {
        "assessment_analysis": {
            "domain_profile": {
                "reading": {"weaknesses": ["poor decoding"]},
                "writing": {"weaknesses": ["poor letter formation"]},
                "math": {"weaknesses": []},
            }
        },
        "existing_iep_goals": [
            {"domain": "READING", "goalStatement": "Improve decoding", "status": "IN_PROGRESS"},
        ],
    }
    result = await analyze_gaps(state)
    gap = result["gap_analysis"]
    assert "WRITING" in gap["uncovered_domains"]
    assert "READING" not in gap["uncovered_domains"]
    assert gap["gaps_identified"] is True


@pytest.mark.asyncio
async def test_analyze_gaps_no_gaps():
    state = {
        "assessment_analysis": {
            "domain_profile": {
                "reading": {"weaknesses": ["poor decoding"]},
                "writing": {"weaknesses": []},
                "math": {"weaknesses": []},
            }
        },
        "existing_iep_goals": [
            {"domain": "READING", "goalStatement": "Improve decoding", "status": "IN_PROGRESS"},
        ],
    }
    result = await analyze_gaps(state)
    gap = result["gap_analysis"]
    assert gap["gaps_identified"] is False


def test_build_iep_graph():
    graph = build_iep_graph()
    compiled = graph.compile()
    assert compiled is not None
