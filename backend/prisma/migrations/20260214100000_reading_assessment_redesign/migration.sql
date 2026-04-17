-- ReadingSkillAssessment Redesign: Add 14-section structured fields + computed scores

-- Section 1: Basic Info
ALTER TABLE "reading_skill_assessments"
ADD COLUMN IF NOT EXISTS "assessmentDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "mediumOfInstruction" TEXT,
ADD COLUMN IF NOT EXISTS "firstLanguage" TEXT,
ADD COLUMN IF NOT EXISTS "parentConcern" TEXT;

-- Section 2: Reading Context
ALTER TABLE "reading_skill_assessments"
ADD COLUMN IF NOT EXISTS "readingExposureAtHome" TEXT,
ADD COLUMN IF NOT EXISTS "readingSupportAtHome" BOOLEAN,
ADD COLUMN IF NOT EXISTS "readingSupportDetails" TEXT,
ADD COLUMN IF NOT EXISTS "typeOfSchooling" TEXT,
ADD COLUMN IF NOT EXISTS "languageMismatch" BOOLEAN,
ADD COLUMN IF NOT EXISTS "previousIntervention" BOOLEAN,
ADD COLUMN IF NOT EXISTS "previousInterventionType" TEXT;

-- Section 3: Reading Resources (JSON)
ALTER TABLE "reading_skill_assessments"
ADD COLUMN IF NOT EXISTS "readingResources" JSONB;

-- Section 4: Reading Behavior
ALTER TABLE "reading_skill_assessments"
ADD COLUMN IF NOT EXISTS "interestInReading" INTEGER,
ADD COLUMN IF NOT EXISTS "attentionSpanMinutes" INTEGER,
ADD COLUMN IF NOT EXISTS "readingStamina" INTEGER,
ADD COLUMN IF NOT EXISTS "frustrationTolerance" INTEGER,
ADD COLUMN IF NOT EXISTS "emotionalResponse" TEXT,
ADD COLUMN IF NOT EXISTS "taskAvoidance" BOOLEAN,
ADD COLUMN IF NOT EXISTS "motivation" TEXT,
ADD COLUMN IF NOT EXISTS "confidenceLevel" INTEGER,
ADD COLUMN IF NOT EXISTS "selfCorrectionAbility" TEXT,
ADD COLUMN IF NOT EXISTS "promptDependency" TEXT,
ADD COLUMN IF NOT EXISTS "behaviorObservations" TEXT;

-- Section 5: Core Reading Skills
ALTER TABLE "reading_skill_assessments"
ADD COLUMN IF NOT EXISTS "phonologicalAwareness" JSONB,
ADD COLUMN IF NOT EXISTS "decodingSkills" JSONB,
ADD COLUMN IF NOT EXISTS "wordsPerMinute" INTEGER,
ADD COLUMN IF NOT EXISTS "fluencyAccuracy" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "fluencyErrorRate" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "hesitationCount" INTEGER,
ADD COLUMN IF NOT EXISTS "sightWordsPercent" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "punctuationAwareness" BOOLEAN,
ADD COLUMN IF NOT EXISTS "readingExpression" TEXT,
ADD COLUMN IF NOT EXISTS "pausingCorrectness" TEXT,
ADD COLUMN IF NOT EXISTS "skipsLinesVisual" BOOLEAN,
ADD COLUMN IF NOT EXISTS "usesFinger" BOOLEAN,
ADD COLUMN IF NOT EXISTS "losesPlace" BOOLEAN;

-- Section 6: Comprehension (JSON)
ALTER TABLE "reading_skill_assessments"
ADD COLUMN IF NOT EXISTS "comprehension" JSONB;

-- Section 7: Error Analysis (JSON)
ALTER TABLE "reading_skill_assessments"
ADD COLUMN IF NOT EXISTS "errorAnalysis" JSONB;

-- Section 8: Strengths (JSON)
ALTER TABLE "reading_skill_assessments"
ADD COLUMN IF NOT EXISTS "strengths" JSONB;

-- Section 9: Challenges
ALTER TABLE "reading_skill_assessments"
ADD COLUMN IF NOT EXISTS "primaryChallenge" TEXT,
ADD COLUMN IF NOT EXISTS "secondaryChallenge" TEXT,
ADD COLUMN IF NOT EXISTS "challengeSeverity" TEXT;

-- Section 10: Red Flags (JSON)
ALTER TABLE "reading_skill_assessments"
ADD COLUMN IF NOT EXISTS "redFlags" JSONB;

-- Section 11: Level Classification
ALTER TABLE "reading_skill_assessments"
ADD COLUMN IF NOT EXISTS "knownTextAccuracy" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "unknownTextAccuracy" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "knownTextLevel" TEXT,
ADD COLUMN IF NOT EXISTS "unknownTextLevel" TEXT,
ADD COLUMN IF NOT EXISTS "finalReadingLevel" TEXT;

-- Section 12: Grade Level Mapping
ALTER TABLE "reading_skill_assessments"
ADD COLUMN IF NOT EXISTS "currentGrade" TEXT,
ADD COLUMN IF NOT EXISTS "readingGradeLevel" TEXT,
ADD COLUMN IF NOT EXISTS "gradeGap" TEXT;

-- Section 13: AI Insights (JSON)
ALTER TABLE "reading_skill_assessments"
ADD COLUMN IF NOT EXISTS "aiInsights" JSONB,
ADD COLUMN IF NOT EXISTS "aiInsightsStatus" TEXT;

-- Section 14: Progress Tracking (JSON)
ALTER TABLE "reading_skill_assessments"
ADD COLUMN IF NOT EXISTS "progressTracking" JSONB;

-- Computed Scores
ALTER TABLE "reading_skill_assessments"
ADD COLUMN IF NOT EXISTS "decodingScore" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "fluencyScore" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "comprehensionScore" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "behaviorScore" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "overallReadingScore" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "tier" TEXT,
ADD COLUMN IF NOT EXISTS "ldRiskFlag" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "ldRiskDetails" TEXT;

-- Wizard step tracking
ALTER TABLE "reading_skill_assessments"
ADD COLUMN IF NOT EXISTS "currentStep" INTEGER DEFAULT 1;
