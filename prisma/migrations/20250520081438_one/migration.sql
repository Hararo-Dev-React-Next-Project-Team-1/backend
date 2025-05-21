/*
  Warnings:

  - You are about to drop the column `visitorId` on the `Question` table. All the data in the column will be lost.
  - Added the required column `created_at` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creator_id` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Question` DROP COLUMN `visitorId`,
    ADD COLUMN `created_at` VARCHAR(25) NOT NULL,
    ADD COLUMN `creator_id` VARCHAR(36) NOT NULL,
    ADD COLUMN `is_selected` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `likes` BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Room` ADD COLUMN `creator_id` VARCHAR(191) NULL,
    ADD COLUMN `file_name` VARCHAR(191) NULL,
    ADD COLUMN `file_type` VARCHAR(191) NULL;
