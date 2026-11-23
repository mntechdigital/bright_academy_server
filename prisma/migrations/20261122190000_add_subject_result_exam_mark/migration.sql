-- AlterTable
ALTER TABLE "SubjectResult" ADD COLUMN IF NOT EXISTS "examMark" INTEGER;

-- Backfill legacy ICT exam marks
UPDATE "SubjectResult" SET "examMark" = "ictExamMark" WHERE "examMark" IS NULL AND "ictExamMark" IS NOT NULL;
