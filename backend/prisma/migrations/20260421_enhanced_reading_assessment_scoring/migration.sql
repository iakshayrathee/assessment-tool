-- Enhanced Reading Assessment Scoring System Migration
-- Adds comprehensive scoring fields for Learning Context and Resources sections

-- Section 2: Learning Context - Enhanced Fields
ALTER TABLE reading_skill_assessments
ALTER COLUMN readingExposureAtHome TYPE TEXT USING readingExposureAtHome::TEXT,
ALTER COLUMN readingSupportAtHome TYPE TEXT USING readingSupportAtHome::TEXT,
ALTER COLUMN languageMismatch TYPE TEXT USING languageMismatch::TEXT,
ALTER COLUMN previousIntervention TYPE TEXT USING previousIntervention::TEXT;

-- Add new Learning Context fields
ALTER TABLE reading_skill_assessments
ADD COLUMN IF NOT EXISTS exposureDetails TEXT,
ADD COLUMN IF NOT EXISTS supportDetails TEXT,
ADD COLUMN IF NOT EXISTS interventionDetails TEXT,
ADD COLUMN IF NOT EXISTS readingMaterialAccess TEXT;

-- Add enhanced scoring fields for Learning Context
ALTER TABLE reading_skill_assessments
ADD COLUMN IF NOT EXISTS exposureScore INTEGER CHECK (exposureScore >= 0 AND exposureScore <= 3),
ADD COLUMN IF NOT EXISTS supportScore INTEGER CHECK (supportScore >= 0 AND supportScore <= 2),
ADD COLUMN IF NOT EXISTS interventionScore INTEGER CHECK (interventionScore >= 0 AND interventionScore <= 2),
ADD COLUMN IF NOT EXISTS languageRiskScore INTEGER CHECK (languageRiskScore >= 0 AND languageRiskScore <= 2),
ADD COLUMN IF NOT EXISTS materialAccessScore INTEGER CHECK (materialAccessScore >= 0 AND materialAccessScore <= 2),
ADD COLUMN IF NOT EXISTS environmentScore INTEGER CHECK (environmentScore >= 0 AND environmentScore <= 7),
ADD COLUMN IF NOT EXISTS environmentBuffer INTEGER CHECK (environmentBuffer IN (0, 5, 15));

-- Add Resources Section scoring fields
ALTER TABLE reading_skill_assessments
ADD COLUMN IF NOT EXISTS schoolTextScore FLOAT,
ADD COLUMN IF NOT EXISTS knownTextScore FLOAT,
ADD COLUMN IF NOT EXISTS unknownTextScore FLOAT,
ADD COLUMN IF NOT EXISTS finalReadingScore FLOAT CHECK (finalReadingScore >= 0 AND finalReadingScore <= 100);

-- Add Final Risk Assessment fields
ALTER TABLE reading_skill_assessments
ADD COLUMN IF NOT EXISTS resourceContextScore INTEGER,
ADD COLUMN IF NOT EXISTS finalRiskScore INTEGER CHECK (finalRiskScore >= 0 AND finalRiskScore <= 100);

-- Add Detailed Resource Assessment Fields - School Text
ALTER TABLE reading_skill_assessments
ADD COLUMN IF NOT EXISTS schoolTextGradeLevel TEXT,
ADD COLUMN IF NOT EXISTS schoolTextDifficulty TEXT CHECK (schoolTextDifficulty IN ('Easy', 'Grade Level', 'Hard')),
ADD COLUMN IF NOT EXISTS schoolTextQuality TEXT CHECK (schoolTextQuality IN ('Excellent', 'Good', 'Developing', 'Needs Support')),
ADD COLUMN IF NOT EXISTS schoolTextFluency TEXT CHECK (schoolTextFluency IN ('Fast', 'On-level', 'Slow', 'Very slow')),
ADD COLUMN IF NOT EXISTS schoolTextErrors TEXT CHECK (schoolTextErrors IN ('Minimal', 'Moderate', 'Frequent')),
ADD COLUMN IF NOT EXISTS schoolTextObservation TEXT;

-- Add Detailed Resource Assessment Fields - Known Text
ALTER TABLE reading_skill_assessments
ADD COLUMN IF NOT EXISTS knownTextType TEXT CHECK (knownTextType IN ('Textbook', 'Storybook', 'Previously practiced', 'Teacher-provided', 'Other')),
ADD COLUMN IF NOT EXISTS knownTextFamiliarity TEXT CHECK (knownTextFamiliarity IN ('Highly familiar', 'Somewhat familiar', 'Memorized')),
ADD COLUMN IF NOT EXISTS knownTextDifficulty TEXT CHECK (knownTextDifficulty IN ('Easy', 'Grade Level', 'Hard')),
ADD COLUMN IF NOT EXISTS knownTextQuality TEXT CHECK (knownTextQuality IN ('Excellent', 'Good', 'Developing', 'Needs Support')),
ADD COLUMN IF NOT EXISTS knownTextFluency TEXT CHECK (knownTextFluency IN ('Fast', 'On-level', 'Slow', 'Very slow')),
ADD COLUMN IF NOT EXISTS knownTextErrors TEXT CHECK (knownTextErrors IN ('Minimal', 'Moderate', 'Frequent')),
ADD COLUMN IF NOT EXISTS knownTextObservation TEXT;

-- Add Detailed Resource Assessment Fields - Unknown Text
ALTER TABLE reading_skill_assessments
ADD COLUMN IF NOT EXISTS unknownTextSource TEXT CHECK (unknownTextSource IN ('Textbook (new lesson)', 'Storybook (unseen)', 'Teacher-created', 'External material')),
ADD COLUMN IF NOT EXISTS unknownTextDifficulty TEXT CHECK (unknownTextDifficulty IN ('Easy', 'Grade Level', 'Hard')),
ADD COLUMN IF NOT EXISTS unknownTextQuality TEXT CHECK (unknownTextQuality IN ('Excellent', 'Good', 'Developing', 'Needs Support')),
ADD COLUMN IF NOT EXISTS unknownTextFluency TEXT CHECK (unknownTextFluency IN ('Fast', 'On-level', 'Slow', 'Very slow')),
ADD COLUMN IF NOT EXISTS unknownTextErrors TEXT CHECK (unknownTextErrors IN ('Minimal', 'Moderate', 'Frequent')),
ADD COLUMN IF NOT EXISTS unknownTextObservation TEXT;

-- Add Resource Context Assessment fields
ALTER TABLE reading_skill_assessments
ADD COLUMN IF NOT EXISTS materialTypes TEXT[],
ADD COLUMN IF NOT EXISTS materialLevels TEXT[],
ADD COLUMN IF NOT EXISTS readingIndependence TEXT CHECK (readingIndependence IN ('Reads independently', 'Needs support', 'Avoids reading'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reading_assessments_environment_score ON reading_skill_assessments(environmentScore);
CREATE INDEX IF NOT EXISTS idx_reading_assessments_final_risk_score ON reading_skill_assessments(finalRiskScore);
CREATE INDEX IF NOT EXISTS idx_reading_assessments_final_reading_score ON reading_skill_assessments(finalReadingScore);
CREATE INDEX IF NOT EXISTS idx_reading_assessments_tier ON reading_skill_assessments(tier);

-- Add comments for documentation
COMMENT ON COLUMN reading_skill_assessments.exposureScore IS '0-3: Daily=3, Few times/week=2, Occasionally=1, Rare/Never=0';
COMMENT ON COLUMN reading_skill_assessments.supportScore IS '0-2: Regular=2, Occasional=1, None=0';
COMMENT ON COLUMN reading_skill_assessments.interventionScore IS '0-2: Therapy=2, Tutoring=1, None=0';
COMMENT ON COLUMN reading_skill_assessments.languageRiskScore IS '0-2: Major=2, Minor=1, None=0';
COMMENT ON COLUMN reading_skill_assessments.materialAccessScore IS '0-2: Books=2, Digital=1, None=0';
COMMENT ON COLUMN reading_skill_assessments.environmentScore IS '0-7: Exposure + Support + Material Access';
COMMENT ON COLUMN reading_skill_assessments.environmentBuffer IS 'Environment buffer: ES <= 2: 15, ES 3-5: 5, ES >= 6: 0';
COMMENT ON COLUMN reading_skill_assessments.finalReadingScore IS 'RS = (School × 0.2) + (Known × 0.3) + (Unknown × 0.5)';
COMMENT ON COLUMN reading_skill_assessments.finalRiskScore IS 'FRS = (100 - RS) - Buffer - LR - IF';
COMMENT ON COLUMN reading_skill_assessments.resourceContextScore IS 'Resource usage + Level alignment + Independence';
