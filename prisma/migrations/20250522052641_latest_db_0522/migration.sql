-- CreateTable
CREATE TABLE `Room` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(50) NOT NULL,
    `code` BIGINT NOT NULL,
    `is_closed` BOOLEAN NOT NULL DEFAULT false,
    `file` LONGBLOB NULL,
    `file_type` VARCHAR(191) NULL,
    `file_name` VARCHAR(191) NULL,
    `created_at` VARCHAR(25) NOT NULL,
    `creator_id` VARCHAR(191) NULL,

    UNIQUE INDEX `Room_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
