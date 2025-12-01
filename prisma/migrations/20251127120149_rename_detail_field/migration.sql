/*
  Warnings:

  - You are about to drop the column `detaljniva` on the `Variant` table. All the data in the column will be lost.
  - You are about to drop the column `detaljniva_en` on the `Variant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Variant" DROP COLUMN "detaljniva",
DROP COLUMN "detaljniva_en",
ADD COLUMN     "level_of_detail" VARCHAR(255),
ADD COLUMN     "level_of_detail_en" VARCHAR(255);
