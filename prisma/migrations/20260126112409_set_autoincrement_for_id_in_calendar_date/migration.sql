/*
  Warnings:

  - The primary key for the `Calender_date` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Calender_date` table. The data in that column could be lost. The data in that column will be cast from `Decimal(19,0)` to `BigInt`.

*/
-- AlterTable
-- CREATE SEQUENCE calender_date_id_seq;
-- ALTER TABLE "Calender_date" DROP CONSTRAINT "sys_c0023875",
-- RENAME CONSTRAINT "sys_c0023875" TO "Calender_date_pkey",
-- ALTER COLUMN "id" SET DEFAULT nextval('calender_date_id_seq'),
-- ALTER COLUMN "id" SET DATA TYPE BIGSERIAL,
-- ADD CONSTRAINT "Calender_date_pkey" PRIMARY KEY ("id");
-- ALTER SEQUENCE calender_date_id_seq OWNED BY "Calender_date"."id";


-- 1. Ensure correct type
ALTER TABLE "Calender_date"
  ALTER COLUMN "id" TYPE BIGINT;

-- 2. Create a sequence owned by the column
CREATE SEQUENCE IF NOT EXISTS "Calender_date_id_seq"
  OWNED BY "Calender_date"."id";

-- 3. Sync sequence with existing data
SELECT setval(
  '"Calender_date_id_seq"',
  GREATEST((SELECT COALESCE(MAX("id"), 0) FROM "Calender_date"), 1)
);

-- 4. Attach sequence as default
ALTER TABLE "Calender_date"
  ALTER COLUMN "id"
  SET DEFAULT nextval('"Calender_date_id_seq"');
