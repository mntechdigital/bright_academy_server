-- AlterTable
ALTER TABLE `monthlyexamresult` ADD COLUMN `batchId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `MonthlyExamResult` ADD CONSTRAINT `MonthlyExamResult_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `Batch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
