/*
  Warnings:

  - Added the required column `classId` to the `MonthlyExamResult` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add the column as nullable first
ALTER TABLE "MonthlyExamResult" ADD COLUMN     "classId" TEXT;

-- Step 2: Populate classId for existing rows from the related Student record
UPDATE "MonthlyExamResult" SET "classId" = "Student"."classId"
FROM "Student"
WHERE "MonthlyExamResult"."studentId" = "Student"."id";

-- Step 3: Now make the column NOT NULL (all 390 rows should have a value now)
ALTER TABLE "MonthlyExamResult" ALTER COLUMN "classId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "MonthlyExamResult" ADD CONSTRAINT "MonthlyExamResult_classId_fkey" FOREIGN KEY ("classId") REFERENCES "StdClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;