/*
  Warnings:

  - You are about to drop the `question` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `question` DROP FOREIGN KEY `Question_room_id_fkey`;

-- DropTable
DROP TABLE `question`;

-- CreateTable
CREATE TABLE `Question` (
    `question_id` BIGINT NOT NULL AUTO_INCREMENT,
    `room_id` BIGINT NOT NULL,
    `creator_id` VARCHAR(36) NOT NULL,
    `created_at` VARCHAR(25) NOT NULL,
    `text` TEXT NOT NULL,
    `likes` BIGINT NOT NULL DEFAULT 0,
    `is_answered` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`question_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
