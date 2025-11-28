-- AlterTable
ALTER TABLE "iep_documents" ADD COLUMN     "areasOfRemediation" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "status" "IEPStatus" NOT NULL DEFAULT 'DRAFT';
