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
    _extract_reading_ai_insights,
    _extract_reading_progress,
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


def test_extract_reading_text_with_new_fields():
    """Test that new reading assessment fields are properly extracted."""
    data = [{
        "readingQ1": "Below grade level",
        "independentLevelKnownText": True,
        "instructionalLevelUnknownText": True,
        "frustrationLevelKnownText": False,
        "isAtGradeLevel": False,
        "functionalGradeLevel": "Grade 2",
        "performanceSummary": "Student performs at 2nd grade level",
        "batteryTestConducted": True,
        "batteryTestSummary": "Test shows phonological processing weakness",
        "atGradeLevelComprehension": False,
        "currentLevelComprehension": ["Literal", "Inferential"],
        "comprehensionObservation": "Struggles with inferential questions",
        "decodingScore": 65.5,
        "overallReadingScore": 72.0,
        "tier": "Tier 2",
        "additionalNotes": "Needs phonics intervention",
    }]
    text = _extract_reading_text(data)
    
    # Check new sections are present
    assert "## Reading Level Assessment" in text
    assert "## Grade Level Analysis" in text
    assert "## Comprehension Analysis" in text
    assert "## Knowledcare Battery Test Results" in text
    assert "## Core Assessment Scores" in text
    
    # Check specific content
    assert "Independent: Known Text" in text
    assert "Instructional: Unknown Text" in text
    assert "At Grade Level: False" in text
    assert "Functional Grade Level: Grade 2" in text
    assert "Battery Test Conducted: True" in text
    assert "Current Level Comprehension Types: Literal, Inferential" in text
    assert "Decoding Score: 65.5/100" in text
    assert "Overall Reading Score: 72.0/100" in text
    assert "Intervention Tier: Tier 2" in text


def test_extract_reading_ai_insights_empty():
    """Test AI insights extraction with no data."""
    assert "No AI insights available" in _extract_reading_ai_insights([])


def test_extract_reading_ai_insights_with_data():
    """Test AI insights extraction with valid data."""
    data = [{
        "aiInsights": {
            "diagnosisSummary": "Student shows signs of dyslexia with phonological processing deficits",
            "recommendations": [
                "Implement structured phonics program",
                "Use multisensory teaching methods",
                "Provide extra time for reading tasks"
            ],
            "instructionalStrategies": [
                "Orton-Gillingham approach",
                "Visual phonics cues"
            ],
            "interventions": {
                "programType": "Specialized Reading Intervention",
                "frequency": "3x per week"
            },
            "supportPlan": {
                "classroom": "Preferential seating, reduced distractions",
                "home": "Daily reading practice with parent support"
            },
            "learningPath": {
                "fourWeekGoals": "Master basic CVC words",
                "threeMonthGoals": "Read at grade level with 85% accuracy"
            }
        },
        "aiInsightsStatus": "AI_DRAFT"
    }]
    text = _extract_reading_ai_insights(data)
    
    assert "AI Diagnosis: Student shows signs of dyslexia" in text
    assert "AI Recommendations:" in text
    assert "Implement structured phonics program" in text
    assert "Instructional Strategies:" in text
    assert "Orton-Gillingham approach" in text
    assert "Recommended Interventions:" in text
    assert "Program Type: Specialized Reading Intervention" in text
    assert "Support Plan:" in text
    assert "Classroom Support: Preferential seating" in text
    assert "Learning Path:" in text
    assert "4-Week Goals: Master basic CVC words" in text
    assert "AI Insights Status: AI_DRAFT" in text


def test_extract_reading_progress_empty():
    """Test progress tracking extraction with no data."""
    assert "No progress data available" in _extract_reading_progress([])


def test_extract_reading_progress_with_data():
    """Test progress tracking extraction with valid data."""
    data = [{
        "progressTracking": {
            "baselineScore": 45.0,
            "currentScore": 62.5,
            "improvementPercent": 38.9,
            "sessionsCompleted": 24,
            "reassessmentDate": "2024-03-15",
            "graphData": {
                "trend": "Upward",
                "dataPoints": [45, 48, 52, 58, 62]
            }
        }
    }]
    text = _extract_reading_progress(data)
    
    assert "Baseline Score: 45.0" in text
    assert "Current Score: 62.5" in text
    assert "Improvement: 38.9%" in text
    assert "Sessions Completed: 24" in text
    assert "Reassessment Date: 2024-03-15" in text
    assert "Progress Data Available: Yes" in text
    assert "Trend: Upward" in text


def test_extract_reading_text_with_learning_context():
    """Test that new Learning Context fields are properly extracted."""
    data = [{
        "readingQ1": "Below grade level",
        "readingExposureAtHome": "Daily",
        "readingSupportAtHome": "Regular",
        "readingSupportDetails": "Parent helps with homework daily",
        "exposureDetails": "Child reads bedtime stories regularly",
        "supportDetails": "Parent provides phonics support",
        "typeOfSchooling": "CBSE",
        "languageMismatch": "Yes - Hindi at home, English at school",
        "previousIntervention": "Yes",
        "interventionDetails": "Received 6 months of reading therapy",
        "readingMaterialAccess": "Books and digital resources",
        "environmentScore": 5,
        "exposureScore": 3,
        "supportScore": 2,
        "languageRiskScore": 2,
        "materialAccessScore": 2,
    }]
    text = _extract_reading_text(data)
    
    # Check Learning Context section
    assert "## Learning Context Assessment" in text
    assert "Reading Exposure at Home: Daily" in text
    assert "Reading Support at Home: Regular" in text
    assert "Support Details: Parent helps with homework daily" in text
    assert "Exposure Details: Child reads bedtime stories regularly" in text
    assert "Type of Schooling: CBSE" in text
    assert "Language Mismatch: Yes - Hindi at home, English at school" in text
    assert "Previous Intervention: Yes" in text
    assert "Intervention Details: Received 6 months of reading therapy" in text
    assert "Reading Material Access: Books and digital resources" in text
    
    # Check Enhanced Scoring Analysis
    assert "## Enhanced Scoring Analysis" in text
    assert "Environment Score: 5/7" in text
    assert "Exposure Score: 3/3" in text
    assert "Support Score: 2/2" in text
    assert "Language Risk Score: 2/2" in text
    assert "Material Access Score: 2/2" in text


def test_extract_reading_text_with_resources_assessment():
    """Test that new Resources assessment fields are properly extracted."""
    data = [{
        "readingQ1": "Below grade level",
        # School Text Assessment
        "schoolTextGradeLevel": "Grade 3",
        "schoolTextDifficulty": "Grade Level",
        "schoolTextQuality": "Good",
        "schoolTextFluency": "On-level",
        "schoolTextErrors": "Minimal",
        "schoolTextObservation": "Student reads grade-level text with good comprehension",
        "schoolTextScore": 78.5,
        
        # Known Text Assessment
        "knownTextType": "Previously practiced",
        "knownTextFamiliarity": "Highly familiar",
        "knownTextDifficulty": "Easy",
        "knownTextQuality": "Excellent",
        "knownTextFluency": "Fast",
        "knownTextErrors": "Minimal",
        "knownTextObservation": "Student reads familiar text fluently",
        "knownTextScore": 92.0,
        
        # Unknown Text Assessment
        "unknownTextSource": "Textbook (new lesson)",
        "unknownTextDifficulty": "Hard",
        "unknownTextQuality": "Developing",
        "unknownTextFluency": "Slow",
        "unknownTextErrors": "Frequent",
        "unknownTextObservation": "Student struggles with new, difficult text",
        "unknownTextScore": 45.0,
        
        # Resource Context
        "materialTypes": ["Textbooks", "Storybooks", "Digital apps"],
        "materialLevels": ["Grade 1", "Grade 2", "Grade 3"],
        "readingIndependence": "Needs support",
        
        # Enhanced Scores
        "finalReadingScore": 68.5,
        "resourceContextScore": 75,
        "finalRiskScore": 42,
    }]
    text = _extract_reading_text(data)
    
    # Check Resources Assessment section
    assert "## Resources Assessment" in text
    assert "### School Text Assessment" in text
    assert "School Text Grade Level: Grade 3" in text
    assert "School Text Difficulty: Grade Level" in text
    assert "School Text Quality: Good" in text
    assert "School Text Fluency: On-level" in text
    assert "School Text Errors: Minimal" in text
    assert "School Text Observation: Student reads grade-level text with good comprehension" in text
    
    assert "### Known Text Assessment" in text
    assert "Known Text Type: Previously practiced" in text
    assert "Known Text Familiarity: Highly familiar" in text
    assert "Known Text Difficulty: Easy" in text
    assert "Known Text Quality: Excellent" in text
    assert "Known Text Fluency: Fast" in text
    assert "Known Text Observation: Student reads familiar text fluently" in text
    
    assert "### Unknown Text Assessment" in text
    assert "Unknown Text Source: Textbook (new lesson)" in text
    assert "Unknown Text Difficulty: Hard" in text
    assert "Unknown Text Quality: Developing" in text
    assert "Unknown Text Fluency: Slow" in text
    assert "Unknown Text Observation: Student struggles with new, difficult text" in text
    
    # Check Resource Context
    assert "Material Types: Textbooks, Storybooks, Digital apps" in text
    assert "Material Levels: Grade 1, Grade 2, Grade 3" in text
    assert "Reading Independence: Needs support" in text
    
    # Check Enhanced Scoring
    assert "School Text Score: 78.5/100" in text
    assert "Known Text Score: 92.0/100" in text
    assert "Unknown Text Score: 45.0/100" in text
    assert "Final Reading Score: 68.5/100" in text
    assert "Resource Context Score: 75" in text
    assert "Final Risk Score: 42/100" in text


def test_extract_reading_text_handles_json_parsing_errors():
    """Test that JSON parsing errors are handled gracefully."""
    data = [{
        "gradeLevelMappings": "invalid json string",
        "readingQ1": "Some response"
    }]
    text = _extract_reading_text(data)
    assert "Grade Level Mappings: Unable to parse" in text
    assert "Some response" in text


def test_build_report_graph():
    graph = build_report_graph()
    compiled = graph.compile()
    assert compiled is not None
