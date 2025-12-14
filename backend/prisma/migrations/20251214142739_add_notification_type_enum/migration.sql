/*
  Warnings:

  - Changed the type of `type` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('STUDENT_ASSIGNED', 'STUDENT_UNASSIGNED', 'ASSESSMENT_CREATED', 'ASSESSMENT_COMPLETED', 'ASSESSMENT_REVIEWED', 'IEP_GOAL_CREATED', 'IEP_GOAL_UPDATED', 'IEP_GOAL_ACHIEVED', 'HOMEWORK_ASSIGNED', 'HOMEWORK_SUBMITTED', 'HOMEWORK_REVIEWED', 'REPORT_SUBMITTED', 'REPORT_APPROVED', 'REPORT_REJECTED', 'CONCERN_SUBMITTED', 'CONCERN_RESPONDED', 'LESSON_PLAN_CREATED', 'LESSON_PLAN_UPDATED', 'DOCUMENT_UPLOADED', 'ACCOUNT_CREATED', 'ROLE_CHANGED');

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_userId_fkey";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "type",
ADD COLUMN     "type" "NotificationType" NOT NULL;

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
