/*
  Warnings:

  - The primary key for the `Calender_date` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Calender_date` table. The data in that column could be lost. The data in that column will be cast from `Decimal(19,0)` to `BigInt`.

*/

ALTER TABLE "Calender_date"
  ALTER COLUMN "id" TYPE BIGINT;

CREATE SEQUENCE IF NOT EXISTS "Calender_date_id_seq"
  OWNED BY "Calender_date"."id";

SELECT setval(
  '"Calender_date_id_seq"',
  GREATEST((SELECT COALESCE(MAX("id"), 0) FROM "Calender_date"), 1)
);

ALTER TABLE "Calender_date"
  ALTER COLUMN "id"
  SET DEFAULT nextval('"Calender_date_id_seq"');
