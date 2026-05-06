-- CreateTable
CREATE TABLE "Passport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNCLAIMED',
    "ownerEmail" TEXT,
    "name" TEXT,
    "description" TEXT,
    "tags" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" DATETIME
);

-- CreateTable
CREATE TABLE "ClaimToken" (
    "token" TEXT NOT NULL PRIMARY KEY,
    "passportId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    CONSTRAINT "ClaimToken_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "Passport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
