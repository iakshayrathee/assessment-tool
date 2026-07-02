"""
Intake Intelligence Agent — Agent 7
Progressive enrichment agent that builds a cumulative child context profile
from intake form data collected tab by tab.

Architecture:
  build_cumulative_context   ← assembles ChildContextObject from all tab data (no DB fetch)
      ↓
  detect_contextual_flags    ← rule-based flag detection (zero LLM calls)
      ↓
  generate_intake_profile    ← 1 LLM call producing the 7-section advisory profile
      ↓
  END

Design principles:
  - No DB fetch — all data is passed directly from the frontend (in-flight form data)
  - Same graph runs after every tab save; richer data = higher confidence output
  - Never produces a clinical diagnosis — contextual decision support only
  - Fully cacheable: cache key is hash of all provided tab data
"""

import json
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from app.states import IntakeIntelligenceState
from app.config import get_settings
from app.prompts import build_intake_profile_prompt
from app.services.cache_service import make_cache_key, get_cached, set_cached
from app.utils.json_utils import safe_json


def _get_llm(model: str | None = None):
    settings = get_settings()
    return ChatOpenAI(
        model=model or settings.default_model,
        temperature=0,  # deterministic for context profiling
        response_format={"type": "json_object"},
    )


# ── FLAG RULES ────────────────────────────────────────────────────────────────
# Each flag is detected deterministically — no LLM involvement.

def _detect_flags(ctx: dict) -> list[str]:
    """
    Apply the complete flag registry to the cumulative context object.
    Returns list of flag name strings.
    """
    flags = []
    lang = ctx.get("language_context", {})
    referral = ctx.get("referral_profile", {})
    child = ctx.get("child_context", {})
    family = ctx.get("family_context", {})
    school = ctx.get("school_context", {})
    prenatal = ctx.get("prenatal_context", {})
    postnatal = ctx.get("postnatal_context", {})
    medical = ctx.get("medical_context", {})
    educational = ctx.get("educational_context", {})

    # ── Referral flags ────────────────────────────────────────────────────────
    sources = referral.get("source", [])
    if len(sources) >= 2:
        flags.append("MULTI_SOURCE_REFERRAL")

    duration = referral.get("duration", "")
    if duration in ("1_TO_2_YEARS", "MORE_THAN_2_YEARS"):
        flags.append("LONG_DURATION_CONCERN")

    # ── Demographics / Language flags ─────────────────────────────────────────
    mother_tongue = (lang.get("mother_tongue") or "").strip().lower()
    instruction_lang = (lang.get("instruction_language") or "").strip().lower()
    if mother_tongue and instruction_lang and mother_tongue != instruction_lang:
        flags.append("LANGUAGE_MISMATCH")

    # Age-grade mismatch: expected age for grade = grade_number + 5 (e.g. Grade 1 → age 6)
    try:
        age = int(child.get("age", 0))
        grade_str = str(child.get("grade", "")).replace("Grade", "").replace("grade", "").strip()
        grade_num = int(grade_str) if grade_str.isdigit() else 0
        if grade_num > 0:
            expected_age_max = grade_num + 7
            if age > expected_age_max:
                flags.append("AGE_GRADE_MISMATCH")
    except (ValueError, TypeError):
        pass

    attendance = school.get("attendance", "")
    if attendance == "POOR":
        flags.append("POOR_ATTENDANCE")

    # ── Family History flags ──────────────────────────────────────────────────
    if family.get("family_history_of_difficulties"):
        details = (family.get("family_history_details") or "").lower()
        if any(w in details for w in ("read", "writing", "spell", "language", "literacy")):
            flags.append("FAMILY_HISTORY_LITERACY")
        if any(w in details for w in ("attention", "adhd", "focus", "hyperactiv")):
            flags.append("FAMILY_HISTORY_ATTENTION")

    enjoy_reading = family.get("enjoys_reading_rating")
    digital = family.get("digital_resources", [])
    has_educational_digital = any(
        r in ("EDUCATIONAL_APPS", "LAPTOP", "DESKTOP", "INTERNET") for r in digital
    )
    if enjoy_reading is not None and int(enjoy_reading) <= 2 and not has_educational_digital:
        flags.append("LIMITED_HOME_LITERACY")

    home_langs = family.get("languages_at_home", [])
    if len(home_langs) >= 2:
        flags.append("MULTILINGUAL_HOME")

    daily_digital = family.get("daily_digital_use")
    if daily_digital is not None and int(daily_digital) >= 5:
        flags.append("HIGH_DIGITAL_ENGAGEMENT")

    homework_support = family.get("parent_homework_support", "")
    if homework_support in ("RARELY", "NEVER"):
        flags.append("LIMITED_PARENTAL_SUPPORT")

    external_support = family.get("external_support", [])
    if any(s in ("TUITION", "SPECIAL_EDUCATION") for s in external_support):
        flags.append("EXTERNAL_SUPPORT_IN_PLACE")

    # ── Prenatal flags ────────────────────────────────────────────────────────
    if prenatal.get("full_term_or_premature") == "Premature":
        flags.append("PREMATURE_BIRTH")
    complications = prenatal.get("pregnancy_complications") or prenatal.get("pregnancyComplications") or []
    if complications and any(c not in ("None", "none", "NONE") for c in complications):
        flags.append("COMPLICATED_PREGNANCY")

    # ── Post-natal flags ──────────────────────────────────────────────────────
    try:
        walking_age = int(postnatal.get("age_of_walking") or 0)
        speech_age = int(postnatal.get("age_of_two_word_speech") or 0)
        has_delay = (walking_age > 18) or (speech_age > 24) or postnatal.get("delay_in_neck_standing") is True
        if has_delay:
            flags.append("DEVELOPMENTAL_DELAY")
    except (ValueError, TypeError):
        pass

    # ── Medical flags ─────────────────────────────────────────────────────────
    if any([
        medical.get("epileptic_history"),
        medical.get("on_medication"),
        medical.get("asthma_wheezing"),
        postnatal.get("seizures_infancy"),
        postnatal.get("hospitalization_first_two_years"),
    ]):
        flags.append("MEDICAL_FLAG")

    if any([
        medical.get("wears_glasses"),
        medical.get("vision_test_done") is False,
        medical.get("hearing_test_done") is False,
        postnatal.get("vision_problems_early") is True,
        postnatal.get("hearing_problems_early") is True,
    ]):
        flags.append("VISION_HEARING_FLAG")

    # ── Educational flags ─────────────────────────────────────────────────────
    if educational.get("repeated_grades") or school.get("previous_grade_retention") == "Yes":
        flags.append("GRADE_RETENTION")
    if (educational.get("struggles_in_languages") or
        (educational.get("language_struggles") and any(s not in ("None", "none", "NONE") for s in educational.get("language_struggles")))):
        flags.append("LANGUAGE_STRUGGLE_HISTORY")
    if (educational.get("math_struggles") and any(s not in ("None", "none", "NONE") for s in educational.get("math_struggles"))):
        flags.append("MATH_STRUGGLE_HISTORY")
    
    overall_perf = educational.get("overall_performance") or educational.get("overallPerformance")
    overall_pct = educational.get("overall_percentage") or educational.get("overallPercentage")
    if overall_perf in ("Below Average", "Significantly Below Expected"):
        flags.append("ACADEMIC_PERFORMANCE_CONCERN")
    elif overall_pct is not None:
        try:
            if int(overall_pct) < 50:
                flags.append("ACADEMIC_PERFORMANCE_CONCERN")
        except (ValueError, TypeError):
            pass

    if (educational.get("academic_trend") or educational.get("academicTrend")) == "Declining":
        flags.append("ACADEMIC_DECLINE")

    return flags


# ── CONFIDENCE CALCULATION ────────────────────────────────────────────────────

def _calculate_confidence(tabs_completed: list[str]) -> str:
    tab_weights = {
        "referral": 1,
        "demographics": 1,
        "family": 1,
        "prenatal": 0.75,
        "postnatal": 0.75,
        "medical": 0.75,
        "educational": 0.75,
    }
    score = sum(tab_weights.get(t, 0) for t in tabs_completed)
    total = sum(tab_weights.values())  # ~6.0
    ratio = score / total

    if ratio <= 0.20:
        return "LOW"
    elif ratio <= 0.40:
        return "LOW_MEDIUM"
    elif ratio <= 0.60:
        return "MEDIUM"
    elif ratio <= 0.80:
        return "MEDIUM_HIGH"
    else:
        return "HIGH"

# Public aliases for tests
compute_confidence = _calculate_confidence


# ── MISSING INFORMATION DETECTION ────────────────────────────────────────────

def _detect_missing_info(state: dict) -> list[str]:
    missing = []
    demo = state.get("demographics", {})
    tabs = state.get("tabs_completed", [])

    if "demographics" in tabs:
        if not demo.get("medium_of_instruction"):
            missing.append("Medium of instruction language not provided")
        if demo.get("years_exposed_to_instruction") is None:
            missing.append("Years of exposure to instruction language not provided")
        if not demo.get("school_attendance"):
            missing.append("School attendance history not provided")

    if "referral" not in tabs:
        missing.append("Referral information not yet provided")
    if "family" not in tabs:
        missing.append("Family history not yet provided")
    if "prenatal" not in tabs:
        missing.append("Prenatal and birth history not yet provided")
    else:
        prenatal = state.get("prenatal", {})
        gest_age = prenatal.get("gestational_age") or prenatal.get("gestationalAge")
        birth_wt = prenatal.get("birth_weight") or prenatal.get("birthWeight")
        if not gest_age:
            missing.append("Gestational age not provided")
        if not birth_wt:
            missing.append("Birth weight information unavailable")
    if "postnatal" not in tabs:
        missing.append("Post natal history not yet provided")
    else:
        postnatal = state.get("postnatal", {})
        if not postnatal.get("age_of_walking"):
            missing.append("Age of walking milestone missing")
        if not postnatal.get("age_of_two_word_speech"):
            missing.append("Age of two-word speech milestone missing")

    if "medical" not in tabs:
        missing.append("Medical history not yet provided")
    else:
        med = state.get("medical", {})
        if med.get("on_medication"):
            purpose = med.get("medication_purpose") or []
            if not purpose:
                missing.append("Medication purpose not provided")
        if med.get("vision_test_done") and not med.get("vision_test_result"):
            missing.append("Vision assessment results unavailable")
        if med.get("hearing_test_done") and not med.get("hearing_test_result"):
            missing.append("Hearing assessment status not reported")
            
    if "educational" not in tabs:
        missing.append("Educational history not yet provided")
    else:
        edu = state.get("educational", {})
        if not edu.get("overallPerformance") and not edu.get("overall_performance") and not edu.get("overallPercentage") and not edu.get("overall_percentage"):
            missing.append("Overall academic performance details unavailable")
        if not edu.get("teacherComments") and not edu.get("teacher_comments"):
            missing.append("Teacher comments and observations not provided")
        if not edu.get("previousSupport") and not edu.get("previous_support"):
            missing.append("Previous educational support history not reported")

    return missing


# ── NODE 1: BUILD CUMULATIVE CONTEXT ─────────────────────────────────────────

def build_cumulative_context(state: IntakeIntelligenceState) -> dict:
    """
    Assembles the ChildContextObject from all tab data provided so far.
    Missing fields are explicitly set to None (surfaced in missing_information section).
    No LLM calls — pure data assembly.
    """
    referral = state.get("referral", {})
    demographics = state.get("demographics", {})
    family = state.get("family", {})
    prenatal = state.get("prenatal", {})
    postnatal = state.get("postnatal", {})
    medical = state.get("medical", {})
    educational = state.get("educational", {})
    tabs = state.get("tabs_completed", [])

    age = demographics.get("age")
    chronological_age = demographics.get("chronological_age")
    if not chronological_age:
        try:
            age_f = float(age) if age else None
            chronological_age = f"{age_f:.1f}" if age_f else None
        except (ValueError, TypeError):
            chronological_age = None

    cumulative = {
        "child_context": {
            "age": age,
            "grade": demographics.get("grade"),
            "chronological_age": chronological_age,
            "name": demographics.get("name"),
            "gender": demographics.get("gender"),
            "syllabus": demographics.get("syllabus"),
            "school_center": demographics.get("school_center"),
        },
        "language_context": {
            "mother_tongue": demographics.get("mother_tongue"),
            "instruction_language": demographics.get("medium_of_instruction"),
            "language_match": (
                demographics.get("mother_tongue", "").lower() ==
                demographics.get("medium_of_instruction", "").lower()
                if demographics.get("mother_tongue") and demographics.get("medium_of_instruction")
                else None
            ),
            "years_exposed": demographics.get("years_exposed_to_instruction"),
            "number_of_languages": demographics.get("number_of_languages_understood"),
            "language_spoken_at_home": demographics.get("language_spoken_at_home"),
        },
        "referral_profile": {
            "areas": referral.get("referral_areas", []),
            "source": referral.get("referral_source", []),
            "duration": referral.get("duration_of_concern"),
            "severity": referral.get("severity_of_concern"),
        },
        "school_context": {
            "school_type": demographics.get("school_type"),
            "syllabus": demographics.get("syllabus"),
            "attendance": demographics.get("school_attendance"),
            "city": demographics.get("city"),
            "state": demographics.get("state"),
            "urban_or_rural": demographics.get("urban_or_rural"),
            "previous_grade_retention": demographics.get("previous_grade_retention"),
        },
        "family_context": {
            "family_type": family.get("family_type"),
            "primary_caregiver": family.get("primary_caregiver"),
            "child_lives_with": family.get("child_lives_with", []),
            "number_of_siblings": family.get("number_of_siblings"),
            "birth_order": family.get("birth_order"),
            "family_history_of_difficulties": family.get("family_history_of_difficulties"),
            "family_history_details": family.get("family_history_details"),
            "languages_at_home": family.get("languages_spoken_at_home", []),
            "digital_resources": family.get("digital_resource_types", []),
            "daily_digital_use": family.get("daily_digital_use"),
            "parent_homework_support": family.get("parent_helps_with_homework"),
            "enjoys_school_rating": family.get("enjoy_school_rating"),
            "enjoys_reading_rating": family.get("enjoy_reading_rating"),
            "external_support": family.get("external_support_types", []),
        },
        "prenatal_context": {
            "full_term_or_premature": prenatal.get("full_term_or_premature") or prenatal.get("fullTermOrPremature"),
            "gestational_age": prenatal.get("gestational_age") or prenatal.get("gestationalAge"),
            "nicu_stay": prenatal.get("nicu_stay") or prenatal.get("nicuStay"),
            "birth_weight": prenatal.get("birth_weight") or prenatal.get("birthWeight"),
            "delivery_type": prenatal.get("delivery_type") or prenatal.get("deliveryType"),
            "pregnancy_complications": prenatal.get("pregnancy_complications") or prenatal.get("pregnancyComplications") or [],
            "medications_during_pregnancy": prenatal.get("medications_during_pregnancy") or prenatal.get("medicationsDuringPregnancy"),
            "specify_medication": prenatal.get("specify_medication") or prenatal.get("medicationsDuringPregnancyDetails"),
            "miscarriages_abortions": prenatal.get("miscarriages_abortions") or prenatal.get("miscarriagesAbortions"),
            "jaundice_after_birth": prenatal.get("jaundice_after_birth") or prenatal.get("jaundiceAfterBirth") or prenatal.get("infantJaundice") or prenatal.get("infant_jaundice"),
            "feeding_difficulties": prenatal.get("feeding_difficulties") or prenatal.get("feedingDifficulties"),
            "significant_illness": prenatal.get("significant_illness") or prenatal.get("significantIllness"),
            "significant_illness_details": prenatal.get("significant_illness_details") or prenatal.get("significantIllnessDetails"),
        },
        "postnatal_context": {
            "birth_cry": postnatal.get("birth_cry"),
            "birth_cry_delay_duration": postnatal.get("birth_cry_delay_duration"),
            "resuscitation_required": postnatal.get("resuscitation_required"),
            "age_of_walking": postnatal.get("age_of_walking"),
            "age_of_two_word_speech": postnatal.get("age_of_two_word_speech"),
            "breast_fed": postnatal.get("breast_fed"),
            "breast_fed_duration": postnatal.get("breast_fed_duration"),
            "infant_jaundice": postnatal.get("infant_jaundice"),
            "infant_jaundice_treatment": postnatal.get("infant_jaundice_treatment"),
            "incubation": postnatal.get("incubation"),
            "incubation_days": postnatal.get("incubation_days"),
            "incubation_reason": postnatal.get("incubation_reason"),
            "immunization_done": postnatal.get("immunization_done"),
            "consanguineous_marriage": postnatal.get("consanguineous_marriage"),
            "delay_in_neck_standing": postnatal.get("delay_in_neck_standing"),
            "delay_in_neck_standing_details": postnatal.get("delay_in_neck_standing_details"),
            "seizures_infancy": postnatal.get("seizures_infancy"),
            "seizures_infancy_details": postnatal.get("seizures_infancy_details"),
            "vision_problems_early": postnatal.get("vision_problems_early"),
            "hearing_problems_early": postnatal.get("hearing_problems_early"),
            "hospitalization_first_two_years": postnatal.get("hospitalization_first_two_years"),
            "hospitalization_first_two_years_reason": postnatal.get("hospitalization_first_two_years_reason"),
        },
        "medical_context": {
            "health_concerns": medical.get("health_concerns"),
            "epileptic_history": medical.get("epileptic_history"),
            "epilepsy_type": medical.get("epilepsy_type"),
            "epilepsy_last_episode": medical.get("epilepsy_last_episode"),
            "epilepsy_frequency": medical.get("epilepsy_frequency"),
            "epilepsy_under_medical_care": medical.get("epilepsy_under_medical_care"),
            "on_medication": medical.get("on_medication"),
            "medication_details": medical.get("medication_details"),
            "medication_name": medical.get("medication_name"),
            "medication_dosage": medical.get("medication_dosage"),
            "medication_frequency": medical.get("medication_frequency"),
            "medication_purpose": medical.get("medication_purpose", []),
            "asthma_wheezing": medical.get("asthma_wheezing"),
            "asthma_uses_inhaler": medical.get("asthma_uses_inhaler"),
            "asthma_frequency": medical.get("asthma_frequency"),
            "asthma_emergency_plan": medical.get("asthma_emergency_plan"),
            "wears_glasses": medical.get("wears_glasses"),
            "glasses_usage": medical.get("glasses_usage"),
            "vision_test_done": medical.get("vision_test_done"),
            "vision_test_result": medical.get("vision_test_result"),
            "vision_test_date": medical.get("vision_test_date"),
            "hearing_test_done": medical.get("hearing_test_done"),
            "hearing_test_result": medical.get("hearing_test_result"),
            "hearing_test_date": medical.get("hearing_test_date"),
            "sleep_difficulties": medical.get("sleep_difficulties"),
            "sleep_difficulties_details": medical.get("sleep_difficulties_details", []),
            "hospitalization_history": medical.get("hospitalization_history"),
            "hospitalization_history_reason": medical.get("hospitalization_history_reason"),
            "hospitalization_history_date": medical.get("hospitalization_history_date"),
        },
        "educational_context": {
            "attended_preschool": educational.get("attended_preschool"),
            "age_started_preschool": educational.get("age_started_preschool") or educational.get("ageStartedPreschool"),
            "years_preschool": educational.get("years_preschool") or educational.get("yearsPreschool"),
            "repeated_grades": educational.get("repeated_grades") or (demographics.get("previous_grade_retention") == "Yes"),
            "which_grade_repeated": educational.get("which_grade_repeated") or educational.get("whichGradeRepeated"),
            "reason_for_repeating": educational.get("reason_for_repeating") or educational.get("reasonForRepeating"),
            "dominant_writing_hand": educational.get("dominant_writing_hand") or educational.get("dominantWritingHand"),
            "overall_performance": educational.get("overall_performance") or educational.get("overallPerformance"),
            "overall_percentage": educational.get("overall_percentage") or educational.get("overallPercentage"),
            "subject_performance": educational.get("subject_performance") or educational.get("subjectPerformance"),
            "subject_marks": educational.get("subject_marks") or educational.get("subjectMarks"),
            "academic_trend": educational.get("academic_trend") or educational.get("academicTrend"),
            "teacher_comments": educational.get("teacher_comments") or educational.get("teacherComments"),
            "language_struggles": educational.get("language_struggles") or educational.get("languageStruggles") or [],
            "math_struggles": educational.get("math_struggles") or educational.get("mathStruggles") or [],
            "homework_completion": educational.get("homework_completion") or educational.get("homeworkCompletion"),
            "classroom_participation": educational.get("classroom_participation") or educational.get("classroomParticipation"),
            "learning_strengths": educational.get("learning_strengths") or educational.get("learningStrengths") or [],
            "areas_support": educational.get("areas_support") or educational.get("areasSupport") or [],
            "previous_support": educational.get("previous_support") or educational.get("previousSupport") or [],
            "previous_grade_retention": demographics.get("previous_grade_retention"),
        },
        "tabs_completed": tabs,
        "confidence": _calculate_confidence(tabs),
        "missing_information": _detect_missing_info(state),
    }

    return {"cumulative_context": cumulative}


# ── NODE 2: DETECT CONTEXTUAL FLAGS ──────────────────────────────────────────

def detect_contextual_flags(state: IntakeIntelligenceState) -> dict:
    """
    Rule-based flag detection — zero LLM calls.
    Applies all 19 flags from the flag registry.
    """
    ctx = state.get("cumulative_context", {})
    flags = _detect_flags(ctx)
    return {"contextual_flags": flags}


# ── NODE 3: GENERATE INTAKE PROFILE ──────────────────────────────────────────

def generate_intake_profile_node(state: IntakeIntelligenceState) -> dict:
    """
    Single LLM call producing the 7-section advisory profile.
    Uses cache to avoid redundant API calls when data hasn't changed.
    """
    cumulative = state.get("cumulative_context", {})
    flags = state.get("contextual_flags", [])
    missing = _detect_missing_info(state)
    tabs = state.get("tabs_completed", [])

    # Inject missing_information into the cumulative context before hashing
    # so it's available to the prompt and cache key
    cumulative_with_missing = {**cumulative, "missing_information": missing}

    # Build cache key — 3-argument form required by make_cache_key(agent, target_id, input_data)
    cache_key = make_cache_key(
        "intake",
        "profile",
        {"context": cumulative_with_missing, "flags": sorted(flags)},
    )
    cached = get_cached(cache_key)
    if cached:
        return {"intake_profile": {**cached, "cached": True}}

    # build_intake_profile_prompt(child_context_object, contextual_flags) -> (system, user)
    system_prompt, user_prompt = build_intake_profile_prompt(
        cumulative_with_missing,
        flags,
    )

    llm = _get_llm()
    response = llm.invoke([
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": user_prompt},
    ])
    profile = safe_json(response.content)

    # Inject computed metadata (not from LLM — our rule engine owns these fields)
    profile["confidence"]       = cumulative.get("confidence", "LOW")
    profile["contextual_factors"] = flags
    profile["missing_information"] = missing
    profile["tabs_completed"]   = tabs
    profile["cached"]           = False

    set_cached(cache_key, profile)

    return {
        "intake_profile": profile,
        "prompts": [user_prompt],
    }


# ── GRAPH BUILDER ─────────────────────────────────────────────────────────────

def build_intake_agent():
    graph = StateGraph(IntakeIntelligenceState)

    graph.add_node("build_cumulative_context", build_cumulative_context)
    graph.add_node("detect_contextual_flags", detect_contextual_flags)
    graph.add_node("generate_intake_profile", generate_intake_profile_node)

    graph.set_entry_point("build_cumulative_context")
    graph.add_edge("build_cumulative_context", "detect_contextual_flags")
    graph.add_edge("detect_contextual_flags", "generate_intake_profile")
    graph.add_edge("generate_intake_profile", END)

    return graph.compile()


# Singleton — compiled once, reused across requests (same pattern as assessment_agent.py)
intake_agent = build_intake_agent()


def get_intake_agent():
    """Return the compiled intake agent singleton.
    Matches the import pattern used by the API router:
        from app.agents.intake_agent import get_intake_agent
    """
    return intake_agent
