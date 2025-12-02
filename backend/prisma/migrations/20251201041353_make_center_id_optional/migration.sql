-- DropForeignKey
ALTER TABLE "schools" DROP CONSTRAINT "schools_centerId_fkey";

-- AlterTable
ALTER TABLE "schools" ALTER COLUMN "centerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "center_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
