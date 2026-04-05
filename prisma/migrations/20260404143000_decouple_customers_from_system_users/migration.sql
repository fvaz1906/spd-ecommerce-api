ALTER TABLE "Customer"
ADD COLUMN "name" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Customer" AS c
SET
  "name" = u."name",
  "email" = u."email",
  "passwordHash" = u."passwordHash",
  "isActive" = u."isActive"
FROM "User" AS u
WHERE c."userId" = u."id";

UPDATE "Customer"
SET
  "name" = COALESCE("name", 'Cliente sem nome'),
  "email" = COALESCE("email", CONCAT('customer+', "id", '@spd.local'));

ALTER TABLE "Customer"
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
