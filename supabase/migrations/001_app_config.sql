-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

CREATE TABLE IF NOT EXISTS app_config (
    id INT PRIMARY KEY DEFAULT 1,
    app_name TEXT NOT NULL DEFAULT 'MoraSpirit Volunteer Recruitment',
    app_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT,
    app_description TEXT DEFAULT 'Join MoraSpirit and be part of our amazing team!',
    eligible_universities TEXT[] DEFAULT ARRAY['University of Moratuwa'],
    eligible_batches TEXT[] DEFAULT ARRAY['Batch 21', 'Batch 22', 'Batch 23', 'Batch 24', 'Batch 25'],
    eligible_faculties TEXT[] DEFAULT ARRAY[
        'Faculty of Engineering',
        'Faculty of Information Technology',
        'Faculty of Architecture',
        'Faculty of Business',
        'Faculty of Medicine',
        'NDT'
    ],
    index_number_hint TEXT DEFAULT 'e.g. 220123X',
    phone_hint TEXT DEFAULT 'e.g. 0712345678 or +94712345678',
    allow_multi_university BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default row (only if table is empty)
INSERT INTO app_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Enable RLS (service role key on the backend bypasses this)
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
