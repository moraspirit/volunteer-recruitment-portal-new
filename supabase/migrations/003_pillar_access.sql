-- Per-university pillar availability.
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- pillar_access maps a university name to the pillar slugs it may apply for:
--   {"University of Moratuwa": ["marketing", "web-and-technology", ...], ...}
-- default_pillars is the fallback set used for any university with no explicit
-- entry — including custom names typed through the "Other" option.
ALTER TABLE app_config
    ADD COLUMN IF NOT EXISTS pillar_access   JSONB  DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS default_pillars TEXT[];

-- Seed the default set to every existing pillar so behaviour is unchanged
-- until an admin narrows it down.
UPDATE app_config
SET default_pillars = (SELECT array_agg(slug ORDER BY name) FROM pillars)
WHERE id = 1 AND default_pillars IS NULL;
