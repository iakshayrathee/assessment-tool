-- CreateTable
CREATE TABLE "parent_report_snapshots" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "periodType" "ReportPeriodType" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentGrade" TEXT NOT NULL,
    "studentAge" INTEGER NOT NULL,
    "enrollmentDate" TIMESTAMP(3) NOT NULL,
    "assignedEducatorName" TEXT,
    "totalAssessments" INTEGER NOT NULL,
    "latestAssessmentDate" TIMESTAMP(3),
    "latestAssessmentScore" DOUBLE PRECISION,
    "riskLevel" TEXT,
    "assessmentProgress" TEXT,
    "readingProgress" DOUBLE PRECISION,
    "writingProgress" DOUBLE PRECISION,
    "mathProgress" DOUBLE PRECISION,
    "attentionProgress" DOUBLE PRECISION,
    "overallGoalCompletion" DOUBLE PRECISION,
    "totalSessionsScheduled" INTEGER NOT NULL,
    "sessionsAttended" INTEGER NOT NULL,
    "participationRate" DOUBLE PRECISION,
    "lastSessionDate" TIMESTAMP(3),
    "focusReading" BOOLEAN NOT NULL DEFAULT false,
    "focusWriting" BOOLEAN NOT NULL DEFAULT false,
    "focusMathematics" BOOLEAN NOT NULL DEFAULT false,
    "focusAttention" BOOLEAN NOT NULL DEFAULT false,
    "focusConfidence" BOOLEAN NOT NULL DEFAULT false,
    "shortTermGoals" TEXT,
    "longTermGoals" TEXT,
    "readingStrategy" TEXT,
    "writingStrategy" TEXT,
    "mathematicsStrategy" TEXT,
    "attentionStrategy" TEXT,
    "confidenceStrategy" TEXT,
    "educatorNotes" TEXT,
    "parentFriendlySummary" TEXT,
    "nextReviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_report_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parent_report_snapshots_studentId_periodType_periodStart_idx" ON "parent_report_snapshots"("studentId", "periodType", "periodStart");

-- CreateIndex
CREATE INDEX "parent_report_snapshots_parentId_periodStart_idx" ON "parent_report_snapshots"("parentId", "periodStart");

-- AddForeignKey
ALTER TABLE "parent_report_snapshots" ADD CONSTRAINT "parent_report_snapshots_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_report_snapshots" ADD CONSTRAINT "parent_report_snapshots_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
