/*
  Warnings:

  - Made the column `principalName` on table `ResponsiblePerson` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "statreg"."ResponsiblePerson" ALTER COLUMN "principalName" SET NOT NULL;
