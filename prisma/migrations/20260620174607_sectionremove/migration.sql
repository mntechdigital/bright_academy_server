/*
  Warnings:

  - You are about to drop the column `sectionId` on the `student` table. All the data in the column will be lost.
  - You are about to drop the column `sectionId` on the `weeklymarkssheet` table. All the data in the column will be lost.
  - You are about to drop the `_classsections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `section` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_classsections` DROP FOREIGN KEY `_ClassSections_A_fkey`;

-- DropForeignKey
ALTER TABLE `_classsections` DROP FOREIGN KEY `_ClassSections_B_fkey`;

-- DropForeignKey
ALTER TABLE `student` DROP FOREIGN KEY `Student_section_fkey`;

-- DropForeignKey
ALTER TABLE `weeklymarkssheet` DROP FOREIGN KEY `WeeklyMarksSheet_sectionId_fkey`;

-- DropIndex
DROP INDEX `Student_section_fkey` ON `student`;

-- DropIndex
DROP INDEX `WeeklyMarksSheet_sectionId_fkey` ON `weeklymarkssheet`;

-- AlterTable
ALTER TABLE `student` DROP COLUMN `sectionId`;

-- AlterTable
ALTER TABLE `weeklymarkssheet` DROP COLUMN `sectionId`;

-- DropTable
DROP TABLE `_classsections`;

-- DropTable
DROP TABLE `section`;
