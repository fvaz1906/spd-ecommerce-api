-- AlterTable
ALTER TABLE "SupplierAddress" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "SupplierContact" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
