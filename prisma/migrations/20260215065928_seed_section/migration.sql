-- DropForeignKey
ALTER TABLE `student` DROP FOREIGN KEY `Student_classId_fkey`;

-- DropForeignKey
ALTER TABLE `student` DROP FOREIGN KEY `Student_sectionId_fkey`;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_stdClass_fkey` FOREIGN KEY (`classId`) REFERENCES `StdClass`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_section_fkey` FOREIGN KEY (`sectionId`) REFERENCES `Section`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `section` RENAME INDEX `Section_classId_fkey` TO `Section_classId_idx`;
