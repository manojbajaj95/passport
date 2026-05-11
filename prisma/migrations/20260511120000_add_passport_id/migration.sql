-- Add internal id column (stable primary key, decoupled from the DID credential)
ALTER TABLE "Passport" ADD COLUMN "id" TEXT;
UPDATE "Passport" SET "id" = gen_random_uuid()::text;
ALTER TABLE "Passport" ALTER COLUMN "id" SET NOT NULL;

-- Drop FK constraints that referenced Passport(did) as PK
ALTER TABLE "ClaimToken" DROP CONSTRAINT "ClaimToken_did_fkey";
ALTER TABLE "Nonce" DROP CONSTRAINT "Nonce_did_fkey";

-- Swap primary key from did → id
ALTER TABLE "Passport" DROP CONSTRAINT "Passport_pkey";
ALTER TABLE "Passport" ADD CONSTRAINT "Passport_pkey" PRIMARY KEY ("id");

-- did remains unique (still the cryptographic credential, just no longer the PK)
CREATE UNIQUE INDEX "Passport_did_key" ON "Passport"("did");

-- Re-add FK constraints (now referencing the unique did column)
ALTER TABLE "ClaimToken" ADD CONSTRAINT "ClaimToken_did_fkey" FOREIGN KEY ("did") REFERENCES "Passport"("did") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Nonce" ADD CONSTRAINT "Nonce_did_fkey" FOREIGN KEY ("did") REFERENCES "Passport"("did") ON DELETE RESTRICT ON UPDATE CASCADE;
