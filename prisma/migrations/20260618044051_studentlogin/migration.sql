/*
  Warnings:

  - A unique constraint covering the columns `[stdRegNo]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `student` ADD COLUMN `password` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Student_stdRegNo_key` ON `Student`(`stdRegNo`);
