-- CreateTable
CREATE TABLE `WeeklyMarksSheet` (
    `id` VARCHAR(191) NOT NULL,
    `month` VARCHAR(191) NOT NULL,
    `week` VARCHAR(191) NOT NULL,
    `publishedDate` VARCHAR(191) NOT NULL,
    `year` VARCHAR(191) NOT NULL,
    `stdClassId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `totalMarks` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WeeklyMarksSheet` ADD CONSTRAINT `WeeklyMarksSheet_stdClassId_fkey` FOREIGN KEY (`stdClassId`) REFERENCES `StdClass`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WeeklyMarksSheet` ADD CONSTRAINT `WeeklyMarksSheet_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `Section`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WeeklyMarksSheet` ADD CONSTRAINT `WeeklyMarksSheet_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
