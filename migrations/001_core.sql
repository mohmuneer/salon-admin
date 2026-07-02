-- ============================================================
-- Glamour — Beauty & Barber Management Platform
-- Migration 001: Extensions, ENUM types, core tables
-- Target: PostgreSQL 16 / Supabase
-- ============================================================

-- ---------- Extensions ----------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- ENUM types ----------
-- Defined as native ENUMs (stronger than CHECK constraints, reusable across tables)
DO $$ BEGIN CREATE TYPE user_role          AS ENUM ('customer','staff','admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE user_gender        AS ENUM ('male','female');           EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE salon_type         AS ENUM ('ladies','gents','mixed');  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE gender_served      AS ENUM ('ladies','gents','both');   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE gender_target      AS ENUM ('ladies','gents','both');   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE appt_status        AS ENUM ('pending','confirmed','in_progress','completed','cancelled','no_show'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE appt_product_type  AS ENUM ('included','optional','upgraded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE order_status       AS ENUM ('pending','confirmed','preparing','shipped','delivered','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_method     AS ENUM ('card','mada','applepay','stcpay','cash'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status     AS ENUM ('pending','paid','failed','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_source     AS ENUM ('appointment','order'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_type  AS ENUM ('booking_confirmed','reminder','review_request','order_update','stock_alert','booking_cancelled','new_booking'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- GROUP 3.1 — Users & Salons
-- ============================================================

-- 1. users -----------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL,
    phone       VARCHAR(20)  UNIQUE NOT NULL,
    email       VARCHAR(150) UNIQUE,
    role        user_role    NOT NULL DEFAULT 'customer',
    gender      user_gender,
    avatar_url  TEXT,
    fcm_token   TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE users IS 'Extends Supabase auth.users. OTP login via phone.';

-- 2. salons ----------------------------------------------------
CREATE TABLE IF NOT EXISTS salons (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(100) NOT NULL,
    name_en       VARCHAR(100),
    address       TEXT         NOT NULL,
    city          VARCHAR(60)  NOT NULL,
    type          salon_type   NOT NULL DEFAULT 'mixed',
    logo_url      TEXT,
    cover_url     TEXT,
    lat           DECIMAL(10,7) NOT NULL,
    lng           DECIMAL(10,7) NOT NULL,
    opening_time  TIME         NOT NULL DEFAULT '09:00',
    closing_time  TIME         NOT NULL DEFAULT '21:00',
    phone         VARCHAR(20),
    email         VARCHAR(120),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_role      ON users(role);
CREATE INDEX IF NOT EXISTS idx_salons_city     ON salons(city);
CREATE INDEX IF NOT EXISTS idx_salons_active   ON salons(is_active);
