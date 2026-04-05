CREATE TYPE "CustomerDocumentType" AS ENUM ('CPF', 'CNPJ', 'PASSPORT', 'OTHER');

ALTER TABLE "Customer"
ADD COLUMN "googleId" TEXT,
ADD COLUMN "documentType" "CustomerDocumentType" NOT NULL DEFAULT 'CPF';

ALTER TABLE "Address"
ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "CustomerContact" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerContact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Customer_googleId_key" ON "Customer"("googleId");
CREATE INDEX "CustomerContact_customerId_idx" ON "CustomerContact"("customerId");

ALTER TABLE "CustomerContact" ADD CONSTRAINT "CustomerContact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
