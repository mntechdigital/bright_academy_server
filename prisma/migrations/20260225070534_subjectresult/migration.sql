/*
  Warnings:

  - You are about to drop the column `fullMarks` on the `monthlyexamresult` table. All the data in the column will be lost.
  - You are about to drop the column `gradePoint` on the `monthlyexamresult` table. All the data in the column will be lost.
  - You are about to drop the column `highestMark` on the `monthlyexamresult` table. All the data in the column will be lost.
  - You are about to drop the column `marksObtained` on the `monthlyexamresult` table. All the data in the column will be lost.
  - You are about to drop the column `point` on the `monthlyexamresult` table. All the data in the column will be lost.
  - You are about to drop the column `preenst` on the `monthlyexamresult` table. All the data in the column will be lost.
  - Added the required column `present` to the `MonthlyExamResult` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `monthlyexamresult` DROP FOREIGN KEY `MonthlyExamResult_subjectId_fkey`;

-- DropIndex
DROP INDEX `MonthlyExamResult_subjectId_fkey` ON `monthlyexamresult`;

-- AlterTable
ALTER TABLE `monthlyexamresult` DROP COLUMN `fullMarks`,
    DROP COLUMN `gradePoint`,
    DROP COLUMN `highestMark`,
    DROP COLUMN `marksObtained`,
    DROP COLUMN `point`,
    DROP COLUMN `preenst`,
    ADD COLUMN `present` INTEGER NOT NULL,
    MODIFY `subjectId` VARCHAR(191) NULL,
    MODIFY `absent` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `SubjectResult` (
    `id` VARCHAR(191) NOT NULL,
    `subjectName` VARCHAR(191) NOT NULL,
    `marks` INTEGER NOT NULL,
    `examResultId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MonthlyExamResult` ADD CONSTRAINT `MonthlyExamResult_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubjectResult` ADD CONSTRAINT `SubjectResult_examResultId_fkey` FOREIGN KEY (`examResultId`) REFERENCES `MonthlyExamResult`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
