-- Migration: Update students.academic_status to VARCHAR(50) to support configured academic statuses
ALTER TABLE `students` MODIFY COLUMN `academic_status` VARCHAR(50) NOT NULL DEFAULT 'Regular';
UPDATE `students` SET `academic_status` = 'Regular'
WHERE `academic_status` NOT IN ('Regular', 'Irregular', 'Returnee', 'Transferee', 'Shiftee', 'New Student')
   OR `academic_status` = ''
   OR `academic_status` IS NULL;
