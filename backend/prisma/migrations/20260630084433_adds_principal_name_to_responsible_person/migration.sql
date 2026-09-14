/*
  Warnings:

  - A unique constraint covering the columns `[principalName]` on the table `ResponsiblePerson` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "statreg"."ResponsiblePerson" ADD COLUMN     "principalName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ResponsiblePerson_principalName_key" ON "statreg"."ResponsiblePerson"("principalName");
