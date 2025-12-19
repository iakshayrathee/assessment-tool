-- CreateTable
CREATE TABLE "center_report_snapshots" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "periodType" "ReportPeriodType" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalStudentsRegistered" INTEGER NOT NULL,
    "studentsAssessed" INTEGER NOT NULL,
    "studentsUnderIntervention" INTEGER NOT NULL,
    "newStudentsThisPeriod" INTEGER NOT NULL,
    "activeStudents" INTEGER NOT NULL,
    "exitedMainstreamed" INTEGER NOT NULL,
    "totalAssessmentsConducted" INTEGER NOT NULL,
    "baselineAssessments" INTEGER NOT NULL,
    "reviewProgressAssessments" INTEGER NOT NULL,
    "averageAssessmentTime" DOUBLE PRECISION,
    "assessmentsPerEducator" DOUBLE PRECISION,
    "individualInterventionPlans" INTEGER NOT NULL,
    "smallGroupInterventions" INTEGER NOT NULL,
    "totalInterventionSessions" INTEGER NOT NULL,
    "avgSessionsPerStudent" DOUBLE PRECISION,
    "avgDurationPerSession" DOUBLE PRECISION,
    "readingImprovement" DOUBLE PRECISION,
    "writingImprovement" DOUBLE PRECISION,
    "mathematicsImprovement" DOUBLE PRECISION,
    "attentionBehaviorImprovement" DOUBLE PRECISION,
    "activeSpecialEducators" INTEGER NOT NULL,
    "avgStudentsPerEducator" DOUBLE PRECISION,
    "avgSessionsPerEducator" DOUBLE PRECISION,
    "avgReportsGenerated" DOUBLE PRECISION,
    "assessmentRecordsAvailable" DOUBLE PRECISION,
    "interventionPlansDocumented" DOUBLE PRECISION,
    "progressReviewsCompleted" DOUBLE PRECISION,
    "parentReportsShared" DOUBLE PRECISION,
    "schoolsCovered" TEXT[],
    "gradesCovered" TEXT[],
    "executiveSummary" TEXT,
    "recommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "center_report_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "center_report_snapshots_centerId_periodType_periodStart_idx" ON "center_report_snapshots"("centerId", "periodType", "periodStart");

-- AddForeignKey
ALTER TABLE "center_report_snapshots" ADD CONSTRAINT "center_report_snapshots_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "center_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
