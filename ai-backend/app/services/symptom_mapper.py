"""
Symptom mapper — converts boolean assessment flags to human-readable descriptions.
Ported from the TypeScript READING_SYMPTOM_MAP, WRITING_SYMPTOM_MAP, MATH_SYMPTOM_MAP.
"""

READING_SYMPTOM_MAP: dict[str, str] = {
    "missesLetters": "Misses letters while reading",
    "missesWords": "Misses whole words",
    "missesSentences": "Misses entire sentences",
    "substitution": "Substitutes words",
    "omissionBeginning": "Omits beginning of words",
    "omissionEnding": "Omits endings of words",
    "omissionWholeWord": "Omits whole words",
    "additionWordsOrSyllables": "Adds extra words or syllables",
    "guessingWords": "Guesses at unfamiliar words",
    "mispronunciation": "Mispronounces words frequently",
    "troubleBlendingSyllables": "Has trouble blending syllables",
    "difficultyDecodingUnfamiliar": "Difficulty decoding unfamiliar words",
    "poorWordRecognition": "Poor word recognition",
    "troubleRememberingSightWords": "Trouble remembering sight words",
    "troubleLearningLetterSound": "Trouble learning letter-sound associations",
    "shortLongVowelConfusion": "Confuses short and long vowel sounds",
    "poorSyllabication": "Poor syllabication skills",
    "poorFlowWhileReading": "Poor flow while reading",
    "choppyReading": "Choppy, halting reading",
    "lotsOfGaps": "Many gaps/pauses while reading",
    "wordByWordReading": "Reads word by word",
    "reReadingSameLine": "Re-reads the same line",
    "repetitionOfWords": "Repeats words while reading",
    "vocalizeDuringSilentReading": "Vocalizes during silent reading",
    "poorIntonations": "Poor intonation and expression",
    "poorPhrasing": "Poor phrasing",
    "slowEffortfulReading": "Slow, effortful reading",
    "movesHeadWhileReading": "Moves head while reading instead of eyes",
    "losesPlaceWhileReading": "Loses place while reading",
    "skipsLines": "Skips lines",
    "poorEyeTracking": "Poor eye tracking",
    "poorScanningSkills": "Poor scanning skills",
    "holdsBookTooClose": "Holds book too close",
    "difficultyLeftRightEyeMovement": "Difficulty with left-right eye movement",
    "difficultyRecognizingSimilarLetters": "Difficulty recognizing similar letters",
    "readsWithoutUnderstanding": "Reads without understanding",
    "forgetsWhatWasRead": "Forgets what was read",
    "difficultyAnsweringQuestions": "Difficulty answering comprehension questions",
    "notInterestedInReading": "Not interested in reading",
    "avoidsReadingAloud": "Avoids reading aloud",
    "avoidsReadingActivities": "Avoids reading activities",
    "yawningFrequently": "Yawns frequently during reading",
    "easilyFrustrated": "Gets easily frustrated while reading",
    "lowConfidence": "Shows low confidence in reading",
    "poorReadingStamina": "Poor reading stamina",
    "punctuationErrors": "Makes punctuation errors while reading",
    "doesNotPauseAtFullStop": "Does not pause at full stops",
    "extraPausesAtCommas": "Extra pauses at commas",
    "incorrectToneForQuestionExclamation": "Incorrect tone for questions/exclamations",
}

WRITING_SYMPTOM_MAP: dict[str, str] = {
    "incorrectPencilGrip": "Incorrect pencil grip",
    "holdsPencilTooTightly": "Holds pencil too tightly",
    "holdsPencilTooLoosely": "Holds pencil too loosely",
    "writesExcessivePressure": "Writes with excessive pressure",
    "writesLightPressure": "Writes with very light pressure",
    "wristFingerPainComplaints": "Complains of wrist/finger pain",
    "slowFineMotorSpeed": "Slow fine motor speed",
    "fatigueAfterShortWriting": "Fatigues after short writing periods",
    "incorrectLetterFormation": "Incorrect letter formation",
    "reversals": "Letter/number reversals",
    "difficultiesFormingCurvesDiagonals": "Difficulty forming curves and diagonals",
    "lettersWrittenMirrorImage": "Writes letters in mirror image",
    "poorStrokeSequence": "Poor stroke sequence",
    "capitalsInsertedBetweenWords": "Inserts capitals between words randomly",
    "difficultyCopyingLetters": "Difficulty copying letters",
    "poorSpacingBetweenLetters": "Poor spacing between letters",
    "poorSpacingBetweenWords": "Poor spacing between words",
    "writesOutsideLine": "Writes outside the line",
    "difficultyMaintainingBaseline": "Difficulty maintaining baseline",
    "unevenLetterSize": "Uneven letter sizes",
    "inconsistentSpacingAcrossPage": "Inconsistent spacing across page",
    "crowdedWriting": "Crowded, cramped writing",
    "tooMuchSpaceBetweenLetters": "Too much space between letters",
    "floatingLettersAboveLine": "Letters float above the line",
    "verySlowWriting": "Very slow writing speed",
    "writesTooFastManyErrors": "Writes too fast with many errors",
    "poorHandwritingEndurance": "Poor handwriting endurance",
    "choppyWriting": "Choppy, disconnected writing",
    "inconsistentPace": "Inconsistent writing pace",
    "repeatedErasing": "Repeated erasing",
    "frequentCorrections": "Frequent corrections",
    "difficultyWritingDictatedLetters": "Difficulty writing dictated letters",
    "difficultyWritingDictatedWords": "Difficulty writing dictated words",
    "spellsPhonetically": "Spells phonetically",
    "omitsLettersInSpelling": "Omits letters in spelling",
    "addsExtraLetters": "Adds extra letters when spelling",
    "substitutesLettersOrSounds": "Substitutes letters or sounds",
    "confusesVowelSounds": "Confuses vowel sounds in spelling",
    "troubleEncodingCVC": "Trouble encoding CVC words",
    "troubleEncodingBlendsDigraphs": "Trouble encoding blends and digraphs",
    "cannotConstructSimpleSentences": "Cannot construct simple sentences",
    "writesOnlySingleWords": "Writes only single words",
    "strugglesExpandSentences": "Struggles to expand sentences",
    "poorGrammarUsage": "Poor grammar usage",
    "writesIncompleteSentences": "Writes incomplete sentences",
    "confusingSentenceOrder": "Confusing sentence order",
    "difficultyExpressingIdeas": "Difficulty expressing ideas in writing",
    "avoidsWrittenTasks": "Avoids written tasks",
    "needsVerbalPromptsToWrite": "Needs verbal prompts to write",
    "difficultyCopyingFromBoard": "Difficulty copying from the board",
    "difficultyCopyingFromBook": "Difficulty copying from a book",
    "slowCopying": "Very slow copying speed",
    "skipsWordsOrLettersWhenCopying": "Skips words or letters when copying",
    "copiesInaccurately": "Copies inaccurately",
    "looksAwayFrequentlyWhileCopying": "Looks away frequently while copying",
    "writingDisorganized": "Writing is disorganized",
    "thoughtsNotLogicallySequenced": "Thoughts not logically sequenced",
    "cannotPlanWriting": "Cannot plan writing",
    "beginsWritingRandomAreasOnPage": "Begins writing in random areas on page",
    "noConceptOfMargins": "No concept of margins",
    "paragraphingDifficulty": "Difficulty with paragraphing",
    "avoidsWritingActivities": "Avoids writing activities",
    "complainsWritingIsHard": "Complains writing is hard",
    "getsFrustratedQuickly": "Gets frustrated quickly with writing",
    "lowWritingStamina": "Low writing stamina",
    "givesUpInMiddleOfTask": "Gives up in the middle of writing tasks",
    "lowConfidenceWriting": "Low confidence in writing",
    "inconsistentPerformanceAcrossDays": "Inconsistent performance across days",
    "visualTrackingDifficulty": "Visual tracking difficulty (board copying)",
    "omissionSkippingFlag": "Omits/skips content while copying",
}

MATH_SYMPTOM_MAP: dict[str, str] = {
    "difficultyIdentifyingNumbers1to10": "Difficulty identifying numbers 1-10",
    "difficultyIdentifyingNumbers1to20": "Difficulty identifying numbers 1-20",
    "difficultyIdentifyingNumbers1to100": "Difficulty identifying numbers 1-100",
    "reversesNumbers": "Reverses numbers when writing",
    "writesNumbersIncorrectly": "Writes numbers incorrectly",
    "difficultySequencingNumbers": "Difficulty sequencing numbers",
    "skipsNumbersWhileCounting": "Skips numbers while counting",
    "countsSlowlyOrWithEffort": "Counts slowly or with effort",
    "troubleWithForwardCounting": "Trouble with forward counting",
    "troubleWithBackwardCounting": "Trouble with backward counting",
    "difficultyWithSkipCounting": "Difficulty with skip counting",
    "doesNotUnderstandQuantity": "Does not understand quantity/value",
    "cannotMatchNumberToQuantity": "Cannot match number to quantity",
    "cannotCompareNumbers": "Cannot compare numbers (greater/less)",
    "difficultyIdentifyingPlaceValue": "Difficulty identifying place value",
    "strugglesSingleDigitAddition": "Struggles with single-digit addition",
    "strugglesSingleDigitSubtraction": "Struggles with single-digit subtraction",
    "cannotCarryOver": "Cannot carry over in addition",
    "cannotBorrow": "Cannot borrow in subtraction",
    "usesFingerCountingExcessively": "Uses finger counting excessively",
    "cannotPerformMentalMath": "Cannot perform mental math",
    "doesNotUnderstandPlusMinusSymbols": "Does not understand +/- symbols",
    "confusesAdditionSubtraction": "Confuses addition and subtraction",
    "difficultyWithWordProblems": "Difficulty with word problems",
    "cannotUnderstandRealWorldMath": "Cannot apply math to real-world situations",
    "difficultyUnderstandingPatterns": "Difficulty understanding patterns",
    "difficultyFinishingPatterns": "Difficulty finishing patterns",
    "troubleIdentifyingShapes": "Trouble identifying shapes",
    "troubleSortingObjects": "Trouble sorting objects",
    "difficultyInMatching": "Difficulty in matching",
    "difficultyWithSpatialConcepts": "Difficulty with spatial concepts",
    "difficultyUnderstandingMeasurement": "Difficulty understanding measurement",
    "difficultyWithTimeConcepts": "Difficulty with time concepts",
    "difficultyReadingClock": "Difficulty reading a clock",
    "verySlowInSolvingProblems": "Very slow in solving problems",
    "frequentCalculationMistakes": "Makes frequent calculation mistakes",
    "poorWorkingMemoryForMath": "Poor working memory for math",
    "troubleRememberingMathFacts": "Trouble remembering math facts",
    "difficultyRememberingSteps": "Difficulty remembering multi-step procedures",
    "needsRepeatedInstructions": "Needs repeated instructions",
    "getsConfusedDuringMultiStep": "Gets confused during multi-step problems",
    "misalignsNumbersInColumns": "Misaligns numbers in columns",
    "writesNumbersOutsideGrid": "Writes numbers outside grid",
    "poorSpatialOrganization": "Poor spatial organization in math work",
    "placesDigitsInWrongOrder": "Places digits in wrong order",
    "drawsShapesIncorrectly": "Draws shapes incorrectly",
    "cannotVisuallyGroupObjects": "Cannot visually group objects",
    "difficultyCopyingMathFromBoard": "Difficulty copying math from board",
    "confusesMathSymbols": "Confuses math symbols",
    "cannotUnderstandEqualsMeansSameAs": "Cannot understand equals means same as",
    "treatsEqualsAsAnswerComesAfter": "Treats equals as answer-comes-after",
    "difficultyRememberingOperationRules": "Difficulty remembering operation rules",
    "cannotDifferentiateTensOnes": "Cannot differentiate tens and ones",
    "misunderstandsMoreLess": "Misunderstands more/less concepts",
    "avoidsMathTasks": "Avoids math tasks",
    "lowMathConfidence": "Low math confidence",
    "givesUpQuickly": "Gives up quickly on math tasks",
    "anxiousDuringMathActivities": "Anxious during math activities",
    "needsConstantPrompting": "Needs constant prompting in math",
    "appearsConfusedAfterExplanation": "Appears confused after explanation",
    "poorAttentionDuringMath": "Poor attention during math",
}

# Symptom categories for grouping
READING_CATEGORIES = {
    "Decoding & Word Reading": [
        "missesLetters", "missesWords", "missesSentences", "substitution",
        "omissionBeginning", "omissionEnding", "omissionWholeWord",
        "additionWordsOrSyllables", "guessingWords", "mispronunciation",
        "troubleBlendingSyllables", "difficultyDecodingUnfamiliar",
        "poorWordRecognition", "troubleRememberingSightWords",
        "troubleLearningLetterSound", "shortLongVowelConfusion", "poorSyllabication",
    ],
    "Fluency & Reading Flow": [
        "poorFlowWhileReading", "choppyReading", "lotsOfGaps",
        "wordByWordReading", "reReadingSameLine", "repetitionOfWords",
        "vocalizeDuringSilentReading", "poorIntonations", "poorPhrasing",
        "slowEffortfulReading",
    ],
    "Eye Tracking & Visual": [
        "movesHeadWhileReading", "losesPlaceWhileReading", "skipsLines",
        "poorEyeTracking", "poorScanningSkills", "holdsBookTooClose",
        "difficultyLeftRightEyeMovement", "difficultyRecognizingSimilarLetters",
    ],
    "Comprehension": [
        "readsWithoutUnderstanding", "forgetsWhatWasRead", "difficultyAnsweringQuestions",
    ],
    "Attention & Reading Behavior": [
        "notInterestedInReading", "avoidsReadingAloud", "avoidsReadingActivities",
        "yawningFrequently", "easilyFrustrated", "lowConfidence", "poorReadingStamina",
    ],
    "Mechanics & Punctuation": [
        "punctuationErrors", "doesNotPauseAtFullStop", "extraPausesAtCommas",
        "incorrectToneForQuestionExclamation",
    ],
}

WRITING_CATEGORIES = {
    "Fine Motor & Grip": [
        "incorrectPencilGrip", "holdsPencilTooTightly", "holdsPencilTooLoosely",
        "writesExcessivePressure", "writesLightPressure", "wristFingerPainComplaints",
        "slowFineMotorSpeed", "fatigueAfterShortWriting",
    ],
    "Letter Formation": [
        "incorrectLetterFormation", "reversals", "difficultiesFormingCurvesDiagonals",
        "lettersWrittenMirrorImage", "poorStrokeSequence", "capitalsInsertedBetweenWords",
        "difficultyCopyingLetters",
    ],
    "Spacing & Alignment": [
        "poorSpacingBetweenLetters", "poorSpacingBetweenWords", "writesOutsideLine",
        "difficultyMaintainingBaseline", "unevenLetterSize",
        "inconsistentSpacingAcrossPage", "crowdedWriting",
        "tooMuchSpaceBetweenLetters", "floatingLettersAboveLine",
    ],
    "Handwriting Fluency": [
        "verySlowWriting", "writesTooFastManyErrors", "poorHandwritingEndurance",
        "choppyWriting", "inconsistentPace", "repeatedErasing", "frequentCorrections",
    ],
    "Dictation & Spelling": [
        "difficultyWritingDictatedLetters", "difficultyWritingDictatedWords",
        "spellsPhonetically", "omitsLettersInSpelling", "addsExtraLetters",
        "substitutesLettersOrSounds", "confusesVowelSounds",
        "troubleEncodingCVC", "troubleEncodingBlendsDigraphs",
    ],
    "Sentence Formation": [
        "cannotConstructSimpleSentences", "writesOnlySingleWords",
        "strugglesExpandSentences", "poorGrammarUsage", "writesIncompleteSentences",
        "confusingSentenceOrder", "difficultyExpressingIdeas",
        "avoidsWrittenTasks", "needsVerbalPromptsToWrite",
    ],
    "Copying Skills": [
        "difficultyCopyingFromBoard", "difficultyCopyingFromBook", "slowCopying",
        "skipsWordsOrLettersWhenCopying", "copiesInaccurately",
        "looksAwayFrequentlyWhileCopying",
    ],
}

MATH_CATEGORIES = {
    "Number Sense & Identification": [
        "difficultyIdentifyingNumbers1to10", "difficultyIdentifyingNumbers1to20",
        "difficultyIdentifyingNumbers1to100", "reversesNumbers",
        "writesNumbersIncorrectly", "difficultySequencingNumbers",
        "skipsNumbersWhileCounting", "countsSlowlyOrWithEffort",
        "troubleWithForwardCounting", "troubleWithBackwardCounting",
        "difficultyWithSkipCounting", "doesNotUnderstandQuantity",
        "cannotMatchNumberToQuantity", "cannotCompareNumbers",
        "difficultyIdentifyingPlaceValue",
    ],
    "Basic Operations": [
        "strugglesSingleDigitAddition", "strugglesSingleDigitSubtraction",
        "cannotCarryOver", "cannotBorrow", "usesFingerCountingExcessively",
        "cannotPerformMentalMath", "doesNotUnderstandPlusMinusSymbols",
        "confusesAdditionSubtraction", "difficultyWithWordProblems",
        "cannotUnderstandRealWorldMath",
    ],
    "Concepts & Pre-Math": [
        "difficultyUnderstandingPatterns", "difficultyFinishingPatterns",
        "troubleIdentifyingShapes", "troubleSortingObjects",
        "difficultyInMatching", "difficultyWithSpatialConcepts",
        "difficultyUnderstandingMeasurement", "difficultyWithTimeConcepts",
        "difficultyReadingClock",
    ],
    "Math Fluency & Memory": [
        "verySlowInSolvingProblems", "frequentCalculationMistakes",
        "poorWorkingMemoryForMath", "troubleRememberingMathFacts",
        "difficultyRememberingSteps", "needsRepeatedInstructions",
        "getsConfusedDuringMultiStep",
    ],
    "Visual-Spatial & Alignment": [
        "misalignsNumbersInColumns", "writesNumbersOutsideGrid",
        "poorSpatialOrganization", "placesDigitsInWrongOrder",
        "drawsShapesIncorrectly", "cannotVisuallyGroupObjects",
        "difficultyCopyingMathFromBoard",
    ],
}


def get_active_symptoms(assessment: dict, symptom_map: dict[str, str]) -> list[str]:
    """Extract active symptoms (boolean True) from an assessment dict."""
    return [
        description
        for field, description in symptom_map.items()
        if assessment.get(field) is True
    ]


def get_categorized_symptoms(
    assessment: dict,
    symptom_map: dict[str, str],
    categories: dict[str, list[str]],
) -> dict[str, list[str]]:
    """Extract symptoms grouped by category."""
    result: dict[str, list[str]] = {}
    for category, fields in categories.items():
        active = [
            symptom_map[f]
            for f in fields
            if assessment.get(f) is True and f in symptom_map
        ]
        if active:
            result[category] = active
    return result


def count_symptoms(assessment: dict | None) -> int:
    """Count boolean True fields in an assessment (symptom count)."""
    if not assessment:
        return 0
    return sum(1 for v in assessment.values() if v is True)


def calculate_severity_score(symptom_count: int, total_possible: int) -> float:
    """Calculate severity as a 0-100 score."""
    if total_possible == 0:
        return 0.0
    return round((symptom_count / total_possible) * 100, 1)


# ── New structured reading assessment helpers ─────────────────────────────────

def is_new_reading_format(assessment: dict) -> bool:
    """Detect if assessment uses the new 14-section structured format."""
    return assessment.get("overallReadingScore") is not None or \
           assessment.get("wordsPerMinute") is not None or \
           assessment.get("comprehension") is not None


def extract_reading_structured_analysis(assessment: dict) -> dict[str, list[str]]:
    """Extract categorised observations from the new structured reading assessment.

    Returns a dict keyed by category, each value a list of human-readable findings.
    Used by the assessment agent in place of boolean symptom extraction.
    """
    cats: dict[str, list[str]] = {}

    # ── Behavior observations ────────────────────────────────────────────────
    behavior: list[str] = []
    for field, label in [
        ("interestInReading", "Interest in reading"),
        ("readingStamina", "Reading stamina"),
        ("frustrationTolerance", "Frustration tolerance"),
        ("confidenceLevel", "Confidence level"),
    ]:
        val = assessment.get(field)
        if val is not None:
            level = "low" if val <= 2 else ("moderate" if val <= 3 else "adequate")
            behavior.append(f"{label}: {val}/5 ({level})")
    if assessment.get("attentionSpanMinutes"):
        behavior.append(f"Attention span: {assessment['attentionSpanMinutes']} minutes")
    for field, label in [
        ("emotionalResponse", "Emotional response"),
        ("motivation", "Motivation"),
        ("selfCorrectionAbility", "Self-correction"),
        ("promptDependency", "Prompt dependency"),
    ]:
        if assessment.get(field):
            behavior.append(f"{label}: {assessment[field]}")
    if assessment.get("taskAvoidance"):
        behavior.append("Task avoidance: Yes")
    if behavior:
        cats["Reading Behavior & Affect"] = behavior

    # ── Decoding & Phonological Awareness ────────────────────────────────────
    decoding: list[str] = []
    core_skills = assessment.get("coreSkills") or {}
    phono = core_skills.get("phonologicalAwareness") or {}
    for field, label in [
        ("blending", "Blending"), ("segmenting", "Segmenting"),
        ("soundIdentification", "Sound identification"),
    ]:
        val = phono.get(field)
        if val is not None:
            decoding.append(f"Phonological — {label}: {val}/5")
    if phono.get("rhyming") is not None:
        decoding.append(f"Rhyming: {'Yes' if phono['rhyming'] else 'No'}")
    dec = core_skills.get("decoding") or {}
    for field, label in [
        ("letterSoundKnowledge", "Letter-sound knowledge"),
        ("cvcWords", "CVC words"),
        ("blendsDigraphs", "Blends/digraphs"),
        ("multisyllabicDecoding", "Multisyllabic decoding"),
    ]:
        val = dec.get(field)
        if val is not None:
            decoding.append(f"Decoding — {label}: {val}/5")
    if decoding:
        cats["Decoding & Phonological Awareness"] = decoding

    # ── Fluency ──────────────────────────────────────────────────────────────
    fluency: list[str] = []
    if assessment.get("wordsPerMinute") is not None:
        fluency.append(f"WPM: {assessment['wordsPerMinute']}")
    if assessment.get("fluencyAccuracy") is not None:
        fluency.append(f"Accuracy: {assessment['fluencyAccuracy']}%")
    fluency_data = core_skills.get("fluency") or {}
    if fluency_data.get("errorRate") is not None:
        fluency.append(f"Error rate: {fluency_data['errorRate']}")
    if fluency_data.get("hesitations") is not None:
        fluency.append(f"Hesitations: {fluency_data['hesitations']}")
    if assessment.get("sightWordsPercent") is not None:
        fluency.append(f"Sight words: {assessment['sightWordsPercent']}%")
    if assessment.get("readingExpression"):
        fluency.append(f"Expression: {assessment['readingExpression']}")
    if assessment.get("pausingCorrectness"):
        fluency.append(f"Pausing: {assessment['pausingCorrectness']}")
    if fluency:
        cats["Fluency & Oral Reading"] = fluency

    # ── Visual Tracking ──────────────────────────────────────────────────────
    tracking: list[str] = []
    vt = core_skills.get("visualTracking") or {}
    for field, label in [
        ("skipsLines", "Skips lines"), ("usesFinger", "Uses finger"),
        ("losesPlace", "Loses place"),
    ]:
        if vt.get(field):
            tracking.append(label)
    if tracking:
        cats["Visual Tracking Issues"] = tracking

    # ── Comprehension ────────────────────────────────────────────────────────
    comp: list[str] = []
    comprehension = assessment.get("comprehension") or {}
    for section, items in [
        ("literal", [("recallFacts", "Recall facts"), ("identifyCharacters", "Identify characters/events")]),
        ("inferential", [("prediction", "Prediction ability"), ("meaningInference", "Meaning inference")]),
        ("critical", [("opinionFormation", "Opinion formation"), ("realLifeConnection", "Real-life connection")]),
    ]:
        sub = comprehension.get(section) or {}
        for field, label in items:
            val = sub.get(field)
            if val is not None:
                comp.append(f"{label}: {val}/5")
    retelling = comprehension.get("retelling") or {}
    if retelling.get("sequencing"):
        comp.append(f"Sequencing: {retelling['sequencing']}")
    if retelling.get("completeness") is not None:
        comp.append(f"Retelling completeness: {retelling['completeness']}/5")
    if comp:
        cats["Comprehension"] = comp

    # ── Error Patterns ───────────────────────────────────────────────────────
    errors: list[str] = []
    error_data = assessment.get("errorAnalysis") or {}
    error_types = error_data.get("types") or {}
    for etype, info in error_types.items():
        if isinstance(info, dict) and info.get("present"):
            freq = info.get("frequency", "")
            errors.append(f"{etype}" + (f" ({freq}%)" if freq else ""))
        elif info is True:
            errors.append(etype)
    if error_data.get("dominantErrorType"):
        errors.append(f"Dominant error: {error_data['dominantErrorType']}")
    if error_data.get("errorFrequencyPercent") is not None:
        errors.append(f"Overall error frequency: {error_data['errorFrequencyPercent']}%")
    if errors:
        cats["Error Patterns"] = errors

    # ── Red Flags ────────────────────────────────────────────────────────────
    flags: list[str] = []
    red = assessment.get("redFlags") or {}
    if red.get("attentionIssues"):
        flags.append("Attention issues")
    if red.get("languageProcessingIssues"):
        flags.append("Language processing issues")
    if red.get("avoidanceBehavior"):
        flags.append("Avoidance behavior")
    for custom in (red.get("custom") or []):
        flags.append(custom)
    if flags:
        cats["Red Flags"] = flags

    # ── Computed Scores (backend-generated) ──────────────────────────────────
    scores: list[str] = []
    for field, label in [
        ("decodingScore", "Decoding composite"),
        ("fluencyScore", "Fluency composite"),
        ("comprehensionScore", "Comprehension composite"),
        ("behaviorScore", "Behavior composite"),
        ("overallReadingScore", "Overall reading score"),
    ]:
        val = assessment.get(field)
        if val is not None:
            scores.append(f"{label}: {val}/100")
    if assessment.get("readingLevel"):
        scores.append(f"Reading level: {assessment['readingLevel']}")
    if assessment.get("tier"):
        scores.append(f"Tier: {assessment['tier']}")
    if assessment.get("ldRiskFlag"):
        scores.append(f"LD risk: {assessment.get('ldRiskDetails', 'Yes')}")
    if scores:
        cats["Computed Scores & Classification"] = scores

    # ── Strengths ────────────────────────────────────────────────────────────
    strengths: list[str] = []
    s_data = assessment.get("strengths") or {}
    for s in (s_data.get("selected") or []):
        strengths.append(s)
    if s_data.get("educatorNotes"):
        strengths.append(f"Educator notes: {s_data['educatorNotes']}")
    if strengths:
        cats["Identified Strengths"] = strengths

    # ── Challenges ───────────────────────────────────────────────────────────
    challenges: list[str] = []
    if assessment.get("primaryChallenge"):
        challenges.append(f"Primary: {assessment['primaryChallenge']}")
    if assessment.get("secondaryChallenge"):
        challenges.append(f"Secondary: {assessment['secondaryChallenge']}")
    if assessment.get("challengeSeverity"):
        challenges.append(f"Severity: {assessment['challengeSeverity']}")
    if challenges:
        cats["Identified Challenges"] = challenges

    return cats


def format_reading_structured_summary(assessment: dict) -> str:
    """Format new structured reading assessment into a concise text summary for LLM prompts."""
    lines: list[str] = []

    # Context
    if assessment.get("mediumOfInstruction"):
        lines.append(f"Medium: {assessment['mediumOfInstruction']}")
    if assessment.get("firstLanguage"):
        lines.append(f"First language: {assessment['firstLanguage']}")
    if assessment.get("readingExposureAtHome"):
        lines.append(f"Home reading exposure: {assessment['readingExposureAtHome']}")
    if assessment.get("languageMismatch"):
        lines.append("Language mismatch between home and school: Yes")
    if assessment.get("parentConcern"):
        lines.append(f"Parent concern: {assessment['parentConcern']}")

    # Resources / accuracy
    resources = assessment.get("readingResources") or {}
    known = resources.get("knownText") or {}
    unknown = resources.get("unknownText") or {}
    if known.get("accuracyPercent") is not None:
        lines.append(f"Known text accuracy: {known['accuracyPercent']}%")
    if unknown.get("accuracyPercent") is not None:
        lines.append(f"Unknown text accuracy: {unknown['accuracyPercent']}%")

    # Key metrics
    if assessment.get("wordsPerMinute") is not None:
        lines.append(f"WPM: {assessment['wordsPerMinute']}")
    if assessment.get("fluencyAccuracy") is not None:
        lines.append(f"Fluency accuracy: {assessment['fluencyAccuracy']}%")
    if assessment.get("sightWordsPercent") is not None:
        lines.append(f"Sight words: {assessment['sightWordsPercent']}%")

    # Computed scores
    for field, label in [
        ("decodingScore", "Decoding"), ("fluencyScore", "Fluency"),
        ("comprehensionScore", "Comprehension"), ("behaviorScore", "Behavior"),
        ("overallReadingScore", "Overall"),
    ]:
        val = assessment.get(field)
        if val is not None:
            lines.append(f"{label} score: {val}/100")

    if assessment.get("readingLevel"):
        lines.append(f"Reading level: {assessment['readingLevel']}")
    if assessment.get("tier"):
        lines.append(f"Tier: {assessment['tier']}")
    if assessment.get("ldRiskFlag"):
        lines.append(f"LD risk detected: {assessment.get('ldRiskDetails', 'Yes')}")

    # Grade gap
    if assessment.get("gradeGap") is not None:
        lines.append(f"Grade gap: {assessment['gradeGap']} years")

    return "\n".join(lines) if lines else "No structured data available"
