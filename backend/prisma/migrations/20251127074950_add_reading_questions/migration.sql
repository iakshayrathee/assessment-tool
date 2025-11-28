-- AlterTable
ALTER TABLE "math_skill_assessments" ADD COLUMN     "mathQ1" TEXT,
ADD COLUMN     "mathQ2" TEXT,
ADD COLUMN     "mathQ3" TEXT;

-- AlterTable
ALTER TABLE "reading_skill_assessments" ADD COLUMN     "readingQ1" TEXT,
ADD COLUMN     "readingQ2" TEXT,
ADD COLUMN     "readingQ3" TEXT;

-- AlterTable
ALTER TABLE "writing_skill_assessments" ADD COLUMN     "writingQ1" TEXT,
ADD COLUMN     "writingQ2" TEXT,
ADD COLUMN     "writingQ3" TEXT;
