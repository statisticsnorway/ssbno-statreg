/*
  Warnings:

  - You are about to drop the column `email` on the `ResponsiblePerson` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `ResponsiblePerson` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "statreg"."ResponsiblePerson_email_key";

-- DropIndex
DROP INDEX "statreg"."ResponsiblePerson_username_key";

-- AlterTable
ALTER TABLE "statreg"."ResponsiblePerson" DROP COLUMN "email",
DROP COLUMN "username";
