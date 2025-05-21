/*
  Warnings:

  - You are about to drop the column `is_selected` on the `question` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `question` DROP COLUMN `is_selected`,
    ADD COLUMN `is_answered` BOOLEAN NOT NULL DEFAULT false;
