/*
  Warnings:

  - You are about to drop the column `email` on the `student` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `student` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `student` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `student` table. All the data in the column will be lost.
  - Added the required column `address` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classId` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parentPhone` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sectionId` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Student_email_key` ON `student`;

-- DropIndex
DROP INDEX `Student_phone_key` ON `student`;

-- AlterTable
ALTER TABLE `student` DROP COLUMN `email`,
    DROP COLUMN `firstName`,
    DROP COLUMN `lastName`,
    DROP COLUMN `phone`,
    ADD COLUMN `address` VARCHAR(191) NOT NULL,
    ADD COLUMN `classId` INTEGER NOT NULL,
    ADD COLUMN `gender` VARCHAR(191) NOT NULL,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `parentPhone` VARCHAR(191) NOT NULL,
    ADD COLUMN `sectionId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `Section` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sectionName` VARCHAR(191) NOT NULL,
    `classId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Section_classId_sectionName_key`(`classId`, `sectionName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `Section`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Section` ADD CONSTRAINT `Section_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
