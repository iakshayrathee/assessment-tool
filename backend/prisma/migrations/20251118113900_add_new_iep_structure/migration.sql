/*
  Warnings:

  - You are about to drop the column `className` on the `ieps` table. All the data in the column will be lost.
  - You are about to drop the column `durationInMonths` on the `ieps` table. All the data in the column will be lost.
  - The `areasOfRemediation` column on the `ieps` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `iepId` on the `weekly_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `weekStartDate` on the `weekly_evaluations` table. All the data in the column will be lost.
  - You are about to drop the `daily_lessons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `iep_subjects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `long_term_goals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `short_term_goals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `weekly_lesson_plans` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `weeklyPlanId` to the `weekly_evaluations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "IEPSubject" AS ENUM ('ORAL_LANGUAGE', 'READING', 'WRITING', 'SPELLING', 'MATH');

-- CreateEnum
CREATE TYPE "BehavioralAttentionLevel" AS ENUM ('POOR', 'FAIR', 'GOOD', 'EXCELLENT');

-- CreateEnum
CREATE TYPE "BehavioralSittingTolerance" AS ENUM ('POOR', 'FAIR', 'GOOD', 'EXCELLENT');

-- CreateEnum
CREATE TYPE "BehavioralTaskCompletion" AS ENUM ('NOT_COMPLETED', 'PARTIALLY_COMPLETED', 'COMPLETED_WITH_ASSISTANCE', 'COMPLETED_INDEPENDENTLY');

-- DropForeignKey
ALTER TABLE "daily_lessons" DROP CONSTRAINT "daily_lessons_weeklyPlanId_fkey";

-- DropForeignKey
ALTER TABLE "iep_subjects" DROP CONSTRAINT "iep_subjects_iepId_fkey";

-- DropForeignKey
ALTER TABLE "long_term_goals" DROP CONSTRAINT "long_term_goals_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "short_term_goals" DROP CONSTRAINT "short_term_goals_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "weekly_lesson_plans" DROP CONSTRAINT "weekly_lesson_plans_subjectId_fkey";

-- AlterTable
ALTER TABLE "ieps" DROP COLUMN "className",
DROP COLUMN "durationInMonths",
ADD COLUMN     "longTermGoals" JSONB[],
ADD COLUMN     "presentLevel" JSONB,
ADD COLUMN     "shortTermGoals" JSONB[],
DROP COLUMN "areasOfRemediation",
ADD COLUMN     "areasOfRemediation" TEXT[];

-- AlterTable
ALTER TABLE "weekly_evaluations" DROP COLUMN "iepId",
DROP COLUMN "weekStartDate",
ADD COLUMN     "weeklyPlanId" TEXT NOT NULL;

-- DropTable
DROP TABLE "daily_lessons";

-- DropTable
DROP TABLE "iep_subjects";

-- DropTable
DROP TABLE "long_term_goals";

-- DropTable
DROP TABLE "short_term_goals";

-- DropTable
DROP TABLE "weekly_lesson_plans";

-- DropEnum
DROP TYPE "DayOfWeek";

-- DropEnum
DROP TYPE "RemediationArea";

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
CREATE TABLE "iep_documents" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "specialEducatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iep_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iep_subject_sections" (
    "id" TEXT NOT NULL,
    "iepDocumentId" TEXT NOT NULL,
    "subject" "IEPSubject" NOT NULL,
    "presentLevelReceptive" TEXT,
    "presentLevelExpressive" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iep_subject_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iep_long_term_goals" (
    "id" TEXT NOT NULL,
    "subjectSectionId" TEXT NOT NULL,
    "goalNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iep_long_term_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iep_short_term_goals" (
    "id" TEXT NOT NULL,
    "subjectSectionId" TEXT NOT NULL,
    "goalNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "teacherAssistance" TEXT,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iep_short_term_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iep_weekly_evaluations" (
    "id" TEXT NOT NULL,
    "iepDocumentId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "strategies" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iep_weekly_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iep_weekly_activities" (
    "id" TEXT NOT NULL,
    "weeklyEvaluationId" TEXT NOT NULL,
    "subject" "IEPSubject" NOT NULL,
    "activity" TEXT NOT NULL,
    "analysis" TEXT,
    "assessment" TEXT,
    "attentionLevel" "BehavioralAttentionLevel",
    "sittingTolerance" "BehavioralSittingTolerance",
    "taskCompletion" "BehavioralTaskCompletion",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iep_weekly_activities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "weekly_plans" ADD CONSTRAINT "weekly_plans_iepId_fkey" FOREIGN KEY ("iepId") REFERENCES "ieps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_evaluations" ADD CONSTRAINT "weekly_evaluations_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "weekly_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iep_documents" ADD CONSTRAINT "iep_documents_specialEducatorId_fkey" FOREIGN KEY ("specialEducatorId") REFERENCES "special_educator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iep_documents" ADD CONSTRAINT "iep_documents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iep_subject_sections" ADD CONSTRAINT "iep_subject_sections_iepDocumentId_fkey" FOREIGN KEY ("iepDocumentId") REFERENCES "iep_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iep_long_term_goals" ADD CONSTRAINT "iep_long_term_goals_subjectSectionId_fkey" FOREIGN KEY ("subjectSectionId") REFERENCES "iep_subject_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iep_short_term_goals" ADD CONSTRAINT "iep_short_term_goals_subjectSectionId_fkey" FOREIGN KEY ("subjectSectionId") REFERENCES "iep_subject_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iep_weekly_evaluations" ADD CONSTRAINT "iep_weekly_evaluations_iepDocumentId_fkey" FOREIGN KEY ("iepDocumentId") REFERENCES "iep_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iep_weekly_activities" ADD CONSTRAINT "iep_weekly_activities_weeklyEvaluationId_fkey" FOREIGN KEY ("weeklyEvaluationId") REFERENCES "iep_weekly_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
