/*
  Warnings:

  - A unique constraint covering the columns `[stdClassId,batchId,subjectId,studentId,week,year]` on the table `WeeklyMarksSheet` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "WeeklyMarksSheet_studentId_subjectId_week_year_key";

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyMarksSheet_stdClassId_batchId_subjectId_studentId_wee_key" ON "WeeklyMarksSheet"("stdClassId", "batchId", "subjectId", "studentId", "week", "year");
