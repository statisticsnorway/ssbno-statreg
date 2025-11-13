--
-- PostgreSQL database dump
--

\restrict AHGeRwS0FvG5Fbl902h9ytQChErxi30PdJ6TgIhj4jEdAPbydoNXja0kxhvAx3H

-- Dumped from database version 18.0 (Postgres.app)
-- Dumped by pg_dump version 18.0 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: statreg_data; Type: SCHEMA; Schema: -; Owner: cob
--

CREATE SCHEMA statreg_data;


ALTER SCHEMA statreg_data OWNER TO cob;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AUDIT_LOG; Type: TABLE; Schema: statreg_data; Owner: cob
--

CREATE TABLE statreg_data."AUDIT_LOG" (
    id numeric(19,0),
    property_name character varying(255),
    last_updated timestamp without time zone,
    old_value character varying(255),
    actor character varying(255),
    uri character varying(255),
    new_value character varying(255),
    persisted_object_version numeric(19,0),
    date_created timestamp without time zone,
    class_name character varying(255),
    event_name character varying(255),
    persisted_object_id numeric(19,0)
);


ALTER TABLE statreg_data."AUDIT_LOG" OWNER TO cob;

--
-- Name: FREKVENS; Type: TABLE; Schema: statreg_data; Owner: cob
--

CREATE TABLE statreg_data."FREKVENS" (
    id numeric(19,0),
    version numeric(19,0),
    navn character varying(50),
    kode character varying(50)
);


ALTER TABLE statreg_data."FREKVENS" OWNER TO cob;

--
-- Name: KALENDER_DATO; Type: TABLE; Schema: statreg_data; Owner: cob
--

CREATE TABLE statreg_data."KALENDER_DATO" (
    id numeric(19,0),
    version numeric(19,0),
    kommentar character varying(255),
    dag timestamp without time zone
);


ALTER TABLE statreg_data."KALENDER_DATO" OWNER TO cob;

--
-- Name: KONTAKT; Type: TABLE; Schema: statreg_data; Owner: cob
--

CREATE TABLE statreg_data."KONTAKT" (
    id numeric(19,0),
    version numeric(19,0),
    initialer character varying(3),
    mobil character varying(30),
    navn character varying(130),
    last_updated timestamp without time zone,
    telefon character varying(30),
    epost character varying(100),
    date_created timestamp without time zone,
    inaktiv numeric(1,0),
    navn_en character varying(130)
);


ALTER TABLE statreg_data."KONTAKT" OWNER TO cob;

--
-- Name: KORTNAVN; Type: TABLE; Schema: statreg_data; Owner: cob
--

CREATE TABLE statreg_data."KORTNAVN" (
    id numeric(19,0),
    version numeric(19,0),
    navn character varying(20),
    last_updated timestamp without time zone,
    date_created timestamp without time zone
);


ALTER TABLE statreg_data."KORTNAVN" OWNER TO cob;

--
-- Name: PUBLISERING; Type: TABLE; Schema: statreg_data; Owner: cob
--

CREATE TABLE statreg_data."PUBLISERING" (
    id numeric(19,0),
    version numeric(19,0),
    tidspunkt timestamp without time zone,
    er_endret numeric(1,0),
    last_updated timestamp without time zone,
    intern_kommentar character varying(255),
    periode_til timestamp without time zone,
    desk_flyt character varying(255),
    variant_id numeric(19,0),
    periode_fra timestamp without time zone,
    er_avlyst numeric(1,0),
    date_created timestamp without time zone,
    datotype character varying(255),
    import_flag numeric(1,0)
);


ALTER TABLE statreg_data."PUBLISERING" OWNER TO cob;

--
-- Name: REGIONALT_NIVA; Type: TABLE; Schema: statreg_data; Owner: cob
--

CREATE TABLE statreg_data."REGIONALT_NIVA" (
    id numeric(19,0),
    version numeric(19,0),
    navn character varying(40),
    kode character varying(50)
);


ALTER TABLE statreg_data."REGIONALT_NIVA" OWNER TO cob;

--
-- Name: SEKSJON; Type: TABLE; Schema: statreg_data; Owner: cob
--

CREATE TABLE statreg_data."SEKSJON" (
    id numeric(19,0),
    version numeric(19,0),
    navn character varying(100),
    kode character varying(3),
    navn_en character varying(100)
);


ALTER TABLE statreg_data."SEKSJON" OWNER TO cob;

--
-- Name: STATISTIKK; Type: TABLE; Schema: statreg_data; Owner: cob
--

CREATE TABLE statreg_data."STATISTIKK" (
    id numeric(19,0),
    version numeric(19,0),
    kortnavn_id numeric(19,0),
    dir_flyt character varying(255),
    triggerord character varying(500),
    prioritet numeric(1,0),
    desk_flyt character varying(255),
    sprak character varying(255),
    triggerord_en character varying(500),
    eierseksjon_id numeric(19,0),
    forstegangspublisering timestamp without time zone,
    arsrapportering numeric(1,0),
    status character varying(255),
    gamle_emnekoder character varying(255),
    relasjon_id numeric(19,0),
    statistikknavn character varying(140),
    last_updated timestamp without time zone,
    intern_kommentar character varying(255),
    statistikknavn_en character varying(140),
    date_created timestamp without time zone
);


ALTER TABLE statreg_data."STATISTIKK" OWNER TO cob;

--
-- Name: STATISTIKK_KONTAKTER; Type: TABLE; Schema: statreg_data; Owner: cob
--

CREATE TABLE statreg_data."STATISTIKK_KONTAKTER" (
    statistikk_id numeric(19,0),
    kontakt_id numeric(19,0),
    kontakter_idx numeric(10,0)
);


ALTER TABLE statreg_data."STATISTIKK_KONTAKTER" OWNER TO cob;

--
-- Name: STATISTIKK_REGIONALE_NIVAER; Type: TABLE; Schema: statreg_data; Owner: cob
--

CREATE TABLE statreg_data."STATISTIKK_REGIONALE_NIVAER" (
    regionalt_niva_id numeric(19,0),
    statistikk_id numeric(19,0)
);


ALTER TABLE statreg_data."STATISTIKK_REGIONALE_NIVAER" OWNER TO cob;

--
-- Name: VARIANT; Type: TABLE; Schema: statreg_data; Owner: cob
--

CREATE TABLE statreg_data."VARIANT" (
    id numeric(19,0),
    version numeric(19,0),
    frekvens_id numeric(19,0),
    last_updated timestamp without time zone,
    revisjon character varying(255),
    statistikk_id numeric(19,0),
    detaljniva_en character varying(255),
    detaljniva character varying(255),
    er_opphort numeric(1,0),
    date_created timestamp without time zone
);


ALTER TABLE statreg_data."VARIANT" OWNER TO cob;


INSERT INTO statreg_data."STATISTIKK"
VALUES (
    3663, 18, 3662,
    'GODKJENT',
    'energi, energiproduksjon, energibruk, energibruk etter næring, energiforbruk i husholdninger, energivarer (for eksempel råolje, bensin, naturgass), import, eksport, strømpriser, energipriser',
    0,
    'GODKJENT',
    'nb',
    'energy production, energy consumption, energy consumption by industry, energy consumption in households, energy goods (for example crude oil, petrol, natural gas), import, export, electricity prices, energy prices',
    3661,
    '1975-12-31 23:00:00',
    0,
    'SA',
    '01.03.10',
    81988,
    'Energiregnskap og energibalanse',
    '2020-06-12 07:24:15.569',
    'Videreføres av energibalanse',
    'Energy account and energy balance',
    '2010-11-05 08:02:23.626'
);