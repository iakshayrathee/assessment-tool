-- AlterTable: Add new fields to reading_skill_assessments
ALTER TABLE "reading_skill_assessments" 
ADD COLUMN IF NOT EXISTS "isAtGradeLevel" BOOLEAN,
ADD COLUMN IF NOT EXISTS "functionalGradeLevel" TEXT,
ADD COLUMN IF NOT EXISTS "performanceSummary" TEXT,
ADD COLUMN IF NOT EXISTS "gradeLevelMappings" JSONB,
ADD COLUMN IF NOT EXISTS "gradeLevelObservation" TEXT,
ADD COLUMN IF NOT EXISTS "batteryTestConducted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "batteryTestSummary" TEXT,
ADD COLUMN IF NOT EXISTS "batteryTestReportUrl" TEXT,
ADD COLUMN IF NOT EXISTS "atGradeLevelComprehension" BOOLEAN,
ADD COLUMN IF NOT EXISTS "comprehensionLevels" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "currentLevelComprehension" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "comprehensionObservation" TEXT;

-- AlterTable: Add new fields to writing_skill_assessments
ALTER TABLE "writing_skill_assessments"
ADD COLUMN IF NOT EXISTS "hasNearCopyingSkills" BOOLEAN,
ADD COLUMN IF NOT EXISTS "nearCopyingLevels" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "nearCopyingObservation" TEXT,
ADD COLUMN IF NOT EXISTS "hasBoardCopyingSkills" BOOLEAN,
ADD COLUMN IF NOT EXISTS "boardCopyingLevels" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "boardCopyingSpeedObservation" TEXT,
ADD COLUMN IF NOT EXISTS "visualTrackingDifficulty" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "omissionSkippingFlag" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "boardCopyingObservation" TEXT,
ADD COLUMN IF NOT EXISTS "usesCapitalLetters" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "usesFullStop" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "usesQuestionMark" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "usesComma" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "usesApostrophe" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "punctuationOther" TEXT,
ADD COLUMN IF NOT EXISTS "punctuationObservation" TEXT,
ADD COLUMN IF NOT EXISTS "spellingStrengthSummary" TEXT,
ADD COLUMN IF NOT EXISTS "spellingErrorPatternObservation" TEXT;

-- AlterTable: Add new fields to math_skill_assessments
ALTER TABLE "math_skill_assessments"
ADD COLUMN IF NOT EXISTS "isAtMathGradeLevel" BOOLEAN,
ADD COLUMN IF NOT EXISTS "mathFunctionalGradeLevel" TEXT,
ADD COLUMN IF NOT EXISTS "mathPerformanceSummary" TEXT,
ADD COLUMN IF NOT EXISTS "mathGradeLevelMappings" JSONB,
ADD COLUMN IF NOT EXISTS "mathGradeLevelObservation" TEXT,
ADD COLUMN IF NOT EXISTS "mathBatteryTestConducted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "mathBatteryTestSummary" TEXT,
ADD COLUMN IF NOT EXISTS "mathBatteryTestReportUrl" TEXT,
ADD COLUMN IF NOT EXISTS "additionPerformance" JSONB,
ADD COLUMN IF NOT EXISTS "subtractionPerformance" JSONB,
ADD COLUMN IF NOT EXISTS "multiplicationPerformance" JSONB,
ADD COLUMN IF NOT EXISTS "divisionPerformance" JSONB,
ADD COLUMN IF NOT EXISTS "placeValuePerformance" JSONB,
ADD COLUMN IF NOT EXISTS "numberLinePerformance" JSONB,
ADD COLUMN IF NOT EXISTS "fractionsPerformance" JSONB,
ADD COLUMN IF NOT EXISTS "decimalsPerformance" JSONB,
ADD COLUMN IF NOT EXISTS "algebraPerformance" JSONB,
ADD COLUMN IF NOT EXISTS "statementSumsPerformance" JSONB,
ADD COLUMN IF NOT EXISTS "geometryPerformance" JSONB;

