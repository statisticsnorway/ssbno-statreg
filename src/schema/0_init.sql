create schema if not exists statreg;

create table if not exists statreg."FREKVENS"
(
    ID      NUMERIC(19)  not null,
    VERSION NUMERIC(19)  not null,
    NAVN    VARCHAR(50) not null,
    KODE    VARCHAR(50) not null
);

create table if not exists statreg."KALENDER_DATO"
(
    ID        NUMERIC(19)   not null,
    VERSION   NUMERIC(19)   not null,
    KOMMENTAR VARCHAR(255) not null,
    DAG       TIMESTAMP(6) not null
);

create table if not exists statreg."KONTAKT"
(
    ID           NUMERIC(19)   not null,
    VERSION      NUMERIC(19)   not null,
    INITIALER    VARCHAR(3),
    MOBIL        VARCHAR(30),
    NAVN         VARCHAR(130) not null,
    LAST_UPDATED TIMESTAMP(6) not null,
    TELEFON      VARCHAR(30),
    EPOST        VARCHAR(100) not null,
    DATE_CREATED TIMESTAMP(6) not null,
    INAKTIV      NUMERIC(1),
    NAVN_EN      VARCHAR(130)
);

create table if not exists statreg."KORTNAVN"
(
    ID           NUMERIC(19)   not null,
    VERSION      NUMERIC(19)   not null,
    NAVN         VARCHAR(20)  not null,
    LAST_UPDATED TIMESTAMP(6) not null,
    DATE_CREATED TIMESTAMP(6) not null
);

create table if not exists statreg."PUBLISERING"
(
    ID               NUMERIC(19)   not null,
    VERSION          NUMERIC(19)   not null,
    TIDSPUNKT        TIMESTAMP(6) not null,
    ER_ENDRET        NUMERIC(1)    not null,
    LAST_UPDATED     TIMESTAMP(6) not null,
    INTERN_KOMMENTAR VARCHAR(255) not null,
    PERIODE_TIL      TIMESTAMP(6) not null,
    DESK_FLYT        VARCHAR(255),
    VARIANT_ID       NUMERIC(19)   not null,
    PERIODE_FRA      TIMESTAMP(6) not null,
    ER_AVLYST        NUMERIC(1)    not null,
    DATE_CREATED     TIMESTAMP(6) not null,
    DATOTYPE         VARCHAR(255) not null,
    IMPORT_FLAG      NUMERIC(1)
);

create table if not exists statreg."REGIONALT_NIVA"
(
    ID      NUMERIC(19)  not null,
    VERSION NUMERIC(19)  not null,
    NAVN    VARCHAR(40) not null,
    KODE    VARCHAR(50)
);

create table if not exists statreg."SEKSJON"
(
    ID      NUMERIC(19)   not null,
    VERSION NUMERIC(19)   not null,
    NAVN    VARCHAR(100) not null,
    KODE    VARCHAR(3)   not null,
    NAVN_EN VARCHAR(100) not null
);

create table if not exists statreg."STATISTIKK"
(
    ID                     NUMERIC(19)   not null,
    VERSION                NUMERIC(19)   not null,
    KORTNAVN_ID            NUMERIC(19)   not null,
    DIR_FLYT               VARCHAR(255),
    TRIGGERORD             VARCHAR(500),
    PRIORITET              NUMERIC(1)    not null,
    DESK_FLYT              VARCHAR(255),
    SPRAK                  VARCHAR(255) not null,
    TRIGGERORD_EN          VARCHAR(500),
    EIERSEKSJON_ID         NUMERIC(19)   not null,
    FORSTEGANGSPUBLISERING TIMESTAMP(6),
    ARSRAPPORTERING        NUMERIC(1)    not null,
    STATUS                 VARCHAR(255) not null,
    GAMLE_EMNEKODER        VARCHAR(255),
    RELASJON_ID            NUMERIC(19),
    STATISTIKKNAVN         VARCHAR(140) not null,
    LAST_UPDATED           TIMESTAMP(6) not null,
    INTERN_KOMMENTAR       VARCHAR(255) not null,
    STATISTIKKNAVN_EN      VARCHAR(140),
    DATE_CREATED           TIMESTAMP(6) not null
);

create table if not exists statreg."STATISTIKK_KONTAKTER"
(
    STATISTIKK_ID NUMERIC(19) not null,
    KONTAKT_ID    NUMERIC(19) not null,
    KONTAKTER_IDX NUMERIC(10)
);

create table if not exists statreg."STATISTIKK_REGIONALE_NIVAER"
(
    REGIONALT_NIVA_ID NUMERIC(19) not null,
    STATISTIKK_ID     NUMERIC(19) not null
);

create table if not exists statreg."VARIANT"
(
    ID            NUMERIC(19)   not null,
    VERSION       NUMERIC(19)   not null,
    FREKVENS_ID   NUMERIC(19)   not null,
    LAST_UPDATED  TIMESTAMP(6) not null,
    REVISJON      VARCHAR(255) not null,
    STATISTIKK_ID NUMERIC(19)   not null,
    DETALJNIVA_EN VARCHAR(255),
    DETALJNIVA    VARCHAR(255),
    ER_OPPHORT    NUMERIC(1)    not null,
    DATE_CREATED  TIMESTAMP(6) not null
);

alter table statreg."STATISTIKK"
    add constraint SYS_C0023938
        primary key (ID);

alter table statreg."STATISTIKK"
    add constraint FKFA5CB2137008A78
        foreign key (RELASJON_ID) references statreg."STATISTIKK";


alter table statreg."PUBLISERING"
    add constraint SYS_C0023910
        primary key (ID);


alter table statreg."REGIONALT_NIVA"
    add constraint SYS_C0023916
        primary key (ID);


alter table statreg."STATISTIKK_KONTAKTER"
    add constraint SYS_C0023946
        primary key (STATISTIKK_ID, KONTAKT_ID);

alter table statreg."STATISTIKK_KONTAKTER"
    add constraint FKF98634A1D978A9A3
        foreign key (STATISTIKK_ID) references statreg."STATISTIKK";

alter table statreg."SEKSJON"
    add constraint SYS_C0023922
        primary key (ID);

alter table statreg."STATISTIKK"
    add constraint FKFA5CB213B101B242
        foreign key (EIERSEKSJON_ID) references statreg."SEKSJON";

alter table statreg."VARIANT"
    add constraint SYS_C0023958
        primary key (ID);

alter table statreg."PUBLISERING"
    add constraint FKDB40A13C44A06F71
        foreign key (VARIANT_ID) references statreg."VARIANT";

alter table statreg."VARIANT"
    add constraint FKE1D1085D978A9A3
        foreign key (STATISTIKK_ID) references statreg."STATISTIKK";

alter table statreg."KALENDER_DATO"
    add constraint SYS_C0023875
        primary key (ID);


alter table statreg."KORTNAVN"
    add constraint SYS_C0023896
        primary key (ID);

alter table statreg."STATISTIKK"
    add constraint FKFA5CB213C47AD723
        foreign key (KORTNAVN_ID) references statreg."KORTNAVN";

alter table statreg."KONTAKT"
    add constraint SYS_C0023890
        primary key (ID);

alter table statreg."STATISTIKK_KONTAKTER"
    add constraint FKF98634A159382591
        foreign key (KONTAKT_ID) references statreg."KONTAKT";

alter table statreg."FREKVENS"
    add constraint SYS_C0023870
        primary key (ID);

alter table statreg."VARIANT"
    add constraint FKE1D1085B8B4EB03
        foreign key (FREKVENS_ID) references statreg."FREKVENS";

alter table statreg."STATISTIKK_REGIONALE_NIVAER"
    add constraint SYS_C0023949
        primary key (STATISTIKK_ID, REGIONALT_NIVA_ID);

alter table statreg."STATISTIKK_REGIONALE_NIVAER"
    add constraint FKE4B2F5B83078425C
        foreign key (REGIONALT_NIVA_ID) references statreg."REGIONALT_NIVA";

alter table statreg."STATISTIKK_REGIONALE_NIVAER"
    add constraint FKE4B2F5B8D978A9A3
        foreign key (STATISTIKK_ID) references statreg."STATISTIKK";
