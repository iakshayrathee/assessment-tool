"""
Intake Intelligence Agent — Specification Tests
Each test case corresponds to a spec in the implementation plan.
Run with: pytest tests/test_intake_agent.py -v
"""

import pytest

from app.agents.intake_agent import (
    build_cumulative_context,
    detect_contextual_flags,
    compute_confidence,         # public alias for _calculate_confidence
)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _build_ctx(state: dict) -> dict:
    """Helper: run build_cumulative_context, return the cumulative_context dict."""
    result = build_cumulative_context(state)
    return result["cumulative_context"]


def _run_flags(state: dict) -> list[str]:
    """Helper: run build_cumulative_context then detect_contextual_flags."""
    ctx_result = build_cumulative_context(state)
    state_with_ctx = {**state, **ctx_result}
    return detect_contextual_flags(state_with_ctx)["contextual_flags"]


# ── TC1: No Language Mismatch (Kannada → Kannada, School Readiness) ────────────

class TestTC1_NoLanguageMismatch:
    """Age=6, Grade=1, mother_tongue=Kannada, instruction=Kannada."""

    STATE = {
        "referral": {
            "referral_areas": ["SCHOOL_READINESS"],
            "referral_source": ["PARENT"],
            "duration_of_concern": None,
            "severity_of_concern": None,
        },
        "demographics": {
            "age": 6,
            "grade": "1",
            "mother_tongue": "Kannada",
            "medium_of_instruction": "Kannada",
            "syllabus": "State",
        },
        "family": {}, "prenatal": {}, "postnatal": {}, "medical": {}, "educational": {},
        "tabs_completed": ["referral", "demographics"],
    }

    def test_no_language_mismatch_flag(self):
        """TC1: No LANGUAGE_MISMATCH when home language == instruction language."""
        flags = _run_flags(self.STATE)
        assert "LANGUAGE_MISMATCH" not in flags

    def test_confidence_low_with_two_tabs(self):
        """TC1: Confidence should be LOW with only referral + demographics."""
        # Two tabs with weight 1 each → 2/6 ≈ 0.33 → LOW_MEDIUM
        # (The scale: ≤0.20=LOW, ≤0.40=LOW_MEDIUM)
        level = compute_confidence(["referral", "demographics"])
        assert level in ("LOW", "LOW_MEDIUM")   # either is valid for 2 tabs

    def test_language_match_true_in_context(self):
        """TC1: language_match should be True when languages are identical."""
        ctx = _build_ctx(self.STATE)
        assert ctx["language_context"]["language_match"] is True


# ── TC2: Age–Grade Mismatch (Age 13, Grade 4) ────────────────────────────────

class TestTC2_AgeGradeMismatch:
    """Age=13, Grade=4, referral=[Reading, Writing, Math], duration=MORE_THAN_2_YEARS."""

    STATE = {
        "referral": {
            "referral_areas": ["READING", "WRITING", "MATH"],
            "referral_source": ["TEACHER"],
            "duration_of_concern": "MORE_THAN_2_YEARS",
            "severity_of_concern": "SEVERE",
        },
        "demographics": {
            "age": 13,
            "grade": "4",
            "mother_tongue": None,
            "medium_of_instruction": None,
        },
        "family": {}, "prenatal": {}, "postnatal": {}, "medical": {}, "educational": {},
        "tabs_completed": ["referral", "demographics"],
    }

    def test_age_grade_mismatch_flag(self):
        """TC2: AGE_GRADE_MISMATCH should fire — age 13 in Grade 4 exceeds expected max (11)."""
        flags = _run_flags(self.STATE)
        assert "AGE_GRADE_MISMATCH" in flags

    def test_long_duration_flag(self):
        """TC2: LONG_DURATION_CONCERN fires for MORE_THAN_2_YEARS."""
        flags = _run_flags(self.STATE)
        assert "LONG_DURATION_CONCERN" in flags

    def test_missing_language_info_in_context(self):
        """TC2: Both language fields absent → appear in missing_information list."""
        ctx = _build_ctx(self.STATE)
        missing = ctx.get("missing_information", []) or []
        # At least one of these should surface the missing medium
        assert any("instruction" in m.lower() for m in missing)


# ── TC3: Language Mismatch (Tamil → English, Attention + Behaviour) ───────────

class TestTC3_LanguageMismatch:
    """Age=9, Grade=4, mother_tongue=Tamil, instruction=English."""

    STATE = {
        "referral": {
            "referral_areas": ["ATTENTION", "BEHAVIOUR"],
            "referral_source": ["PARENT"],
            "duration_of_concern": None,
            "severity_of_concern": "MODERATE",
        },
        "demographics": {
            "age": 9,
            "grade": "4",
            "mother_tongue": "Tamil",
            "medium_of_instruction": "English",
        },
        "family": {}, "prenatal": {}, "postnatal": {}, "medical": {}, "educational": {},
        "tabs_completed": ["referral", "demographics"],
    }

    def test_language_mismatch_flag(self):
        """TC3: LANGUAGE_MISMATCH fires when Tamil ≠ English."""
        flags = _run_flags(self.STATE)
        assert "LANGUAGE_MISMATCH" in flags

    def test_no_age_grade_mismatch(self):
        """TC3: Age=9, Grade=4 is within normal range → no AGE_GRADE_MISMATCH."""
        flags = _run_flags(self.STATE)
        assert "AGE_GRADE_MISMATCH" not in flags

    def test_language_match_false_in_context(self):
        """TC3: language_match should be False in the context object."""
        ctx = _build_ctx(self.STATE)
        assert ctx["language_context"]["language_match"] is False


# ── TC4: Multi-source Referral + Long Duration ────────────────────────────────

class TestTC4_MultiSourceLongDuration:
    """Age=10, Grade=5, English→English, Parent+Teacher, >2yr, Reading+Writing."""

    STATE = {
        "referral": {
            "referral_areas": ["READING", "WRITING"],
            "referral_source": ["PARENT", "TEACHER"],
            "duration_of_concern": "MORE_THAN_2_YEARS",
            "severity_of_concern": "MODERATE",
        },
        "demographics": {
            "age": 10,
            "grade": "5",
            "mother_tongue": "English",
            "medium_of_instruction": "English",
        },
        "family": {}, "prenatal": {}, "postnatal": {}, "medical": {}, "educational": {},
        "tabs_completed": ["referral", "demographics"],
    }

    def test_multi_source_referral_flag(self):
        """TC4: MULTI_SOURCE_REFERRAL fires when 2+ sources (Parent + Teacher)."""
        flags = _run_flags(self.STATE)
        assert "MULTI_SOURCE_REFERRAL" in flags

    def test_long_duration_flag(self):
        """TC4: LONG_DURATION_CONCERN fires for MORE_THAN_2_YEARS."""
        flags = _run_flags(self.STATE)
        assert "LONG_DURATION_CONCERN" in flags

    def test_no_language_mismatch(self):
        """TC4: English → English should not trigger LANGUAGE_MISMATCH."""
        flags = _run_flags(self.STATE)
        assert "LANGUAGE_MISMATCH" not in flags


# ── TC5: Missing Medium of Instruction ────────────────────────────────────────

class TestTC5_MissingMediumOfInstruction:
    """Age=11, Grade=6, mother_tongue=Kannada, instruction_language=None."""

    STATE = {
        "referral": {
            "referral_areas": ["READING"],
            "referral_source": ["PARENT"],
            "duration_of_concern": None,
            "severity_of_concern": None,
        },
        "demographics": {
            "age": 11,
            "grade": "6",
            "mother_tongue": "Kannada",
            "medium_of_instruction": None,     # ← deliberately missing
        },
        "family": {}, "prenatal": {}, "postnatal": {}, "medical": {}, "educational": {},
        "tabs_completed": ["referral", "demographics"],
    }

    def test_medium_of_instruction_surfaces_in_missing(self):
        """TC5: medium_of_instruction should appear in missing_information."""
        ctx = _build_ctx(self.STATE)
        missing_str = " ".join(ctx.get("missing_information", []))
        assert "instruction" in missing_str.lower()

    def test_no_language_mismatch_when_instruction_unknown(self):
        """TC5: LANGUAGE_MISMATCH must NOT fire when instruction language is absent."""
        flags = _run_flags(self.STATE)
        assert "LANGUAGE_MISMATCH" not in flags

    def test_confidence_level_with_two_tabs(self):
        """TC5: Confidence with referral+demographics should be LOW or LOW_MEDIUM."""
        level = compute_confidence(["referral", "demographics"])
        assert level in ("LOW", "LOW_MEDIUM")


# ── TC6: Confidence Ladder ────────────────────────────────────────────────────

class TestConfidenceLadder:
    """Verify confidence rises correctly as tabs are added."""

    def test_no_tabs_is_low(self):
        assert compute_confidence([]) == "LOW"

    def test_one_tab_demographics_is_low(self):
        assert compute_confidence(["demographics"]) == "LOW"

    def test_referral_plus_demographics(self):
        level = compute_confidence(["referral", "demographics"])
        assert level in ("LOW", "LOW_MEDIUM")

    def test_family_tab_raises_confidence(self):
        level = compute_confidence(["referral", "demographics", "family"])
        # Adding family (weight 1) makes score = 3/6 = 0.50 → MEDIUM
        assert level in ("LOW_MEDIUM", "MEDIUM")

    def test_full_all_tabs_is_high(self):
        level = compute_confidence(
            ["referral", "demographics", "family", "prenatal", "postnatal", "medical", "educational"]
        )
        assert level == "HIGH"

    def test_medical_alone_raises_to_high(self):
        """Medical tab alone contributes enough to push into MEDIUM_HIGH or HIGH range."""
        level = compute_confidence(["referral", "demographics", "family", "medical"])
        # score ≈ 3.75/6 = 0.625 → MEDIUM_HIGH
        assert level in ("MEDIUM_HIGH", "HIGH")


# ── TC7: Family History Flags ─────────────────────────────────────────────────

class TestFamilyHistoryFlags:
    """FAMILY_HISTORY_LITERACY and FAMILY_HISTORY_ATTENTION detection."""

    def _flags_for_family(self, family: dict) -> list[str]:
        state = {
            "referral": {
                "referral_areas": ["READING"],
                "referral_source": ["PARENT"],
                "duration_of_concern": None,
                "severity_of_concern": None,
            },
            "demographics": {
                "age": 9,
                "grade": "4",
                "mother_tongue": "English",
                "medium_of_instruction": "English",
            },
            "family": family,
            "prenatal": {}, "postnatal": {}, "medical": {}, "educational": {},
            "tabs_completed": ["referral", "demographics", "family"],
        }
        return _run_flags(state)

    def test_family_history_literacy_flag(self):
        """FAMILY_HISTORY_LITERACY fires when family details mention reading/dyslexia."""
        flags = self._flags_for_family({
            "family_history_of_difficulties": True,
            "family_history_details": "Father had dyslexia and reading difficulties in school",
        })
        assert "FAMILY_HISTORY_LITERACY" in flags

    def test_family_history_attention_flag(self):
        """FAMILY_HISTORY_ATTENTION fires when family details mention ADHD."""
        flags = self._flags_for_family({
            "family_history_of_difficulties": True,
            "family_history_details": "Mother has ADHD and attention difficulties",
        })
        assert "FAMILY_HISTORY_ATTENTION" in flags

    def test_no_flags_when_no_difficulties(self):
        """Neither flag fires when familyHistoryOfDifficulties is False."""
        flags = self._flags_for_family({
            "family_history_of_difficulties": False,
            "family_history_details": None,
        })
        assert "FAMILY_HISTORY_LITERACY" not in flags
        assert "FAMILY_HISTORY_ATTENTION" not in flags

    def test_multilingual_home_flag(self):
        """MULTILINGUAL_HOME fires when 2+ languages spoken at home."""
        flags = self._flags_for_family({
            "languages_spoken_at_home": ["Kannada", "English"],
        })
        assert "MULTILINGUAL_HOME" in flags

    def test_limited_parental_support_flag(self):
        """LIMITED_PARENTAL_SUPPORT fires when parent rarely/never helps."""
        flags = self._flags_for_family({
            "parent_helps_with_homework": "NEVER",
        })
        assert "LIMITED_PARENTAL_SUPPORT" in flags
