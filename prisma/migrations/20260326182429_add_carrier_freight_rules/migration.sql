-- CreateTable
CREATE TABLE "CarrierFreightRule" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serviceCode" TEXT,
    "minWeightGrams" INTEGER NOT NULL DEFAULT 0,
    "maxWeightGrams" INTEGER NOT NULL,
    "minLengthCm" INTEGER NOT NULL DEFAULT 0,
    "maxLengthCm" INTEGER NOT NULL,
    "minWidthCm" INTEGER NOT NULL DEFAULT 0,
    "maxWidthCm" INTEGER NOT NULL,
    "minHeightCm" INTEGER NOT NULL DEFAULT 0,
    "maxHeightCm" INTEGER NOT NULL,
    "baseFreightCostInCents" INTEGER NOT NULL,
    "additionalCostPerKgInCents" INTEGER NOT NULL DEFAULT 0,
    "deliveryDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarrierFreightRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CarrierFreightRule_carrierId_idx" ON "CarrierFreightRule"("carrierId");

-- AddForeignKey
ALTER TABLE "CarrierFreightRule" ADD CONSTRAINT "CarrierFreightRule_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
