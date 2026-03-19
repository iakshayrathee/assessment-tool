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
