/*
  Warnings:

  - A unique constraint covering the columns `[regNo]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Teacher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `regNo` to the `Teacher` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Student_stdRegNo_key` ON `student`;

-- AlterTable
ALTER TABLE `teacher` ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `regNo` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Teacher_regNo_key` ON `Teacher`(`regNo`);
