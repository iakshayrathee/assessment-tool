/*
  Warnings:

  - You are about to drop the column `longTermGoals` on the `ieps` table. All the data in the column will be lost.
  - You are about to drop the column `presentLevel` on the `ieps` table. All the data in the column will be lost.
  - You are about to drop the column `shortTermGoals` on the `ieps` table. All the data in the column will be lost.
  - The `areasOfRemediation` column on the `ieps` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `weeklyPlanId` on the `weekly_evaluations` table. All the data in the column will be lost.
  - You are about to drop the `weekly_plans` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `className` to the `ieps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `durationInMonths` to the `ieps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iepId` to the `weekly_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weekStartDate` to the `weekly_evaluations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RemediationArea" AS ENUM ('ORAL_LANGUAGE', 'READING', 'WRITING', 'SPELLING', 'MATH');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

-- DropForeignKey
ALTER TABLE "weekly_evaluations" DROP CONSTRAINT "weekly_evaluations_weeklyPlanId_fkey";

-- DropForeignKey
ALTER TABLE "weekly_plans" DROP CONSTRAINT "weekly_plans_iepId_fkey";

-- AlterTable
ALTER TABLE "ieps" DROP COLUMN "longTermGoals",
DROP COLUMN "presentLevel",
DROP COLUMN "shortTermGoals",
ADD COLUMN     "className" TEXT NOT NULL,
ADD COLUMN     "durationInMonths" INTEGER NOT NULL,
DROP COLUMN "areasOfRemediation",
ADD COLUMN     "areasOfRemediation" "RemediationArea"[];

-- AlterTable
ALTER TABLE "weekly_evaluations" DROP COLUMN "weeklyPlanId",
ADD COLUMN     "iepId" TEXT NOT NULL,
ADD COLUMN     "weekStartDate" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "weekly_plans";

-- CreateTable
CREATE TABLE "iep_subjects" (
    "id" TEXT NOT NULL,
    "iepId" TEXT NOT NULL,
    "subject" "RemediationArea" NOT NULL,
    "receptiveSkills" TEXT NOT NULL,
    "expressiveSkills" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iep_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "long_term_goals" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "long_term_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "short_term_goals" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "teacherAssistance" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "short_term_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_lesson_plans" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_lesson_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_lessons" (
    "id" TEXT NOT NULL,
    "weeklyPlanId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "testGoalActivity" TEXT NOT NULL,
    "analysis" TEXT NOT NULL,
    "assessment" TEXT NOT NULL,
    "behavioralAttention" TEXT NOT NULL,
    "behavioralSitting" TEXT NOT NULL,
    "behavioralTaskCompletion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_lessons_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "iep_subjects" ADD CONSTRAINT "iep_subjects_iepId_fkey" FOREIGN KEY ("iepId") REFERENCES "ieps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "long_term_goals" ADD CONSTRAINT "long_term_goals_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "iep_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_term_goals" ADD CONSTRAINT "short_term_goals_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "iep_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_lesson_plans" ADD CONSTRAINT "weekly_lesson_plans_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "iep_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_lessons" ADD CONSTRAINT "daily_lessons_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "weekly_lesson_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
