-- Add nullable year for MonthlyExamResult.month semantics (exam month stored in month field; year stored separately).
-- Temporary rule today: year filtering/ranking may use createdAt UTC year. After rollout, backfill and switch reads/writes to this column.

ALTER TABLE "MonthlyExamResult" ADD COLUMN "year" INTEGER;

-- Backfill from stored creation timestamp (UTC) as documented temporary source.
UPDATE "MonthlyExamResult"
SET "year" = EXTRACT(YEAR FROM ("createdAt" AT TIME ZONE 'UTC'))::INTEGER
WHERE "year" IS NULL;