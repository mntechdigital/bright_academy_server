-- Add sortOrder to Subject
ALTER TABLE "Subject" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill: number each class's subjects by current creation order so the
-- existing display order is preserved.
UPDATE "Subject"
SET "sortOrder" = t.rn - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "classId" ORDER BY "createdAt" ASC, id ASC) AS rn
  FROM "Subject"
) t
WHERE "Subject".id = t.id;
