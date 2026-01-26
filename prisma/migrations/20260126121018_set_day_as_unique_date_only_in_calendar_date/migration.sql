/*
  Warnings:

  - A unique constraint covering the columns `[day]` on the table `Calender_date` will be added. If there are existing duplicate values, this will fail.

*/
-- 1️⃣ Rename old primary key constraint (if needed)
ALTER TABLE "Calender_date"
  RENAME CONSTRAINT "sys_c0023875" TO "Calender_date_pkey";

-- 2️⃣ Change the 'day' column type to DATE
ALTER TABLE "Calender_date"
  ALTER COLUMN "day" TYPE DATE USING "day"::DATE;

-- 3️⃣ Add a unique constraint on 'day'
ALTER TABLE "Calender_date"
  ADD CONSTRAINT "Calender_date_day_key" UNIQUE ("day");
