-- CreateEnum
CREATE TYPE "RiskCategory" AS ENUM ('HIGH_SUPPORT', 'MODERATE_SUPPORT', 'ON_TRACK');

-- CreateEnum
CREATE TYPE "ReportPeriodType" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "lastRiskAssessment" TIMESTAMP(3),
ADD COLUMN     "riskCategory" "RiskCategory" DEFAULT 'ON_TRACK';

-- CreateTable
CREATE TABLE "school_report_snapshots" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "periodType" "ReportPeriodType" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalEnrolled" INTEGER NOT NULL,
    "totalScreened" INTEGER NOT NULL,
    "totalSupported" INTEGER NOT NULL,
    "gradesCovered" TEXT[],
    "highSupportCount" INTEGER NOT NULL,
    "moderateSupportCount" INTEGER NOT NULL,
    "onTrackCount" INTEGER NOT NULL,
    "highSupportReduction" DOUBLE PRECISION,
    "moderateSupportReduction" DOUBLE PRECISION,
    "onTrackIncrease" DOUBLE PRECISION,
    "readingReadinessPercent" DOUBLE PRECISION,
    "writingReadinessPercent" DOUBLE PRECISION,
    "numeracyReadinessPercent" DOUBLE PRECISION,
    "attentionEngagementPercent" DOUBLE PRECISION,
    "processingMemoryPercent" DOUBLE PRECISION,
    "totalSessions" INTEGER NOT NULL,
    "averageImprovement" JSONB,
    "executiveSummary" TEXT,
    "coverageNarrative" TEXT,
    "impactNarrative" TEXT,
    "recommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_report_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "school_report_snapshots_schoolId_periodType_periodStart_idx" ON "school_report_snapshots"("schoolId", "periodType", "periodStart");

-- AddForeignKey
ALTER TABLE "school_report_snapshots" ADD CONSTRAINT "school_report_snapshots_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
