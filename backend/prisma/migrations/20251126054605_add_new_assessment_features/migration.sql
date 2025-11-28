-- CreateEnum
CREATE TYPE "SkillArea" AS ENUM ('READING', 'WRITING', 'MATH');

-- CreateEnum
CREATE TYPE "MotivationLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "HomeworkStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'REVIEWED', 'COMPLETED');

-- CreateTable
CREATE TABLE "formal_assessments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "specialEducatorId" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL,
    "referralReason" TEXT,
    "referralDate" TIMESTAMP(3) NOT NULL,
    "referredBy" TEXT NOT NULL,
    "conductedBy" TEXT,
    "credentials" TEXT,
    "clinicName" TEXT,
    "assessmentDate" TIMESTAMP(3),
    "keyFindings" TEXT,
    "diagnosis" TEXT,
    "recommendations" TEXT,
    "uploadedFiles" TEXT[],
    "status" "AssessmentStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formal_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_skill_assessments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "specialEducatorId" TEXT NOT NULL,
    "missesLetters" BOOLEAN NOT NULL DEFAULT false,
    "missesWords" BOOLEAN NOT NULL DEFAULT false,
    "missesSentences" BOOLEAN NOT NULL DEFAULT false,
    "substitution" BOOLEAN NOT NULL DEFAULT false,
    "omissionBeginning" BOOLEAN NOT NULL DEFAULT false,
    "omissionEnding" BOOLEAN NOT NULL DEFAULT false,
    "omissionWholeWord" BOOLEAN NOT NULL DEFAULT false,
    "additionWordsOrSyllables" BOOLEAN NOT NULL DEFAULT false,
    "guessingWords" BOOLEAN NOT NULL DEFAULT false,
    "mispronunciation" BOOLEAN NOT NULL DEFAULT false,
    "troubleBlendingSyllables" BOOLEAN NOT NULL DEFAULT false,
    "difficultyDecodingUnfamiliar" BOOLEAN NOT NULL DEFAULT false,
    "poorWordRecognition" BOOLEAN NOT NULL DEFAULT false,
    "troubleRememberingSightWords" BOOLEAN NOT NULL DEFAULT false,
    "troubleLearningLetterSound" BOOLEAN NOT NULL DEFAULT false,
    "shortLongVowelConfusion" BOOLEAN NOT NULL DEFAULT false,
    "poorSyllabication" BOOLEAN NOT NULL DEFAULT false,
    "poorFlowWhileReading" BOOLEAN NOT NULL DEFAULT false,
    "choppyReading" BOOLEAN NOT NULL DEFAULT false,
    "lotsOfGaps" BOOLEAN NOT NULL DEFAULT false,
    "wordByWordReading" BOOLEAN NOT NULL DEFAULT false,
    "reReadingSameLine" BOOLEAN NOT NULL DEFAULT false,
    "repetitionOfWords" BOOLEAN NOT NULL DEFAULT false,
    "vocalizeDuringSilentReading" BOOLEAN NOT NULL DEFAULT false,
    "poorIntonations" BOOLEAN NOT NULL DEFAULT false,
    "poorPhrasing" BOOLEAN NOT NULL DEFAULT false,
    "slowEffortfulReading" BOOLEAN NOT NULL DEFAULT false,
    "movesHeadWhileReading" BOOLEAN NOT NULL DEFAULT false,
    "losesPlaceWhileReading" BOOLEAN NOT NULL DEFAULT false,
    "skipsLines" BOOLEAN NOT NULL DEFAULT false,
    "poorEyeTracking" BOOLEAN NOT NULL DEFAULT false,
    "poorScanningSkills" BOOLEAN NOT NULL DEFAULT false,
    "holdsBookTooClose" BOOLEAN NOT NULL DEFAULT false,
    "difficultyLeftRightEyeMovement" BOOLEAN NOT NULL DEFAULT false,
    "difficultyRecognizingSimilarLetters" BOOLEAN NOT NULL DEFAULT false,
    "readsWithoutUnderstanding" BOOLEAN NOT NULL DEFAULT false,
    "forgetsWhatWasRead" BOOLEAN NOT NULL DEFAULT false,
    "difficultyAnsweringQuestions" BOOLEAN NOT NULL DEFAULT false,
    "notInterestedInReading" BOOLEAN NOT NULL DEFAULT false,
    "avoidsReadingAloud" BOOLEAN NOT NULL DEFAULT false,
    "avoidsReadingActivities" BOOLEAN NOT NULL DEFAULT false,
    "yawningFrequently" BOOLEAN NOT NULL DEFAULT false,
    "easilyFrustrated" BOOLEAN NOT NULL DEFAULT false,
    "lowConfidence" BOOLEAN NOT NULL DEFAULT false,
    "poorReadingStamina" BOOLEAN NOT NULL DEFAULT false,
    "punctuationErrors" BOOLEAN NOT NULL DEFAULT false,
    "doesNotPauseAtFullStop" BOOLEAN NOT NULL DEFAULT false,
    "extraPausesAtCommas" BOOLEAN NOT NULL DEFAULT false,
    "incorrectToneForQuestionExclamation" BOOLEAN NOT NULL DEFAULT false,
    "additionalNotes" TEXT,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reading_skill_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "writing_skill_assessments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "specialEducatorId" TEXT NOT NULL,
    "incorrectPencilGrip" BOOLEAN NOT NULL DEFAULT false,
    "holdsPencilTooTightly" BOOLEAN NOT NULL DEFAULT false,
    "holdsPencilTooLoosely" BOOLEAN NOT NULL DEFAULT false,
    "writesExcessivePressure" BOOLEAN NOT NULL DEFAULT false,
    "writesLightPressure" BOOLEAN NOT NULL DEFAULT false,
    "wristFingerPainComplaints" BOOLEAN NOT NULL DEFAULT false,
    "slowFineMotorSpeed" BOOLEAN NOT NULL DEFAULT false,
    "fatigueAfterShortWriting" BOOLEAN NOT NULL DEFAULT false,
    "incorrectLetterFormation" BOOLEAN NOT NULL DEFAULT false,
    "reversals" BOOLEAN NOT NULL DEFAULT false,
    "difficultiesFormingCurvesDiagonals" BOOLEAN NOT NULL DEFAULT false,
    "lettersWrittenMirrorImage" BOOLEAN NOT NULL DEFAULT false,
    "poorStrokeSequence" BOOLEAN NOT NULL DEFAULT false,
    "capitalsInsertedBetweenWords" BOOLEAN NOT NULL DEFAULT false,
    "difficultyCopyingLetters" BOOLEAN NOT NULL DEFAULT false,
    "poorSpacingBetweenLetters" BOOLEAN NOT NULL DEFAULT false,
    "poorSpacingBetweenWords" BOOLEAN NOT NULL DEFAULT false,
    "writesOutsideLine" BOOLEAN NOT NULL DEFAULT false,
    "difficultyMaintainingBaseline" BOOLEAN NOT NULL DEFAULT false,
    "unevenLetterSize" BOOLEAN NOT NULL DEFAULT false,
    "inconsistentSpacingAcrossPage" BOOLEAN NOT NULL DEFAULT false,
    "crowdedWriting" BOOLEAN NOT NULL DEFAULT false,
    "tooMuchSpaceBetweenLetters" BOOLEAN NOT NULL DEFAULT false,
    "floatingLettersAboveLine" BOOLEAN NOT NULL DEFAULT false,
    "verySlowWriting" BOOLEAN NOT NULL DEFAULT false,
    "writesTooFastManyErrors" BOOLEAN NOT NULL DEFAULT false,
    "poorHandwritingEndurance" BOOLEAN NOT NULL DEFAULT false,
    "choppyWriting" BOOLEAN NOT NULL DEFAULT false,
    "inconsistentPace" BOOLEAN NOT NULL DEFAULT false,
    "repeatedErasing" BOOLEAN NOT NULL DEFAULT false,
    "frequentCorrections" BOOLEAN NOT NULL DEFAULT false,
    "difficultyWritingDictatedLetters" BOOLEAN NOT NULL DEFAULT false,
    "difficultyWritingDictatedWords" BOOLEAN NOT NULL DEFAULT false,
    "spellsPhonetically" BOOLEAN NOT NULL DEFAULT false,
    "omitsLettersInSpelling" BOOLEAN NOT NULL DEFAULT false,
    "addsExtraLetters" BOOLEAN NOT NULL DEFAULT false,
    "substitutesLettersOrSounds" BOOLEAN NOT NULL DEFAULT false,
    "confusesVowelSounds" BOOLEAN NOT NULL DEFAULT false,
    "troubleEncodingCVC" BOOLEAN NOT NULL DEFAULT false,
    "troubleEncodingBlendsDigraphs" BOOLEAN NOT NULL DEFAULT false,
    "cannotConstructSimpleSentences" BOOLEAN NOT NULL DEFAULT false,
    "writesOnlySingleWords" BOOLEAN NOT NULL DEFAULT false,
    "strugglesExpandSentences" BOOLEAN NOT NULL DEFAULT false,
    "poorGrammarUsage" BOOLEAN NOT NULL DEFAULT false,
    "writesIncompleteSentences" BOOLEAN NOT NULL DEFAULT false,
    "confusingSentenceOrder" BOOLEAN NOT NULL DEFAULT false,
    "difficultyExpressingIdeas" BOOLEAN NOT NULL DEFAULT false,
    "avoidsWrittenTasks" BOOLEAN NOT NULL DEFAULT false,
    "needsVerbalPromptsToWrite" BOOLEAN NOT NULL DEFAULT false,
    "difficultyCopyingFromBoard" BOOLEAN NOT NULL DEFAULT false,
    "difficultyCopyingFromBook" BOOLEAN NOT NULL DEFAULT false,
    "slowCopying" BOOLEAN NOT NULL DEFAULT false,
    "skipsWordsOrLettersWhenCopying" BOOLEAN NOT NULL DEFAULT false,
    "copiesInaccurately" BOOLEAN NOT NULL DEFAULT false,
    "looksAwayFrequentlyWhileCopying" BOOLEAN NOT NULL DEFAULT false,
    "writingDisorganized" BOOLEAN NOT NULL DEFAULT false,
    "thoughtsNotLogicallySequenced" BOOLEAN NOT NULL DEFAULT false,
    "cannotPlanWriting" BOOLEAN NOT NULL DEFAULT false,
    "beginsWritingRandomAreasOnPage" BOOLEAN NOT NULL DEFAULT false,
    "noConceptOfMargins" BOOLEAN NOT NULL DEFAULT false,
    "paragraphingDifficulty" BOOLEAN NOT NULL DEFAULT false,
    "avoidsWritingActivities" BOOLEAN NOT NULL DEFAULT false,
    "complainsWritingIsHard" BOOLEAN NOT NULL DEFAULT false,
    "getsFrustratedQuickly" BOOLEAN NOT NULL DEFAULT false,
    "lowWritingStamina" BOOLEAN NOT NULL DEFAULT false,
    "givesUpInMiddleOfTask" BOOLEAN NOT NULL DEFAULT false,
    "lowConfidenceWriting" BOOLEAN NOT NULL DEFAULT false,
    "inconsistentPerformanceAcrossDays" BOOLEAN NOT NULL DEFAULT false,
    "additionalNotes" TEXT,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "writing_skill_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "math_skill_assessments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "specialEducatorId" TEXT NOT NULL,
    "difficultyIdentifyingNumbers1to10" BOOLEAN NOT NULL DEFAULT false,
    "difficultyIdentifyingNumbers1to20" BOOLEAN NOT NULL DEFAULT false,
    "difficultyIdentifyingNumbers1to100" BOOLEAN NOT NULL DEFAULT false,
    "reversesNumbers" BOOLEAN NOT NULL DEFAULT false,
    "writesNumbersIncorrectly" BOOLEAN NOT NULL DEFAULT false,
    "difficultySequencingNumbers" BOOLEAN NOT NULL DEFAULT false,
    "skipsNumbersWhileCounting" BOOLEAN NOT NULL DEFAULT false,
    "countsSlowlyOrWithEffort" BOOLEAN NOT NULL DEFAULT false,
    "troubleWithForwardCounting" BOOLEAN NOT NULL DEFAULT false,
    "troubleWithBackwardCounting" BOOLEAN NOT NULL DEFAULT false,
    "difficultyWithSkipCounting" BOOLEAN NOT NULL DEFAULT false,
    "doesNotUnderstandQuantity" BOOLEAN NOT NULL DEFAULT false,
    "cannotMatchNumberToQuantity" BOOLEAN NOT NULL DEFAULT false,
    "cannotCompareNumbers" BOOLEAN NOT NULL DEFAULT false,
    "difficultyIdentifyingPlaceValue" BOOLEAN NOT NULL DEFAULT false,
    "strugglesSingleDigitAddition" BOOLEAN NOT NULL DEFAULT false,
    "strugglesSingleDigitSubtraction" BOOLEAN NOT NULL DEFAULT false,
    "cannotCarryOver" BOOLEAN NOT NULL DEFAULT false,
    "cannotBorrow" BOOLEAN NOT NULL DEFAULT false,
    "usesFingerCountingExcessively" BOOLEAN NOT NULL DEFAULT false,
    "cannotPerformMentalMath" BOOLEAN NOT NULL DEFAULT false,
    "doesNotUnderstandPlusMinusSymbols" BOOLEAN NOT NULL DEFAULT false,
    "confusesAdditionSubtraction" BOOLEAN NOT NULL DEFAULT false,
    "difficultyWithWordProblems" BOOLEAN NOT NULL DEFAULT false,
    "cannotUnderstandRealWorldMath" BOOLEAN NOT NULL DEFAULT false,
    "difficultyUnderstandingPatterns" BOOLEAN NOT NULL DEFAULT false,
    "difficultyFinishingPatterns" BOOLEAN NOT NULL DEFAULT false,
    "troubleIdentifyingShapes" BOOLEAN NOT NULL DEFAULT false,
    "troubleSortingObjects" BOOLEAN NOT NULL DEFAULT false,
    "difficultyInMatching" BOOLEAN NOT NULL DEFAULT false,
    "difficultyWithSpatialConcepts" BOOLEAN NOT NULL DEFAULT false,
    "difficultyUnderstandingMeasurement" BOOLEAN NOT NULL DEFAULT false,
    "difficultyWithTimeConcepts" BOOLEAN NOT NULL DEFAULT false,
    "difficultyReadingClock" BOOLEAN NOT NULL DEFAULT false,
    "verySlowInSolvingProblems" BOOLEAN NOT NULL DEFAULT false,
    "frequentCalculationMistakes" BOOLEAN NOT NULL DEFAULT false,
    "poorWorkingMemoryForMath" BOOLEAN NOT NULL DEFAULT false,
    "troubleRememberingMathFacts" BOOLEAN NOT NULL DEFAULT false,
    "difficultyRememberingSteps" BOOLEAN NOT NULL DEFAULT false,
    "needsRepeatedInstructions" BOOLEAN NOT NULL DEFAULT false,
    "getsConfusedDuringMultiStep" BOOLEAN NOT NULL DEFAULT false,
    "misalignsNumbersInColumns" BOOLEAN NOT NULL DEFAULT false,
    "writesNumbersOutsideGrid" BOOLEAN NOT NULL DEFAULT false,
    "poorSpatialOrganization" BOOLEAN NOT NULL DEFAULT false,
    "placesDigitsInWrongOrder" BOOLEAN NOT NULL DEFAULT false,
    "drawsShapesIncorrectly" BOOLEAN NOT NULL DEFAULT false,
    "cannotVisuallyGroupObjects" BOOLEAN NOT NULL DEFAULT false,
    "difficultyCopyingMathFromBoard" BOOLEAN NOT NULL DEFAULT false,
    "confusesMathSymbols" BOOLEAN NOT NULL DEFAULT false,
    "cannotUnderstandEqualsMeansSameAs" BOOLEAN NOT NULL DEFAULT false,
    "treatsEqualsAsAnswerComesAfter" BOOLEAN NOT NULL DEFAULT false,
    "difficultyRememberingOperationRules" BOOLEAN NOT NULL DEFAULT false,
    "cannotDifferentiateTensOnes" BOOLEAN NOT NULL DEFAULT false,
    "misunderstandsMoreLess" BOOLEAN NOT NULL DEFAULT false,
    "avoidsMathTasks" BOOLEAN NOT NULL DEFAULT false,
    "lowMathConfidence" BOOLEAN NOT NULL DEFAULT false,
    "givesUpQuickly" BOOLEAN NOT NULL DEFAULT false,
    "anxiousDuringMathActivities" BOOLEAN NOT NULL DEFAULT false,
    "needsConstantPrompting" BOOLEAN NOT NULL DEFAULT false,
    "appearsConfusedAfterExplanation" BOOLEAN NOT NULL DEFAULT false,
    "poorAttentionDuringMath" BOOLEAN NOT NULL DEFAULT false,
    "additionalNotes" TEXT,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "math_skill_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_plans" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "specialEducatorId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "skillArea" "SkillArea" NOT NULL,
    "specificTopic" TEXT NOT NULL,
    "areasOfRemediation" TEXT[],
    "activityStrategy" TEXT NOT NULL,
    "resourcesUsed" TEXT[],
    "expectedTime" INTEGER,
    "actualTimeTaken" INTEGER,
    "motivationLevel" "MotivationLevel",
    "outcome" TEXT,
    "nextStep" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "specialEducatorId" TEXT NOT NULL,
    "parentId" TEXT,
    "subject" "SkillArea" NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "attachedFiles" TEXT[],
    "dueDate" TIMESTAMP(3) NOT NULL,
    "additionalNotes" TEXT,
    "estimatedTime" INTEGER,
    "skillTargeted" TEXT,
    "status" "HomeworkStatus" NOT NULL DEFAULT 'ASSIGNED',
    "submittedAt" TIMESTAMP(3),
    "parentFeedback" TEXT,
    "educatorFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_materials" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" "SkillArea" NOT NULL,
    "grade" INTEGER NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "fileUrl" TEXT,
    "fileType" TEXT,
    "tags" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_materials_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "formal_assessments" ADD CONSTRAINT "formal_assessments_specialEducatorId_fkey" FOREIGN KEY ("specialEducatorId") REFERENCES "special_educator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formal_assessments" ADD CONSTRAINT "formal_assessments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_skill_assessments" ADD CONSTRAINT "reading_skill_assessments_specialEducatorId_fkey" FOREIGN KEY ("specialEducatorId") REFERENCES "special_educator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_skill_assessments" ADD CONSTRAINT "reading_skill_assessments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_skill_assessments" ADD CONSTRAINT "writing_skill_assessments_specialEducatorId_fkey" FOREIGN KEY ("specialEducatorId") REFERENCES "special_educator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_skill_assessments" ADD CONSTRAINT "writing_skill_assessments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "math_skill_assessments" ADD CONSTRAINT "math_skill_assessments_specialEducatorId_fkey" FOREIGN KEY ("specialEducatorId") REFERENCES "special_educator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "math_skill_assessments" ADD CONSTRAINT "math_skill_assessments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_specialEducatorId_fkey" FOREIGN KEY ("specialEducatorId") REFERENCES "special_educator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_specialEducatorId_fkey" FOREIGN KEY ("specialEducatorId") REFERENCES "special_educator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
