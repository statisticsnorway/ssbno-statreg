create table statreg_db."DATABASECHANGELOG"
(
    "ID"           VARCHAR(63)  not null,
    "AUTHOR"       VARCHAR(63)  not null,
    "FILENAME"     VARCHAR(200) not null,
    "DATEEXECUTED" TIMESTAMP(6)  not null,
    "MD5SUM"       VARCHAR(32),
    "DESCRIPTION"  VARCHAR(255),
    "COMMENTS"     VARCHAR(255),
    "TAG"          VARCHAR(255),
    "LIQUIBASE"    VARCHAR(10),
    constraint "PK_DATABASECHANGELOG"
        primary key ("ID", "AUTHOR", "FILENAME")
);

create table statreg_db."REGIONALT_NIVA"
(
    "ID"      NUMERIC(19)   not null
        constraint "SYS_C0023916"
            primary key,
    "VERSION" NUMERIC(19)   not null,
    "NAVN"    VARCHAR(40) not null,
    "KODE"    VARCHAR(50)
);

create table statreg_db."SEKSJON"
(
    "ID"      NUMERIC(19)    not null
        constraint "SYS_C0023922"
            primary key,
    "VERSION" NUMERIC(19)    not null,
    "NAVN"    VARCHAR(100) not null,
    "KODE"    VARCHAR(3)   not null,
    "NAVN_EN" VARCHAR(100) not null
);

create index "SYS_C0023924"
    on statreg_db."SEKSJON" ("KODE");

create index "SYS_C0023925"
    on statreg_db."SEKSJON" ("NAVN_EN");

create index "SYS_C0023923"
    on statreg_db."SEKSJON" ("NAVN");

create table statreg_db."DATABASECHANGELOGLOCK"
(
    "ID"          NUMERIC(1) not null
        constraint "PK_DATABASECHANGELOGLOCK"
            primary key,
    "LOCKED"      NUMERIC(1) not null,
    "LOCKGRANTED" TIMESTAMP(6),
    "LOCKEDBY"    VARCHAR(255)
);

create table statreg_db."AUDIT_LOG"
(
    "ID"                       NUMERIC(19)   not null
        constraint "SYS_C0023865"
            primary key,
    "PROPERTY_NAME"            VARCHAR(255),
    "LAST_UPDATED"             TIMESTAMP(6) not null,
    "OLD_VALUE"                VARCHAR(255),
    "ACTOR"                    VARCHAR(255),
    "URI"                      VARCHAR(255),
    "NEW_VALUE"                VARCHAR(255),
    "PERSISTED_OBJECT_VERSION" NUMERIC(19),
    "DATE_CREATED"             TIMESTAMP(6) not null,
    "CLASS_NAME"               VARCHAR(255),
    "EVENT_NAME"               VARCHAR(255),
    "PERSISTED_OBJECT_ID"      NUMERIC(19)
);

create table statreg_db."KALENDER_DATO"
(
    "ID"        NUMERIC(19)    not null
        constraint "SYS_C0023875"
            primary key,
    "VERSION"   NUMERIC(19)    not null,
    "KOMMENTAR" VARCHAR(255) not null,
    "DAG"       TIMESTAMP(6)  not null
);

create index "SYS_C0023876"
    on statreg_db."KALENDER_DATO" ("DAG");

create table statreg_db."KORTNAVN"
(
    "ID"           NUMERIC(19)   not null
        constraint "SYS_C0023896"
            primary key,
    "VERSION"      NUMERIC(19)   not null,
    "NAVN"         VARCHAR(20) not null,
    "LAST_UPDATED" TIMESTAMP(6) not null,
    "DATE_CREATED" TIMESTAMP(6) not null
);

create table statreg_db."STATISTIKK"
(
    "ID"                     NUMERIC(19)    not null
        constraint "SYS_C0023938"
            primary key,
    "VERSION"                NUMERIC(19)    not null,
    "KORTNAVN_ID"            NUMERIC(19)    not null
        constraint "FKFA5CB213C47AD723"
            references statreg_db."KORTNAVN"
            on delete restrict,
    "DIR_FLYT"               VARCHAR(255),
    "TRIGGERORD"             VARCHAR(500),
    "PRIORITET"              NUMERIC(1)     not null,
    "DESK_FLYT"              VARCHAR(255),
    "SPRAK"                  VARCHAR(255) not null,
    "TRIGGERORD_EN"          VARCHAR(500),
    "EIERSEKSJON_ID"         NUMERIC(19)    not null
        constraint "FKFA5CB213B101B242"
            references statreg_db."SEKSJON"
            on delete restrict,
    "FORSTEGANGSPUBLISERING" TIMESTAMP(6),
    "ARSRAPPORTERING"        NUMERIC(1)     not null,
    "STATUS"                 VARCHAR(255) not null,
    "GAMLE_EMNEKODER"        VARCHAR(255),
    "RELASJON_ID"            NUMERIC(19)
        constraint "FKFA5CB2137008A78"
            references statreg_db."STATISTIKK"
            on delete restrict,
    "STATISTIKKNAVN"         VARCHAR(140) not null,
    "LAST_UPDATED"           TIMESTAMP(6)  not null,
    "INTERN_KOMMENTAR"       VARCHAR(255) not null,
    "STATISTIKKNAVN_EN"      VARCHAR(140),
    "DATE_CREATED"           TIMESTAMP(6)  not null
);

create index "SYS_C0023941"
    on statreg_db."STATISTIKK" ("STATISTIKKNAVN");

create index "SYS_C0023942"
    on statreg_db."STATISTIKK" ("STATISTIKKNAVN_EN");

create index "SYS_C0023897"
    on statreg_db."KORTNAVN" ("NAVN");

create table statreg_db."KONTAKT"
(
    "ID"           NUMERIC(19)    not null
        constraint "SYS_C0023890"
            primary key,
    "VERSION"      NUMERIC(19)    not null,
    "INITIALER"    VARCHAR(3),
    "MOBIL"        VARCHAR(30),
    "NAVN"         VARCHAR(130) not null,
    "LAST_UPDATED" TIMESTAMP(6)  not null,
    "TELEFON"      VARCHAR(30),
    "EPOST"        VARCHAR(100) not null,
    "DATE_CREATED" TIMESTAMP(6)  not null,
    "INAKTIV"      NUMERIC(1),
    "NAVN_EN"      VARCHAR(130)
);

create table statreg_db."STATISTIKK_KONTAKTER"
(
    "STATISTIKK_ID" NUMERIC(19) not null
        constraint "FKF98634A1D978A9A3"
            references statreg_db."STATISTIKK"
            on delete restrict,
    "KONTAKT_ID"    NUMERIC(19) not null
        constraint "FKF98634A159382591"
            references statreg_db."KONTAKT"
            on delete restrict,
    "KONTAKTER_IDX" NUMERIC(10),
    constraint "SYS_C0023946"
        primary key ("STATISTIKK_ID", "KONTAKT_ID")
);

create table statreg_db."FREKVENS"
(
    "ID"      NUMERIC(19)   not null
        constraint "SYS_C0023870"
            primary key,
    "VERSION" NUMERIC(19)   not null,
    "NAVN"    VARCHAR(50) not null,
    "KODE"    VARCHAR(50) not null
);

create table statreg_db."VARIANT"
(
    "ID"            NUMERIC(19)    not null
        constraint "SYS_C0023958"
            primary key,
    "VERSION"       NUMERIC(19)    not null,
    "FREKVENS_ID"   NUMERIC(19)    not null
        constraint "FKE1D1085B8B4EB03"
            references statreg_db."FREKVENS"
            on delete restrict,
    "LAST_UPDATED"  TIMESTAMP(6)  not null,
    "REVISJON"      VARCHAR(255) not null,
    "STATISTIKK_ID" NUMERIC(19)    not null
        constraint "FKE1D1085D978A9A3"
            references statreg_db."STATISTIKK"
            on delete restrict,
    "DETALJNIVA_EN" VARCHAR(255),
    "DETALJNIVA"    VARCHAR(255),
    "ER_OPPHORT"    NUMERIC(1)     not null,
    "DATE_CREATED"  TIMESTAMP(6)  not null
);

create table statreg_db."PUBLISERING"
(
    "ID"               NUMERIC(19)    not null
        constraint "SYS_C0023910"
            primary key,
    "VERSION"          NUMERIC(19)    not null,
    "TIDSPUNKT"        TIMESTAMP(6)  not null,
    "ER_ENDRET"        NUMERIC(1)     not null,
    "LAST_UPDATED"     TIMESTAMP(6)  not null,
    "INTERN_KOMMENTAR" VARCHAR(255) not null,
    "PERIODE_TIL"      TIMESTAMP(6)  not null,
    "DESK_FLYT"        VARCHAR(255),
    "VARIANT_ID"       NUMERIC(19)    not null
        constraint "FKDB40A13C44A06F71"
            references statreg_db."VARIANT"
            on delete restrict,
    "PERIODE_FRA"      TIMESTAMP(6)  not null,
    "ER_AVLYST"        NUMERIC(1)     not null,
    "DATE_CREATED"     TIMESTAMP(6)  not null,
    "DATOTYPE"         VARCHAR(255) not null,
    "IMPORT_FLAG"      NUMERIC(1)
);

create table statreg_db."STATISTIKK_REGIONALE_NIVAER"
(
    "REGIONALT_NIVA_ID" NUMERIC(19) not null
        constraint "FKE4B2F5B83078425C"
            references statreg_db."REGIONALT_NIVA"
            on delete restrict,
    "STATISTIKK_ID"     NUMERIC(19) not null
        constraint "FKE4B2F5B8D978A9A3"
            references statreg_db."STATISTIKK"
            on delete restrict,
    constraint "SYS_C0023949"
        primary key ("STATISTIKK_ID", "REGIONALT_NIVA_ID")
);

