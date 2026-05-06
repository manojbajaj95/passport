-- CreateEnum
CREATE TYPE "PassportStatus" AS ENUM ('UNCLAIMED', 'CLAIMED', 'REVOKED');

-- CreateTable
CREATE TABLE "Passport" (
    "id" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "status" "PassportStatus" NOT NULL DEFAULT 'UNCLAIMED',
    "ownerEmail" TEXT,
    "name" TEXT,
    "description" TEXT,
    "tags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "Passport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimToken" (
    "token" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "ClaimToken_pkey" PRIMARY KEY ("token")
);

-- AddForeignKey
ALTER TABLE "ClaimToken" ADD CONSTRAINT "ClaimToken_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "Passport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
