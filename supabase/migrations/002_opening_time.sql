-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Adds opening_time to the existing app_settings table

ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS opening_time TIMESTAMPTZ DEFAULT NULL;
