-- FormalAssessment: Add summary field + make assessmentType and referralDate optional
-- Supports the new simplified upload-based formal assessment form

-- Add summary column
ALTER TABLE "formal_assessments"
ADD COLUMN IF NOT EXISTS "summary" TEXT;

-- Make assessmentType nullable (new form does not require it)
ALTER TABLE "formal_assessments"
ALTER COLUMN "assessmentType" DROP NOT NULL;

-- Make referralDate nullable (no longer captured in the simplified form)
ALTER TABLE "formal_assessments"
ALTER COLUMN "referralDate" DROP NOT NULL;

-- Add isDraftLocked flag to reading_skill_assessments and formal_assessments
-- We use the existing status field (IN_PROGRESS) to represent a saved draft lock;
-- no schema change needed — existing AssessmentStatus enum covers this.
