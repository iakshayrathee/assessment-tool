-- CreateTable
CREATE TABLE "school_assignments" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "specialEducatorId" TEXT,
    "superSpecialEducatorId" TEXT,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_assignments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "school_assignments" ADD CONSTRAINT "school_assignments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_assignments" ADD CONSTRAINT "school_assignments_specialEducatorId_fkey" FOREIGN KEY ("specialEducatorId") REFERENCES "special_educator_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_assignments" ADD CONSTRAINT "school_assignments_superSpecialEducatorId_fkey" FOREIGN KEY ("superSpecialEducatorId") REFERENCES "super_special_educator_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
