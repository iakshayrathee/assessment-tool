"""
Reading Assessment AI Insights endpoint — /api/reading-insights

Generates structured AI insights specifically for the new 14-section
reading assessment: diagnosis, recommendations, strategies, interventions,
support plan, and learning path.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from typing import Union
from langchain_openai import ChatOpenAI
from app.config import get_settings
from app.services.cache_service import make_cache_key, get_cached, set_cached
from app.services.symptom_mapper import (
    format_reading_structured_summary,
    extract_reading_structured_analysis,
)
from app.utils.json_utils import safe_json
import json

router = APIRouter(prefix="/api/reading-insights", tags=["Reading AI Insights"])


class ReadingInsightsRequest(BaseModel):
    student_id: str
    student_name: str = "Student"
    student_grade: str = ""
    assessment_data: dict = {}
    skip_cache: bool = False


def _join_if_list(v) -> str:
    """Coerce lists to newline-separated strings (LLM sometimes returns lists)."""
    if isinstance(v, list):
        return "\n".join(f"• {item}" for item in v)
    return str(v) if v is not None else ""


class ReadingInsightsResponse(BaseModel):
    diagnosisSummary: str = ""
    recommendations: str = ""
    instructionalStrategies: str = ""
    interventions: dict = {}
    supportPlan: dict = {}
    learningPath: dict = {}
    status: str = "AI_DRAFT"
    cached: bool = False

    @field_validator("recommendations", "instructionalStrategies", "diagnosisSummary", mode="before")
    @classmethod
    def coerce_list_to_str(cls, v):
        return _join_if_list(v)


def _build_reading_insights_prompt(
    student_info: str,
    structured_summary: str,
    categorized_analysis: str,
) -> str:
    return f"""You are a senior special-education reading specialist with expertise in
literacy interventions, structured literacy approaches (Orton-Gillingham, Wilson Reading),
and reading disability assessment (dyslexia, visual processing, fluency disorders).

STUDENT: {student_info}

STRUCTURED READING DATA:
{structured_summary}

CATEGORIZED ANALYSIS:
{categorized_analysis}

Based on this reading assessment data, generate a comprehensive reading intervention plan.
Return a JSON object with EXACTLY these keys:

{{
  "diagnosisSummary": "2-3 sentence summary of the key reading issue(s) identified — be specific about which skills are most impacted and at what level the student is functioning",

  "recommendations": "3-5 specific, actionable recommendations for the educator — each must name a concrete skill target and approach (e.g. 'Focus on CVC word decoding using multisensory methods — trace, say, write each word. Target: 80% accuracy on CVC word lists within 4 weeks')",

  "instructionalStrategies": "3-5 evidence-based instructional strategies — name the specific method, how to implement it, and when to use it (e.g. 'Guided oral reading with echo reading: educator reads a sentence, student repeats with same pace and expression — use for fluency building in first 10 min of each session')",

  "interventions": {{
    "programType": "name a specific intervention program or approach (e.g. 'Structured Literacy with Orton-Gillingham methodology' or 'Fluency-oriented reading instruction (FORI)')",
    "frequency": "recommended frequency (e.g. '4× per week, 30-minute sessions')",
    "duration": "recommended program duration (e.g. '12 weeks initial phase, reassess at week 6')",
    "focusAreas": ["list 3-4 specific focus areas in priority order"]
  }},

  "supportPlan": {{
    "classroomSupport": "3-4 specific classroom accommodations the teacher should implement (e.g. 'Provide text with larger font and increased line spacing; allow audio versions of grade-level texts; pair with a reading buddy for collaborative reading activities')",
    "homePlan": "3-4 parent-friendly activities with clear instructions — no jargon (e.g. 'Read together for 15 min daily: take turns reading sentences. When your child gets stuck on a word, wait 5 seconds, then say the word and have them repeat it')"
  }},

  "learningPath": {{
    "fourWeekGoals": ["2-3 specific, measurable goals for the first 4 weeks (e.g. 'Increase CVC word reading accuracy from 60% to 80%', 'Read 40 WPM on grade-level text')"],
    "threeMonthGoals": ["2-3 specific goals for 3 months (e.g. 'Read at instructional level (75%+ accuracy) on grade-level passages', 'Demonstrate understanding of main idea in 3/5 comprehension checks')"]
  }}
}}

RULES:
- Every recommendation must be specific to THIS student's actual scores and patterns.
- Do NOT include generic advice — reference actual data points (WPM, accuracy %, scores).
- If the student has high scores (>80), focus on enrichment and maintaining strengths.
- If LD risk is flagged, include referral recommendation in the diagnosis summary.
- Keep language professional but accessible to educators and parents."""


@router.post("/generate", response_model=ReadingInsightsResponse)
async def generate_reading_insights(req: ReadingInsightsRequest):
    """Generate AI-powered reading insights for a 14-section reading assessment.
    
    Cost: ~$0.002 per call (GPT-4o-mini, 1 LLM call).
    """
    try:
        settings = get_settings()
        cache_key = make_cache_key("reading_insights", req.student_id, req.assessment_data)

        if settings.enable_cache and not req.skip_cache:
            cached = get_cached(cache_key)
            if cached:
                return ReadingInsightsResponse(**cached, cached=True)

        student_info = f"Name: {req.student_name}, Grade: {req.student_grade}"
        structured_summary = format_reading_structured_summary(req.assessment_data)
        categorized = extract_reading_structured_analysis(req.assessment_data)

        prompt = _build_reading_insights_prompt(
            student_info=student_info,
            structured_summary=structured_summary,
            categorized_analysis=json.dumps(categorized, indent=1),
        )

        llm = ChatOpenAI(
            model=settings.default_model,
            temperature=settings.temperature,
            api_key=settings.openai_api_key,
            max_tokens=settings.max_tokens,
            model_kwargs={"response_format": {"type": "json_object"}} if settings.use_json_mode else {},
        )

        response = await llm.ainvoke(prompt)
        parsed = safe_json(response.content)

        response_data = {
            "diagnosisSummary": parsed.get("diagnosisSummary", ""),
            "recommendations": parsed.get("recommendations", ""),
            "instructionalStrategies": parsed.get("instructionalStrategies", ""),
            "interventions": parsed.get("interventions", {}),
            "supportPlan": parsed.get("supportPlan", {}),
            "learningPath": parsed.get("learningPath", {}),
        }

        if settings.enable_cache:
            set_cached(cache_key, response_data, ttl=settings.cache_ttl_seconds)

        return ReadingInsightsResponse(**response_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
