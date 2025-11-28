/*
  Warnings:

  - You are about to drop the column `navn` on the `Division` table. All the data in the column will be lost.
  - Added the required column `name` to the `Division` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Division" DROP COLUMN "navn",
ADD COLUMN     "name" VARCHAR(100) NOT NULL;
