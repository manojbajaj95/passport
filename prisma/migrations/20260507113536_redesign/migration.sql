-- DropForeignKey
ALTER TABLE "ClaimToken" DROP CONSTRAINT "ClaimToken_passportId_fkey";

-- AlterTable
ALTER TABLE "ClaimToken" DROP COLUMN "passportId",
ADD COLUMN     "did" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Passport" DROP CONSTRAINT "Passport_pkey",
DROP COLUMN "id",
DROP COLUMN "tags",
ADD COLUMN     "did" TEXT NOT NULL,
ADD COLUMN     "handle" TEXT NOT NULL,
ADD CONSTRAINT "Passport_pkey" PRIMARY KEY ("did");

-- CreateTable
CREATE TABLE "Nonce" (
    "id" TEXT NOT NULL,
    "did" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "Nonce_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Nonce_nonce_key" ON "Nonce"("nonce");

-- CreateIndex
CREATE UNIQUE INDEX "Passport_handle_key" ON "Passport"("handle");

-- AddForeignKey
ALTER TABLE "ClaimToken" ADD CONSTRAINT "ClaimToken_did_fkey" FOREIGN KEY ("did") REFERENCES "Passport"("did") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nonce" ADD CONSTRAINT "Nonce_did_fkey" FOREIGN KEY ("did") REFERENCES "Passport"("did") ON DELETE RESTRICT ON UPDATE CASCADE;
