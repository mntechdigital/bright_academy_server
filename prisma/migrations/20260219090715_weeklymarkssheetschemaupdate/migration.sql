/*
  Warnings:

  - A unique constraint covering the columns `[studentId,subjectId,week,year]` on the table `WeeklyMarksSheet` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `weeklymarkssheet` ADD COLUMN `obtainedMarks` INTEGER NULL,
    ADD COLUMN `studentId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `WeeklyMarksSheet_studentId_subjectId_week_year_key` ON `WeeklyMarksSheet`(`studentId`, `subjectId`, `week`, `year`);

-- AddForeignKey
ALTER TABLE `WeeklyMarksSheet` ADD CONSTRAINT `WeeklyMarksSheet_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
