/*
  Warnings:

  - A unique constraint covering the columns `[sectionName]` on the table `Section` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `section` DROP FOREIGN KEY `Section_classId_fkey`;

-- DropIndex
DROP INDEX `Section_classId_sectionName_key` ON `section`;

-- AlterTable
ALTER TABLE `section` MODIFY `classId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Section_sectionName_key` ON `Section`(`sectionName`);

-- AddForeignKey
ALTER TABLE `section` ADD CONSTRAINT `Section_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `StdClass`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

