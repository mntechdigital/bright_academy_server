-- AlterTable
ALTER TABLE `weeklymarkssheet` ADD COLUMN `batchId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `WeeklyMarksSheet` ADD CONSTRAINT `WeeklyMarksSheet_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `Batch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
