-- ============================================================
-- FULL INITIAL SETUP — run this first in Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → Run)
-- ============================================================

-- 1. Pillars master table
CREATE TABLE IF NOT EXISTS pillars (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE
);

-- 2. Admin users
CREATE TABLE IF NOT EXISTS admin_users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    created_by    UUID REFERENCES admin_users(id),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Applications
CREATE TABLE IF NOT EXISTS applications (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch          TEXT,
    first_name     TEXT NOT NULL,
    last_name      TEXT NOT NULL,
    index_number   TEXT NOT NULL UNIQUE,
    faculty        TEXT,
    department     TEXT,
    university     TEXT DEFAULT 'University of Moratuwa',
    email          TEXT NOT NULL UNIQUE,
    whatsapp_number TEXT,
    dob            DATE,
    address        TEXT,
    cv_path        TEXT,
    portfolio_url  TEXT,
    interests      TEXT,
    clubs          TEXT,
    status         TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    hr_notes       TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Application ↔ Pillar junction
CREATE TABLE IF NOT EXISTS application_pillars (
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    pillar_id      UUID REFERENCES pillars(id)      ON DELETE CASCADE,
    PRIMARY KEY (application_id, pillar_id)
);

-- 5. Global app settings (single row, id = 1)
CREATE TABLE IF NOT EXISTS app_settings (
    id           INT  PRIMARY KEY DEFAULT 1,
    closing_time TIMESTAMPTZ,
    opening_time TIMESTAMPTZ,
    is_open      BOOLEAN DEFAULT TRUE
);

INSERT INTO app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 6. Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id       UUID REFERENCES admin_users(id),
    action         TEXT,
    application_id UUID REFERENCES applications(id),
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Application configuration (per recruitment cycle)
CREATE TABLE IF NOT EXISTS app_config (
    id                    INT PRIMARY KEY DEFAULT 1,
    app_name              TEXT    NOT NULL DEFAULT 'MoraSpirit Volunteer Recruitment',
    app_year              INT              DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT,
    app_description       TEXT             DEFAULT 'Join MoraSpirit and be part of our amazing team!',
    eligible_universities TEXT[]           DEFAULT ARRAY['University of Moratuwa'],
    eligible_batches      TEXT[]           DEFAULT ARRAY['Batch 21','Batch 22','Batch 23','Batch 24','Batch 25'],
    eligible_faculties    TEXT[]           DEFAULT ARRAY[
                              'Faculty of Engineering',
                              'Faculty of Information Technology',
                              'Faculty of Architecture',
                              'Faculty of Business',
                              'Faculty of Medicine',
                              'NDT'
                          ],
    index_number_hint     TEXT             DEFAULT 'e.g. 220123X',
    phone_hint            TEXT             DEFAULT 'e.g. 0712345678 or +94712345678',
    allow_multi_university BOOLEAN         DEFAULT FALSE,
    updated_at            TIMESTAMPTZ      DEFAULT NOW()
);

INSERT INTO app_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all tables (backend uses service role key which bypasses RLS)
ALTER TABLE pillars             ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config          ENABLE ROW LEVEL SECURITY;

-- Seed default pillars.
-- Slugs are the stable identifier used by app_config.pillar_access and by the
-- form's fallback list, so they must match across a fresh install and prod.
INSERT INTO pillars (name, slug) VALUES
    ('Announcing and Hosting Pillar',        'announcing'),
    ('Corporate Development Pillar',         'corporate'),
    ('Creative Design Pillar',               'creative'),
    ('Editorial Pillar',                     'editorial'),
    ('Financial Controlling Panel',          'finance'),
    ('Human Resources Management Pillar',    'hr'),
    ('Marketing Pillar',                     'marketing'),
    ('Photography Pillar',                   'photography'),
    ('Special Projects Pillar',              'special'),
    ('Video Editing & Live Streaming Pillar','video'),
    ('Web and Technology Pillar',            'web')
ON CONFLICT (name) DO NOTHING;
