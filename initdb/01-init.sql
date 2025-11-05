-- Initialize additional databases for local development and CI
-- Default admin: POSTGRES_USER=postgres, password provided via env

-- Create test database (runs only on first init)
CREATE DATABASE siderhub_test;

-- Create required schemas in the default DB; Prisma will ensure via migrations as well
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS academy;
CREATE SCHEMA IF NOT EXISTS hidra;
CREATE SCHEMA IF NOT EXISTS cybervault;
CREATE SCHEMA IF NOT EXISTS admin;

-- Ensure same schemas exist in test DB
\connect siderhub_test postgres
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS academy;
CREATE SCHEMA IF NOT EXISTS hidra;
CREATE SCHEMA IF NOT EXISTS cybervault;
CREATE SCHEMA IF NOT EXISTS admin;
