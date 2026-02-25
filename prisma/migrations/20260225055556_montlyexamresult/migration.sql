-- CreateTable
CREATE TABLE `MonthlyExamResult` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `fullMarks` INTEGER NOT NULL,
    `highestMark` INTEGER NOT NULL,
    `marksObtained` INTEGER NOT NULL,
    `point` DOUBLE NOT NULL,
    `grade` VARCHAR(191) NOT NULL,
    `totalMarks` INTEGER NOT NULL,
    `gpa` DOUBLE NOT NULL,
    `gradePoint` VARCHAR(191) NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `preenst` BOOLEAN NOT NULL,
    `absent` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MonthlyExamResult` ADD CONSTRAINT `MonthlyExamResult_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MonthlyExamResult` ADD CONSTRAINT `MonthlyExamResult_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
