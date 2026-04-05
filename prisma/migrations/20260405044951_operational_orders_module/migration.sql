/*
  Warnings:

  - Added the required column `customerEmail` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerName` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('SYSTEM', 'ECOMMERCE', 'MARKETPLACE', 'WHATSAPP');

-- AlterEnum
ALTER TYPE "StockMovementType" ADD VALUE 'FULFILLED';

-- DropForeignKey
ALTER TABLE "public"."Customer" DROP CONSTRAINT "Customer_userId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerDocument" TEXT,
ADD COLUMN     "customerEmail" TEXT NOT NULL,
ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "itemsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "source" "OrderSource" NOT NULL DEFAULT 'SYSTEM';

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "carrierId" TEXT,
ADD COLUMN     "carrierName" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "recipient" TEXT,
ADD COLUMN     "serviceName" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
