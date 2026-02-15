/*
  Warnings:

  - You are about to drop the column `classId` on the `section` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `section` DROP FOREIGN KEY `Section_classId_fkey`;

-- DropIndex
DROP INDEX `Section_classId_idx` ON `section`;

-- AlterTable
ALTER TABLE `section` DROP COLUMN `classId`;

-- CreateTable
CREATE TABLE `_ClassSections` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_ClassSections_AB_unique`(`A`, `B`),
    INDEX `_ClassSections_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_ClassSections` ADD CONSTRAINT `_ClassSections_A_fkey` FOREIGN KEY (`A`) REFERENCES `Section`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ClassSections` ADD CONSTRAINT `_ClassSections_B_fkey` FOREIGN KEY (`B`) REFERENCES `StdClass`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
