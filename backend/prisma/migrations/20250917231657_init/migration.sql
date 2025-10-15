-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPER_SPECIAL_EDUCATOR', 'SPECIAL_EDUCATOR', 'CENTER', 'PARENT', 'SCHOOL_VIEWER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED');

-- CreateEnum
CREATE TYPE "IEPGoalStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'ACHIEVED', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('INTAKE', 'ASSESSMENT', 'IEP', 'PROGRESS');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "super_special_educator_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "address" TEXT,
    "primaryLanguage" TEXT,
    "secondaryLanguages" TEXT[],
    "highestQualification" TEXT,
    "fieldOfStudy" TEXT,
    "institutionName" TEXT,
    "yearOfGraduation" INTEGER,
    "rciCertified" BOOLEAN NOT NULL DEFAULT false,
    "rciValidityDate" TIMESTAMP(3),
    "specialEdQualification" TEXT,
    "specializationAreas" TEXT[],
    "yearsOfExperience" INTEGER,
    "experienceTypes" TEXT[],
    "maxGroupSize" INTEGER,
    "currentWorkLocations" TEXT[],
    "ldTypesHandled" TEXT[],
    "gradeLevelsServed" TEXT[],
    "assessmentTools" TEXT,
    "assistiveTechProficiency" TEXT[],
    "areasOfInterest" TEXT[],
    "consentToShare" BOOLEAN NOT NULL DEFAULT false,
    "agreementToPolicies" BOOLEAN NOT NULL DEFAULT false,
    "personalStatement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "super_special_educator_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "special_educator_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "address" TEXT,
    "primaryLanguage" TEXT,
    "secondaryLanguages" TEXT[],
    "highestQualification" TEXT,
    "fieldOfStudy" TEXT,
    "institutionName" TEXT,
    "yearOfGraduation" INTEGER,
    "rciCertified" BOOLEAN NOT NULL DEFAULT false,
    "rciValidityDate" TIMESTAMP(3),
    "specialEdQualification" TEXT,
    "specializationAreas" TEXT[],
    "yearsOfExperience" INTEGER,
    "experienceTypes" TEXT[],
    "maxGroupSize" INTEGER,
    "currentWorkLocations" TEXT[],
    "ldTypesHandled" TEXT[],
    "gradeLevelsServed" TEXT[],
    "assessmentTools" TEXT,
    "assistiveTechProficiency" TEXT[],
    "areasOfInterest" TEXT[],
    "consentToShare" BOOLEAN NOT NULL DEFAULT false,
    "agreementToPolicies" BOOLEAN NOT NULL DEFAULT false,
    "personalStatement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "special_educator_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "center_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "centerName" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "contactPerson" TEXT,
    "operatingHours" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "center_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "emergencyContact" TEXT,
    "relationship" TEXT NOT NULL DEFAULT 'Parent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_viewer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "position" TEXT,
    "phone" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_viewer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "principalName" TEXT,
    "centerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "grade" TEXT NOT NULL,
    "motherTongue" TEXT,
    "syllabus" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "centerId" TEXT NOT NULL,
    "schoolId" TEXT,
    "parentId" TEXT NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_assignments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "specialEducatorId" TEXT NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "center_assignments" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "specialEducatorId" TEXT,
    "superSpecialEducatorId" TEXT,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "center_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intake_forms" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "specialEducatorId" TEXT NOT NULL,
    "address" TEXT,
    "familyIncome" TEXT,
    "familyType" TEXT,
    "digitalResourcesAtHome" BOOLEAN,
    "dailyDigitalUse" INTEGER,
    "enjoysSchool" BOOLEAN,
    "studyAssistant" TEXT,
    "externalAcademicSupport" BOOLEAN,
    "enjoysReading" BOOLEAN,
    "dailyParentChildTime" INTEGER,
    "childType" TEXT,
    "fatherName" TEXT,
    "motherName" TEXT,
    "guardianName" TEXT,
    "pregnancyNormal" BOOLEAN,
    "medicationsDuringPregnancy" TEXT,
    "miscarriagesAbortions" BOOLEAN,
    "fullTermOrPremature" TEXT,
    "deliveryType" TEXT,
    "breastFed" BOOLEAN,
    "infantJaundice" BOOLEAN,
    "incubation" BOOLEAN,
    "immunizationDone" BOOLEAN,
    "consanguineousMarriage" BOOLEAN,
    "birthCry" TEXT,
    "delayInNeckStanding" BOOLEAN,
    "delayInNeckStandingDetails" TEXT,
    "ageOfWalking" INTEGER,
    "ageOfTwoWordSpeech" INTEGER,
    "healthConcerns" TEXT,
    "epilepticHistory" BOOLEAN,
    "onMedication" BOOLEAN,
    "medicationDetails" TEXT,
    "asthmaWheezing" BOOLEAN,
    "wearsGlasses" BOOLEAN,
    "visionTestDone" BOOLEAN,
    "hearingTestDone" BOOLEAN,
    "attendedPreschool" BOOLEAN,
    "repeatedGrades" BOOLEAN,
    "whichGradeRepeated" TEXT,
    "dominantWritingHand" TEXT,
    "strugglesInLanguages" BOOLEAN,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intake_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "specialEducatorId" TEXT NOT NULL,
    "readingObservations" TEXT,
    "readingLevel" TEXT,
    "readingFiles" TEXT[],
    "writingObservations" TEXT,
    "writingLevel" TEXT,
    "writingFiles" TEXT[],
    "mathObservations" TEXT,
    "mathLevel" TEXT,
    "mathFiles" TEXT[],
    "vpObservations" TEXT,
    "vpLevel" TEXT,
    "vpFiles" TEXT[],
    "motorObservations" TEXT,
    "motorLevel" TEXT,
    "motorFiles" TEXT[],
    "attentionObservations" TEXT,
    "attentionLevel" TEXT,
    "attentionFiles" TEXT[],
    "assessmentType" TEXT NOT NULL DEFAULT 'Initial',
    "status" "AssessmentStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iep_goals" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "specialEducatorId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "goalStatement" TEXT NOT NULL,
    "strategy" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "expectedOutcome" TEXT,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "status" "IEPGoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iep_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iep_progress" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "updateDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER NOT NULL,
    "notes" TEXT,
    "rating" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "iep_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_notes" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "specialEducatorId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "activities" TEXT NOT NULL,
    "observations" TEXT,
    "progress" TEXT,
    "nextSteps" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "specialEducatorId" TEXT NOT NULL,
    "superSpecialEducatorId" TEXT,
    "type" "ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "recommendations" TEXT,
    "educatorSignature" TEXT,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_concerns" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_concerns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_documents" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_documents" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_userId_key" ON "admin_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "super_special_educator_profiles_userId_key" ON "super_special_educator_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "special_educator_profiles_userId_key" ON "special_educator_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "center_profiles_userId_key" ON "center_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "parent_profiles_userId_key" ON "parent_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "school_viewer_profiles_userId_key" ON "school_viewer_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "student_assignments_studentId_specialEducatorId_key" ON "student_assignments"("studentId", "specialEducatorId");

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "super_special_educator_profiles" ADD CONSTRAINT "super_special_educator_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_educator_profiles" ADD CONSTRAINT "special_educator_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "center_profiles" ADD CONSTRAINT "center_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_profiles" ADD CONSTRAINT "parent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_viewer_profiles" ADD CONSTRAINT "school_viewer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_viewer_profiles" ADD CONSTRAINT "school_viewer_profiles_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "center_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "center_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_assignments" ADD CONSTRAINT "student_assignments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_assignments" ADD CONSTRAINT "student_assignments_specialEducatorId_fkey" FOREIGN KEY ("specialEducatorId") REFERENCES "special_educator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "center_assignments" ADD CONSTRAINT "center_assignments_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "center_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "center_assignments" ADD CONSTRAINT "center_assignments_specialEducatorId_fkey" FOREIGN KEY ("specialEducatorId") REFERENCES "special_educator_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "center_assignments" ADD CONSTRAINT "center_assignments_superSpecialEducatorId_fkey" FOREIGN KEY ("superSpecialEducatorId") REFERENCES "super_special_educator_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_forms" ADD CONSTRAINT "intake_forms_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_forms" ADD CONSTRAINT "intake_forms_specialEducatorId_fkey" FOREIGN KEY ("specialEducatorId") REFERENCES "special_educator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_specialEducatorId_fkey" FOREIGN KEY ("specialEducatorId") REFERENCES "special_educator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iep_goals" ADD CONSTRAINT "iep_goals_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iep_goals" ADD CONSTRAINT "iep_goals_specialEducatorId_fkey" FOREIGN KEY ("specialEducatorId") REFERENCES "special_educator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iep_progress" ADD CONSTRAINT "iep_progress_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "iep_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_notes" ADD CONSTRAINT "session_notes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_notes" ADD CONSTRAINT "session_notes_specialEducatorId_fkey" FOREIGN KEY ("specialEducatorId") REFERENCES "special_educator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_specialEducatorId_fkey" FOREIGN KEY ("specialEducatorId") REFERENCES "special_educator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_superSpecialEducatorId_fkey" FOREIGN KEY ("superSpecialEducatorId") REFERENCES "super_special_educator_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_concerns" ADD CONSTRAINT "parent_concerns_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_documents" ADD CONSTRAINT "parent_documents_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
