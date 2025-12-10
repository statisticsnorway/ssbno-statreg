/*
  Warnings:

  - You are about to drop the column `previous_topic_codes` on the `Statistic` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Statistic" DROP COLUMN "previous_topic_codes",
ADD COLUMN     "legacy_topic_codes" VARCHAR(255);
