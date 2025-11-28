-- CreateEnum
CREATE TYPE "IEPStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('MENTORSHIP', 'WORKSHOP', 'OBSERVATION', 'FEEDBACK_SESSION', 'PROFESSIONAL_DEVELOPMENT', 'CASE_CONSULTATION');

-- CreateTable
CREATE TABLE "ieps" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "educatorId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "presentLevel" JSONB,
    "longTermGoals" JSONB[],
    "shortTermGoals" JSONB[],
    "areasOfRemediation" TEXT[],
    "status" "IEPStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ieps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_plans" (
    "id" TEXT NOT NULL,
    "iepId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "monthlyPlan" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_evaluations" (
    "id" TEXT NOT NULL,
    "weeklyPlanId" TEXT NOT NULL,
    "evaluationDate" TIMESTAMP(3) NOT NULL,
    "oralLanguage" JSONB,
    "reading" JSONB,
    "writing" JSONB,
    "spelling" JSONB,
    "math" JSONB,
    "attention" TEXT,
    "behavioralSitting" TEXT,
    "taskCompletion" TEXT,
    "strategies" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "data" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_logs" (
    "id" TEXT NOT NULL,
    "superSpecialEducatorId" TEXT NOT NULL,
    "specialEducatorId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "TrainingType" NOT NULL DEFAULT 'MENTORSHIP',
    "duration" INTEGER,
    "participants" TEXT[],
    "notes" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ieps" ADD CONSTRAINT "ieps_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ieps" ADD CONSTRAINT "ieps_educatorId_fkey" FOREIGN KEY ("educatorId") REFERENCES "special_educator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_plans" ADD CONSTRAINT "weekly_plans_iepId_fkey" FOREIGN KEY ("iepId") REFERENCES "ieps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_evaluations" ADD CONSTRAINT "weekly_evaluations_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "weekly_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_logs" ADD CONSTRAINT "training_logs_superSpecialEducatorId_fkey" FOREIGN KEY ("superSpecialEducatorId") REFERENCES "super_special_educator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_logs" ADD CONSTRAINT "training_logs_specialEducatorId_fkey" FOREIGN KEY ("specialEducatorId") REFERENCES "special_educator_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
