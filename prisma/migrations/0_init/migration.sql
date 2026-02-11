-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "statreg";

-- CreateTable
CREATE TABLE "statreg"."Frequency" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "code" VARCHAR(50) NOT NULL,

    CONSTRAINT "Frequency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statreg"."Calender_date" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "comment" VARCHAR(255) NOT NULL,
    "day" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "Calender_date_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statreg"."Contact" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "initials" VARCHAR(3),
    "mobile" VARCHAR(30),
    "name" VARCHAR(130) NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,
    "phone" VARCHAR(30),
    "email" VARCHAR(100) NOT NULL,
    "date_created" TIMESTAMP(6) NOT NULL,
    "inactiv" BOOLEAN,
    "name_en" VARCHAR(130),

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statreg"."Shortname" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,
    "date_created" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "Shortname_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statreg"."Release" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "publish_time" TIMESTAMP(6) NOT NULL,
    "has_versions" BOOLEAN NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,
    "comment" VARCHAR(255) NOT NULL,
    "period_to" TIMESTAMP(6) NOT NULL,
    "desk_appoval_status" VARCHAR(255),
    "variant_id" TEXT NOT NULL,
    "period_from" TIMESTAMP(6) NOT NULL,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "date_created" TIMESTAMP(6) NOT NULL,
    "release_date_precision" VARCHAR(255) NOT NULL,
    "import_flag" BOOLEAN,

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statreg"."Region_level" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "code" VARCHAR(50),

    CONSTRAINT "Region_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statreg"."Division" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "name_en" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statreg"."Statistic" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "shortname_id" TEXT NOT NULL,
    "dir_appoval_status" VARCHAR(255),
    "search_phrases" VARCHAR(500),
    "priority" INTEGER NOT NULL,
    "desk_appoval_status" VARCHAR(255),
    "language" VARCHAR(255) NOT NULL,
    "search_phrases_en" VARCHAR(500),
    "division_id" TEXT NOT NULL,
    "first_release" TIMESTAMP(6),
    "yearly_reporting" BOOLEAN NOT NULL,
    "status" VARCHAR(255) NOT NULL,
    "relation_id" TEXT,
    "name" VARCHAR(140) NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,
    "comment" VARCHAR(255) NOT NULL,
    "name_en" VARCHAR(140),
    "date_created" TIMESTAMP(6) NOT NULL,
    "legacy_topic_codes" VARCHAR(255),

    CONSTRAINT "Statistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statreg"."Statistic_contacts" (
    "statistic_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "contacts_idx" TEXT,

    CONSTRAINT "sys_c0023946" PRIMARY KEY ("statistic_id","contact_id")
);

-- CreateTable
CREATE TABLE "statreg"."Statistic_region_level" (
    "region_level_id" TEXT NOT NULL,
    "statistic_id" TEXT NOT NULL,

    CONSTRAINT "sys_c0023949" PRIMARY KEY ("statistic_id","region_level_id")
);

-- CreateTable
CREATE TABLE "statreg"."Variant" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,
    "date_created" TIMESTAMP(6) NOT NULL,
    "cancelled" BOOLEAN NOT NULL,
    "freq_id" TEXT NOT NULL,
    "revision" VARCHAR(255) NOT NULL,
    "statistic_id" TEXT NOT NULL,
    "level_of_detail" VARCHAR(255),
    "level_of_detail_en" VARCHAR(255),

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

-- AddForeignKey
ALTER TABLE "statreg"."Release" ADD CONSTRAINT "fkdb40a13c44a06f71" FOREIGN KEY ("variant_id") REFERENCES "statreg"."Variant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statreg"."Statistic" ADD CONSTRAINT "fkfa5cb2137008a78" FOREIGN KEY ("relation_id") REFERENCES "statreg"."Statistic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statreg"."Statistic" ADD CONSTRAINT "fkfa5cb213b101b242" FOREIGN KEY ("division_id") REFERENCES "statreg"."Division"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statreg"."Statistic" ADD CONSTRAINT "fkfa5cb213c47ad723" FOREIGN KEY ("shortname_id") REFERENCES "statreg"."Shortname"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statreg"."Statistic_contacts" ADD CONSTRAINT "fkf98634a159382591" FOREIGN KEY ("contact_id") REFERENCES "statreg"."Contact"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statreg"."Statistic_contacts" ADD CONSTRAINT "fkf98634a1d978a9a3" FOREIGN KEY ("statistic_id") REFERENCES "statreg"."Statistic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statreg"."Statistic_region_level" ADD CONSTRAINT "fke4b2f5b83078425c" FOREIGN KEY ("region_level_id") REFERENCES "statreg"."Region_level"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statreg"."Statistic_region_level" ADD CONSTRAINT "fke4b2f5b8d978a9a3" FOREIGN KEY ("statistic_id") REFERENCES "statreg"."Statistic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statreg"."Variant" ADD CONSTRAINT "fke1d1085b8b4eb03" FOREIGN KEY ("freq_id") REFERENCES "statreg"."Frequency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statreg"."Variant" ADD CONSTRAINT "fke1d1085d978a9a3" FOREIGN KEY ("statistic_id") REFERENCES "statreg"."Statistic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

