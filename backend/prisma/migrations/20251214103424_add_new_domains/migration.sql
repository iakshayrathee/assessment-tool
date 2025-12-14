/*
  Warnings:

  - You are about to drop the `lesson_plans` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Domain" AS ENUM ('READING', 'WRITING', 'MATH', 'COGNITIVE', 'MOTOR', 'BEHAVIOURAL', 'READING_COMPREHENSION', 'ORAL_LANGUAGE', 'SPELLING');

-- CreateEnum
CREATE TYPE "ReviewCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'BIANNUAL');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'STUDENT';

-- DropForeignKey
ALTER TABLE "lesson_plans" DROP CONSTRAINT "lesson_plans_specialEducatorId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_plans" DROP CONSTRAINT "lesson_plans_studentId_fkey";

-- DropTable
DROP TABLE "lesson_plans";

-- CreateTable
CREATE TABLE "long_term_plans" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "special_educator_id" TEXT NOT NULL,
    "diagnosis" TEXT,
    "suspected_ld" TEXT,
    "learning_strengths" TEXT[],
    "challenge_areas" TEXT[],
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "duration_months" INTEGER NOT NULL,
    "domains" "Domain"[],
    "review_cycle" "ReviewCycle" NOT NULL DEFAULT 'QUARTERLY',
    "last_review_date" TIMESTAMP(3),
    "next_review_date" TIMESTAMP(3) NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "long_term_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "long_term_goals" (
    "id" TEXT NOT NULL,
    "long_term_plan_id" TEXT NOT NULL,
    "goal_statement" TEXT NOT NULL,
    "domain" "Domain" NOT NULL,
    "target_accuracy" INTEGER NOT NULL DEFAULT 80,
    "order" INTEGER NOT NULL,
    "is_achieved" BOOLEAN NOT NULL DEFAULT false,
    "achieved_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "long_term_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "short_term_plans" (
    "id" TEXT NOT NULL,
    "long_term_plan_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "special_educator_id" TEXT NOT NULL,
    "linked_long_term_goal_id" TEXT,
    "linked_goal_statement" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "duration_weeks" INTEGER NOT NULL,
    "stp_goal" TEXT NOT NULL,
    "intervention_strategy" TEXT[],
    "weekly_probes" BOOLEAN NOT NULL DEFAULT true,
    "target_accuracy" INTEGER NOT NULL DEFAULT 80,
    "prompt_reduction" BOOLEAN NOT NULL DEFAULT true,
    "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "progress_percentage" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "short_term_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "short_term_sub_goals" (
    "id" TEXT NOT NULL,
    "short_term_plan_id" TEXT NOT NULL,
    "goal_statement" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "is_achieved" BOOLEAN NOT NULL DEFAULT false,
    "achieved_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "short_term_sub_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_lesson_plans" (
    "id" TEXT NOT NULL,
    "short_term_plan_id" TEXT,
    "student_id" TEXT NOT NULL,
    "special_educator_id" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "session_date" TIMESTAMP(3) NOT NULL,
    "topics" TEXT NOT NULL,
    "areas_of_remediation" TEXT[],
    "average_time" INTEGER,
    "actual_time" INTEGER,
    "motivation_strategy" TEXT,
    "resources_used" TEXT[],
    "outcome" TEXT,
    "status" "LessonStatus" NOT NULL DEFAULT 'PLANNED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_lesson_plans_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "long_term_plans" ADD CONSTRAINT "long_term_plans_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "long_term_plans" ADD CONSTRAINT "long_term_plans_special_educator_id_fkey" FOREIGN KEY ("special_educator_id") REFERENCES "special_educator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "long_term_goals" ADD CONSTRAINT "long_term_goals_long_term_plan_id_fkey" FOREIGN KEY ("long_term_plan_id") REFERENCES "long_term_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_term_plans" ADD CONSTRAINT "short_term_plans_long_term_plan_id_fkey" FOREIGN KEY ("long_term_plan_id") REFERENCES "long_term_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_term_plans" ADD CONSTRAINT "short_term_plans_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_term_plans" ADD CONSTRAINT "short_term_plans_special_educator_id_fkey" FOREIGN KEY ("special_educator_id") REFERENCES "special_educator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_term_sub_goals" ADD CONSTRAINT "short_term_sub_goals_short_term_plan_id_fkey" FOREIGN KEY ("short_term_plan_id") REFERENCES "short_term_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_lesson_plans" ADD CONSTRAINT "weekly_lesson_plans_short_term_plan_id_fkey" FOREIGN KEY ("short_term_plan_id") REFERENCES "short_term_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_lesson_plans" ADD CONSTRAINT "weekly_lesson_plans_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_lesson_plans" ADD CONSTRAINT "weekly_lesson_plans_special_educator_id_fkey" FOREIGN KEY ("special_educator_id") REFERENCES "special_educator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
