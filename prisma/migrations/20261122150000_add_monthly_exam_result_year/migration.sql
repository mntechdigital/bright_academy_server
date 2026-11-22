-- AlterTable
ALTER TABLE "MonthlyExamResult" ADD COLUMN "year" INTEGER;
ALTER TABLE "MonthlyExamResult" ADD COLUMN "publishedDate" TIMESTAMP(3);

-- Backfill year from createdAt UTC year (temporary legacy source; new rows should store form Year).
UPDATE "MonthlyExamResult"
SET "year" = EXTRACT(YEAR FROM ("createdAt" AT TIME ZONE 'UTC'))::INTEGER
WHERE "year" IS NULL;