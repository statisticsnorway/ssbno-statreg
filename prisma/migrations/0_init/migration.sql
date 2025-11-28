-- CreateTable
CREATE TABLE "FREKVENS" (
    "id" DECIMAL(19,0) NOT NULL,
    "version" DECIMAL(19,0) NOT NULL,
    "navn" VARCHAR(50) NOT NULL,
    "kode" VARCHAR(50) NOT NULL,

    CONSTRAINT "sys_c0023870" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KALENDER_DATO" (
    "id" DECIMAL(19,0) NOT NULL,
    "version" DECIMAL(19,0) NOT NULL,
    "kommentar" VARCHAR(255) NOT NULL,
    "dag" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "sys_c0023875" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KONTAKT" (
    "id" DECIMAL(19,0) NOT NULL,
    "version" DECIMAL(19,0) NOT NULL,
    "initialer" VARCHAR(3),
    "mobil" VARCHAR(30),
    "navn" VARCHAR(130) NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,
    "telefon" VARCHAR(30),
    "epost" VARCHAR(100) NOT NULL,
    "date_created" TIMESTAMP(6) NOT NULL,
    "inaktiv" DECIMAL(1,0),
    "navn_en" VARCHAR(130),

    CONSTRAINT "sys_c0023890" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KORTNAVN" (
    "id" DECIMAL(19,0) NOT NULL,
    "version" DECIMAL(19,0) NOT NULL,
    "navn" VARCHAR(20) NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,
    "date_created" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "sys_c0023896" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PUBLISERING" (
    "id" DECIMAL(19,0) NOT NULL,
    "version" DECIMAL(19,0) NOT NULL,
    "tidspunkt" TIMESTAMP(6) NOT NULL,
    "er_endret" DECIMAL(1,0) NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,
    "intern_kommentar" VARCHAR(255) NOT NULL,
    "periode_til" TIMESTAMP(6) NOT NULL,
    "desk_flyt" VARCHAR(255),
    "variant_id" DECIMAL(19,0) NOT NULL,
    "periode_fra" TIMESTAMP(6) NOT NULL,
    "er_avlyst" DECIMAL(1,0) NOT NULL,
    "date_created" TIMESTAMP(6) NOT NULL,
    "datotype" VARCHAR(255) NOT NULL,
    "import_flag" DECIMAL(1,0),

    CONSTRAINT "sys_c0023910" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "REGIONALT_NIVA" (
    "id" DECIMAL(19,0) NOT NULL,
    "version" DECIMAL(19,0) NOT NULL,
    "navn" VARCHAR(40) NOT NULL,
    "kode" VARCHAR(50),

    CONSTRAINT "sys_c0023916" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEKSJON" (
    "id" DECIMAL(19,0) NOT NULL,
    "version" DECIMAL(19,0) NOT NULL,
    "navn" VARCHAR(100) NOT NULL,
    "kode" VARCHAR(3) NOT NULL,
    "navn_en" VARCHAR(100) NOT NULL,

    CONSTRAINT "sys_c0023922" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "STATISTIKK" (
    "id" DECIMAL(19,0) NOT NULL,
    "version" DECIMAL(19,0) NOT NULL,
    "kortnavn_id" DECIMAL(19,0) NOT NULL,
    "dir_flyt" VARCHAR(255),
    "triggerord" VARCHAR(500),
    "prioritet" DECIMAL(1,0) NOT NULL,
    "desk_flyt" VARCHAR(255),
    "sprak" VARCHAR(255) NOT NULL,
    "triggerord_en" VARCHAR(500),
    "eierseksjon_id" DECIMAL(19,0) NOT NULL,
    "forstegangspublisering" TIMESTAMP(6),
    "arsrapportering" DECIMAL(1,0) NOT NULL,
    "status" VARCHAR(255) NOT NULL,
    "gamle_emnekoder" VARCHAR(255),
    "relasjon_id" DECIMAL(19,0),
    "statistikknavn" VARCHAR(140) NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,
    "intern_kommentar" VARCHAR(255) NOT NULL,
    "statistikknavn_en" VARCHAR(140),
    "date_created" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "sys_c0023938" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "STATISTIKK_KONTAKTER" (
    "statistikk_id" DECIMAL(19,0) NOT NULL,
    "kontakt_id" DECIMAL(19,0) NOT NULL,
    "kontakter_idx" DECIMAL(10,0),

    CONSTRAINT "sys_c0023946" PRIMARY KEY ("statistikk_id","kontakt_id")
);

-- CreateTable
CREATE TABLE "STATISTIKK_REGIONALE_NIVAER" (
    "regionalt_niva_id" DECIMAL(19,0) NOT NULL,
    "statistikk_id" DECIMAL(19,0) NOT NULL,

    CONSTRAINT "sys_c0023949" PRIMARY KEY ("statistikk_id","regionalt_niva_id")
);

-- CreateTable
CREATE TABLE "VARIANT" (
    "id" DECIMAL(19,0) NOT NULL,
    "version" DECIMAL(19,0) NOT NULL,
    "frekvens_id" DECIMAL(19,0) NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,
    "revisjon" VARCHAR(255) NOT NULL,
    "statistikk_id" DECIMAL(19,0) NOT NULL,
    "detaljniva_en" VARCHAR(255),
    "detaljniva" VARCHAR(255),
    "er_opphort" DECIMAL(1,0) NOT NULL,
    "date_created" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "sys_c0023958" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PUBLISERING" ADD CONSTRAINT "fkdb40a13c44a06f71" FOREIGN KEY ("variant_id") REFERENCES "VARIANT"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "STATISTIKK" ADD CONSTRAINT "fkfa5cb2137008a78" FOREIGN KEY ("relasjon_id") REFERENCES "STATISTIKK"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "STATISTIKK" ADD CONSTRAINT "fkfa5cb213b101b242" FOREIGN KEY ("eierseksjon_id") REFERENCES "SEKSJON"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "STATISTIKK" ADD CONSTRAINT "fkfa5cb213c47ad723" FOREIGN KEY ("kortnavn_id") REFERENCES "KORTNAVN"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "STATISTIKK_KONTAKTER" ADD CONSTRAINT "fkf98634a159382591" FOREIGN KEY ("kontakt_id") REFERENCES "KONTAKT"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "STATISTIKK_KONTAKTER" ADD CONSTRAINT "fkf98634a1d978a9a3" FOREIGN KEY ("statistikk_id") REFERENCES "STATISTIKK"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "STATISTIKK_REGIONALE_NIVAER" ADD CONSTRAINT "fke4b2f5b83078425c" FOREIGN KEY ("regionalt_niva_id") REFERENCES "REGIONALT_NIVA"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "STATISTIKK_REGIONALE_NIVAER" ADD CONSTRAINT "fke4b2f5b8d978a9a3" FOREIGN KEY ("statistikk_id") REFERENCES "STATISTIKK"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "VARIANT" ADD CONSTRAINT "fke1d1085b8b4eb03" FOREIGN KEY ("frekvens_id") REFERENCES "FREKVENS"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "VARIANT" ADD CONSTRAINT "fke1d1085d978a9a3" FOREIGN KEY ("statistikk_id") REFERENCES "STATISTIKK"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

