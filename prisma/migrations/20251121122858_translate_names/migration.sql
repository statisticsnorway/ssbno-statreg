/*
  Warnings:

  - You are about to drop the column `er_opphort` on the `Variant` table. All the data in the column will be lost.
  - You are about to drop the column `frekvens_id` on the `Variant` table. All the data in the column will be lost.
  - You are about to drop the column `revisjon` on the `Variant` table. All the data in the column will be lost.
  - You are about to drop the column `statistikk_id` on the `Variant` table. All the data in the column will be lost.
  - You are about to drop the `Frekvens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Kalender_dato` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Kontakt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Kortnavn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Publisering` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Regionalt_niva` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Seksjon` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Statistikk` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Statistikk_kontakter` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Statistikk_regionale_nivaer` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `cancelled` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `freq_id` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `revision` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `statistic_id` to the `Variant` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Publisering" DROP CONSTRAINT "fkdb40a13c44a06f71";

-- DropForeignKey
ALTER TABLE "Statistikk" DROP CONSTRAINT "fkfa5cb2137008a78";

-- DropForeignKey
ALTER TABLE "Statistikk" DROP CONSTRAINT "fkfa5cb213b101b242";

-- DropForeignKey
ALTER TABLE "Statistikk" DROP CONSTRAINT "fkfa5cb213c47ad723";

-- DropForeignKey
ALTER TABLE "Statistikk_kontakter" DROP CONSTRAINT "fkf98634a159382591";

-- DropForeignKey
ALTER TABLE "Statistikk_kontakter" DROP CONSTRAINT "fkf98634a1d978a9a3";

-- DropForeignKey
ALTER TABLE "Statistikk_regionale_nivaer" DROP CONSTRAINT "fke4b2f5b83078425c";

-- DropForeignKey
ALTER TABLE "Statistikk_regionale_nivaer" DROP CONSTRAINT "fke4b2f5b8d978a9a3";

-- DropForeignKey
ALTER TABLE "Variant" DROP CONSTRAINT "fke1d1085b8b4eb03";

-- DropForeignKey
ALTER TABLE "Variant" DROP CONSTRAINT "fke1d1085d978a9a3";

-- AlterTable
ALTER TABLE "Variant" DROP COLUMN "er_opphort",
DROP COLUMN "frekvens_id",
DROP COLUMN "revisjon",
DROP COLUMN "statistikk_id",
ADD COLUMN     "cancelled" BOOLEAN NOT NULL,
ADD COLUMN     "freq_id" DECIMAL(19,0) NOT NULL,
ADD COLUMN     "revision" VARCHAR(255) NOT NULL,
ADD COLUMN     "statistic_id" DECIMAL(19,0) NOT NULL;

-- DropTable
DROP TABLE "Frekvens";

-- DropTable
DROP TABLE "Kalender_dato";

-- DropTable
DROP TABLE "Kontakt";

-- DropTable
DROP TABLE "Kortnavn";

-- DropTable
DROP TABLE "Publisering";

-- DropTable
DROP TABLE "Regionalt_niva";

-- DropTable
DROP TABLE "Seksjon";

-- DropTable
DROP TABLE "Statistikk";

-- DropTable
DROP TABLE "Statistikk_kontakter";

-- DropTable
DROP TABLE "Statistikk_regionale_nivaer";

-- CreateTable
CREATE TABLE "Frequency" (
    "id" DECIMAL(19,0) NOT NULL,
    "version" DECIMAL(19,0) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "code" VARCHAR(50) NOT NULL,

    CONSTRAINT "sys_c0023870" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calender_date" (
    "id" DECIMAL(19,0) NOT NULL,
    "version" DECIMAL(19,0) NOT NULL,
    "comment" VARCHAR(255) NOT NULL,
    "day" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "sys_c0023875" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" DECIMAL(19,0) NOT NULL,
    "version" DECIMAL(19,0) NOT NULL,
    "initials" VARCHAR(3),
    "mobile" VARCHAR(30),
    "name" VARCHAR(130) NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,
    "phone" VARCHAR(30),
    "email" VARCHAR(100) NOT NULL,
    "date_created" TIMESTAMP(6) NOT NULL,
    "inactiv" BOOLEAN,
    "name_en" VARCHAR(130),

    CONSTRAINT "sys_c0023890" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shortname" (
    "id" DECIMAL(19,0) NOT NULL,
    "version" DECIMAL(19,0) NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,
    "date_created" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "sys_c0023896" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Release" (
    "id" DECIMAL(19,0) NOT NULL,
    "version" DECIMAL(19,0) NOT NULL,
    "publish_time" TIMESTAMP(6) NOT NULL,
    "has_versions" BOOLEAN NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,
    "comment" VARCHAR(255) NOT NULL,
    "period_to" TIMESTAMP(6) NOT NULL,
    "desk_appoval_status" VARCHAR(255),
    "variant_id" DECIMAL(19,0) NOT NULL,
    "period_from" TIMESTAMP(6) NOT NULL,
    "cancelled" BOOLEAN NOT NULL,
    "date_created" TIMESTAMP(6) NOT NULL,
    "release_date_precision" VARCHAR(255) NOT NULL,
    "import_flag" BOOLEAN,

    CONSTRAINT "sys_c0023910" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region_level" (
    "id" DECIMAL(19,0) NOT NULL,
    "version" DECIMAL(19,0) NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "code" VARCHAR(50),

    CONSTRAINT "sys_c0023916" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Division" (
    "id" DECIMAL(19,0) NOT NULL,
    "version" DECIMAL(19,0) NOT NULL,
    "navn" VARCHAR(100) NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "name_en" VARCHAR(100) NOT NULL,

    CONSTRAINT "sys_c0023922" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Statistic" (
    "id" DECIMAL(19,0) NOT NULL,
    "version" DECIMAL(19,0) NOT NULL,
    "shortname_id" DECIMAL(19,0) NOT NULL,
    "dir_appoval_status" VARCHAR(255),
    "search_phrases" VARCHAR(500),
    "priority" DECIMAL(1,0) NOT NULL,
    "desk_appoval_status" VARCHAR(255),
    "language" VARCHAR(255) NOT NULL,
    "search_phrases_en" VARCHAR(500),
    "division_id" DECIMAL(19,0) NOT NULL,
    "first_release" TIMESTAMP(6),
    "yearly_reporting" BOOLEAN NOT NULL,
    "status" VARCHAR(255) NOT NULL,
    "previous_topic_codes" VARCHAR(255),
    "relation_id" DECIMAL(19,0),
    "name" VARCHAR(140) NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,
    "comment" VARCHAR(255) NOT NULL,
    "name_en" VARCHAR(140),
    "date_created" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "sys_c0023938" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Statistic_contacts" (
    "statistic_id" DECIMAL(19,0) NOT NULL,
    "contact_id" DECIMAL(19,0) NOT NULL,
    "contacts_idx" DECIMAL(10,0),

    CONSTRAINT "sys_c0023946" PRIMARY KEY ("statistic_id","contact_id")
);

-- CreateTable
CREATE TABLE "Statistic_region_level" (
    "region_level_id" DECIMAL(19,0) NOT NULL,
    "statistic_id" DECIMAL(19,0) NOT NULL,

    CONSTRAINT "sys_c0023949" PRIMARY KEY ("statistic_id","region_level_id")
);

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "fkdb40a13c44a06f71" FOREIGN KEY ("variant_id") REFERENCES "Variant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Statistic" ADD CONSTRAINT "fkfa5cb2137008a78" FOREIGN KEY ("relation_id") REFERENCES "Statistic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Statistic" ADD CONSTRAINT "fkfa5cb213b101b242" FOREIGN KEY ("division_id") REFERENCES "Division"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Statistic" ADD CONSTRAINT "fkfa5cb213c47ad723" FOREIGN KEY ("shortname_id") REFERENCES "Shortname"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Statistic_contacts" ADD CONSTRAINT "fkf98634a159382591" FOREIGN KEY ("contact_id") REFERENCES "Contact"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Statistic_contacts" ADD CONSTRAINT "fkf98634a1d978a9a3" FOREIGN KEY ("statistic_id") REFERENCES "Statistic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Statistic_region_level" ADD CONSTRAINT "fke4b2f5b83078425c" FOREIGN KEY ("region_level_id") REFERENCES "Region_level"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Statistic_region_level" ADD CONSTRAINT "fke4b2f5b8d978a9a3" FOREIGN KEY ("statistic_id") REFERENCES "Statistic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "fke1d1085b8b4eb03" FOREIGN KEY ("freq_id") REFERENCES "Frequency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "fke1d1085d978a9a3" FOREIGN KEY ("statistic_id") REFERENCES "Statistic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
