\set ON_ERROR_STOP on

-- Create schema
CREATE SCHEMA IF NOT EXISTS statreg_data AUTHORIZATION cob;

-- Make sure each login uses correct schema
ALTER ROLE cob SET search_path = statreg_data, public;

-- Create one test table
CREATE TABLE statreg_data.user (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);
