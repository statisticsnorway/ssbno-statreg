-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "statreg";

-- CreateTable
CREATE TABLE "statreg"."Frequency" (
    "id" SERIAL NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "Frequency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statreg"."Calender_date" (
    "id" SERIAL NOT NULL,
    "version" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "day" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "Calender_date_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statreg"."Contact_DoNotUse" (
    "id" SERIAL NOT NULL,
    "version" INTEGER NOT NULL,
    "initials" TEXT,
    "mobile" TEXT,
    "name" TEXT NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,
    "phone" TEXT,
    "email" TEXT NOT NULL,
    "date_created" TIMESTAMP(6) NOT NULL,
    "inactiv" BOOLEAN,
    "name_en" TEXT,

    CONSTRAINT "Contact_DoNotUse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statreg"."Shortname" (
    "id" SERIAL NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,
    "date_created" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "Shortname_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statreg"."Release" (
    "id" SERIAL NOT NULL,
    "version" INTEGER NOT NULL,
    "publish_time" TIMESTAMP(6) NOT NULL,
    "has_versions" BOOLEAN NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,
    "comment" TEXT NOT NULL,
    "period_to" TIMESTAMP(6) NOT NULL,
    "desk_appoval_status" TEXT,
    "variant_id" INTEGER NOT NULL,
    "period_from" TIMESTAMP(6) NOT NULL,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "date_created" TIMESTAMP(6) NOT NULL,
    "release_date_precision" TEXT NOT NULL,
    "import_flag" BOOLEAN,

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statreg"."Region_level" (
    "id" SERIAL NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "Region_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statreg"."Division_DoNotUse" (
    "id" SERIAL NOT NULL,
    "version" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Division_DoNotUse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statreg"."Statistic" (
    "id" SERIAL NOT NULL,
    "version" INTEGER NOT NULL,
    "shortname_id" INTEGER NOT NULL,
    "dir_appoval_status" TEXT,
    "search_phrases" TEXT,
    "priority" INTEGER NOT NULL,
    "desk_appoval_status" TEXT,
    "language" TEXT NOT NULL,
    "search_phrases_en" TEXT,
    "division_id" INTEGER NOT NULL,
    "first_release" TIMESTAMP(6),
    "yearly_reporting" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "relation_id" INTEGER,
    "name" TEXT NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,
    "comment" TEXT NOT NULL,
    "name_en" TEXT,
    "date_created" TIMESTAMP(6) NOT NULL,
    "legacy_topic_codes" TEXT,

    CONSTRAINT "Statistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statreg"."Statistic_contacts" (
    "statistic_id" INTEGER NOT NULL,
    "contact_id" INTEGER NOT NULL,
    "contacts_idx" INTEGER,

    CONSTRAINT "Statistic_contacts_pkey" PRIMARY KEY ("statistic_id","contact_id")
);

-- CreateTable
CREATE TABLE "statreg"."Statistic_region_level" (
    "region_level_id" INTEGER NOT NULL,
    "statistic_id" INTEGER NOT NULL,

    CONSTRAINT "Statistic_region_level_pkey" PRIMARY KEY ("statistic_id","region_level_id")
);

-- CreateTable
CREATE TABLE "statreg"."Variant" (
    "id" SERIAL NOT NULL,
    "version" INTEGER NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,
    "date_created" TIMESTAMP(6) NOT NULL,
    "cancelled" BOOLEAN NOT NULL,
    "freq_id" INTEGER NOT NULL,
    "revision" TEXT NOT NULL,
    "statistic_id" INTEGER NOT NULL,
    "level_of_detail" TEXT,
    "level_of_detail_en" TEXT,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Frequency_code_key" ON "statreg"."Frequency"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Calender_date_day_key" ON "statreg"."Calender_date"("day");

-- CreateIndex
CREATE UNIQUE INDEX "Shortname_name_key" ON "statreg"."Shortname"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Region_level_code_key" ON "statreg"."Region_level"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Division_DoNotUse_code_key" ON "statreg"."Division_DoNotUse"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Statistic_shortname_id_key" ON "statreg"."Statistic"("shortname_id");

-- AddForeignKey
ALTER TABLE "statreg"."Release" ADD CONSTRAINT "Release_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "statreg"."Variant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statreg"."Statistic" ADD CONSTRAINT "Statistic_relation_id_fkey" FOREIGN KEY ("relation_id") REFERENCES "statreg"."Statistic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statreg"."Statistic" ADD CONSTRAINT "Statistic_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "statreg"."Division_DoNotUse"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statreg"."Statistic" ADD CONSTRAINT "Statistic_shortname_id_fkey" FOREIGN KEY ("shortname_id") REFERENCES "statreg"."Shortname"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statreg"."Statistic_contacts" ADD CONSTRAINT "Statistic_contacts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "statreg"."Contact_DoNotUse"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statreg"."Statistic_contacts" ADD CONSTRAINT "Statistic_contacts_statistic_id_fkey" FOREIGN KEY ("statistic_id") REFERENCES "statreg"."Statistic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statreg"."Statistic_region_level" ADD CONSTRAINT "Statistic_region_level_region_level_id_fkey" FOREIGN KEY ("region_level_id") REFERENCES "statreg"."Region_level"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statreg"."Statistic_region_level" ADD CONSTRAINT "Statistic_region_level_statistic_id_fkey" FOREIGN KEY ("statistic_id") REFERENCES "statreg"."Statistic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statreg"."Variant" ADD CONSTRAINT "Variant_freq_id_fkey" FOREIGN KEY ("freq_id") REFERENCES "statreg"."Frequency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statreg"."Variant" ADD CONSTRAINT "Variant_statistic_id_fkey" FOREIGN KEY ("statistic_id") REFERENCES "statreg"."Statistic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

