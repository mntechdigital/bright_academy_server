/*
  Warnings:

  - Added the required column `fullMarks` to the `SubjectResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grade` to the `SubjectResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `highestMark` to the `SubjectResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `point` to the `SubjectResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `subjectresult` ADD COLUMN `fullMarks` INTEGER NOT NULL,
    ADD COLUMN `grade` VARCHAR(191) NOT NULL,
    ADD COLUMN `highestMark` INTEGER NOT NULL,
    ADD COLUMN `point` DOUBLE NOT NULL;
