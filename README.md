# Secure Volunteer Recruitment System

A secure, production-grade recruitment system built with Next.js (App Router), Tailwind CSS, TypeScript, Zod, and Supabase (Private Storage + Postgres). Designed with a **Zero Direct Access** security architecture where the frontend never communicates directly with the database.

---

## 🏗️ System Architecture & Security Principles

1. **Zero Direct Frontend Access**: 
   - The browser communicates strictly with Vercel API routes (Edge/Serverless functions).
   - Supabase keys (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`) are kept strictly server-side. 
   - Row Level Security (RLS) is configured to **DENY ALL** for public/anon/authenticated roles, ensuring total lockdown even if anon keys are leaked.
2. **File Security**:
   - CVs/Resumes are validated on the server for file type (magic bytes check for real PDF/DOCX files) and size (max 5MB).
   - Stored inside a **Private** Supabase storage bucket (`cvs`) and renamed securely using the pattern: `{index_number}_{timestamp}.ext`.
   - Admin downloads require a secure short-lived signed URL (60-second expiry) generated dynamically by the backend.
3. **Anti-Spam & Rate Limiting**:
   - Upstash Redis rate limiting enforces maximum submissions per IP address.
   - Cloudflare Turnstile token validation blocks automated spam bots.

---

## 📋 System Specifications & Form Fields

| Field Name | DB Column | Type | Required | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Batch** | `batch` | Dropdown | YES | Batch 21, 22, 23, 24, 25 |
| **First Name** | `first_name` | Text | YES | Applicant first name |
| **Last Name** | `last_name` | Text | YES | Applicant last name |
| **Index Number** | `index_number` | Text | YES | Primary unique student ID (e.g., `220126M`) |
| **Faculty** | `faculty` | Dropdown | YES | Faculty of Engineering, Information Technology, Architecture, Business, Medicine, NDT |
| **Department / Course** | `department` | Text | YES | e.g., CSE, Civil, Textile |
| **University** | `university` | Text | YES | Default: `University of Moratuwa` |
| **Email** | `email` | Email | YES | Valid email address, unique |
| **WhatsApp Mobile** | `whatsapp_number` | Phone | YES | `07XXXXXXXX` or `+94` international format |
| **Date of Birth** | `dob` | Date | YES | Calendar selector (`YYYY-MM-DD`) |
| **Address** | `address` | Textarea | YES | Residential address |
| **CV / Resume** | `cv_path` | File | YES | PDF/DOCX only, Max 5MB, saved to private storage |
| **Portfolio / LinkedIn URL** | `portfolio_url` | URL | NO | Optional external link |
| **Applied Pillars** | Junction Table | Multi-Checkbox | YES | Min 1, Max 3 selections from 11 available pillars |
| **Skills / Interests** | `interests` | Textarea | NO | Hobbies, technical skills, etc. |
| **Clubs / Societies** | `clubs` | Textarea | NO | Extra-curricular experiences |

---

## ⚙️ Database Configuration & Schema

Run the following script directly in your Supabase SQL Editor to set up master tables, junctions, and security policies:

```sql
-- 1. Pillars Master Table
CREATE TABLE pillars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL
);

INSERT INTO pillars (name, slug) VALUES
('Announcing and Hosting Pillar', 'announcing'),
('Corporate Development Pillar', 'corporate'),
('Creative Design Pillar', 'creative'),
('Editorial Pillar', 'editorial'),
('Financial Controlling Panel', 'finance'),
('Human Resources Management Pillar', 'hr'),
('Marketing Pillar', 'marketing'),
('Photography Pillar', 'photography'),
('Special Projects Pillar', 'special'),
('Video Editing & Live Streaming Pillar', 'video'),
('Web and Technology Pillar', 'web');

-- 2. Admin Users Table (Manual creation, no public signup)
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- bcrypt hashed
    role TEXT NOT NULL DEFAULT 'admin', -- super_admin, admin
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Main Applications Table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    index_number TEXT UNIQUE NOT NULL,
    faculty TEXT NOT NULL,
    department TEXT NOT NULL,
    university TEXT DEFAULT 'University of Moratuwa',
    email TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    dob DATE,
    address TEXT,
    cv_path TEXT NOT NULL,
    portfolio_url TEXT,
    interests TEXT,
    clubs TEXT,
    status TEXT DEFAULT 'PENDING',
    hr_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Junction Table for Pillars (Many-to-Many)
CREATE TABLE application_pillars (
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    pillar_id UUID REFERENCES pillars(id) ON DELETE CASCADE,
    PRIMARY KEY (application_id, pillar_id)
);

-- 5. Security: Enable RLS and Deny All Public Access
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all anon" ON applications FOR ALL TO anon USING (false);
CREATE POLICY "Deny all auth" ON applications FOR ALL TO authenticated USING (false);
CREATE POLICY "Deny all anon junction" ON application_pillars FOR ALL TO anon USING (false);
CREATE POLICY "Deny all auth junction" ON application_pillars FOR ALL TO authenticated USING (false);
CREATE POLICY "Deny all pillars" ON pillars FOR ALL TO anon USING (false);

```

---

## 🛠️ Local Setup Guide

Follow these steps to get the project running locally on your machine:

1. **Clone the Repository**:
```bash
git clone <repository-url>
cd recruitment-system

```


2. **Install Dependencies**:
```bash
npm install

```


3. **Configure Environment Variables**:
Create a `.env.local` file in the root directory and populate it with your private keys (ensure **NO** `NEXT_PUBLIC_` prefix is used for sensitive credentials):
```env
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
JWT_SECRET=your-random-64-character-jwt-secret
TURNSTILE_SECRET_KEY=your-cloudflare-turnstile-secret
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-cloudflare-turnstile-site-key
UPSTASH_REDIS_REST_URL=<your-upstash-redis-url>
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token

```


4. **Run Development Server**:
```bash
npm run dev

```


Open `localhost:3000` in your browser to view the public application form.

---

## 🚀 Next Steps & Deployment

The application requires **no VPS** and is built for seamless deployment on Vercel.

1. **Supabase & Storage Bucket Setup**:
* Create a new project on Supabase.
* Create a new storage bucket named `cvs` and mark it as **PRIVATE**.
* Execute the SQL schema configuration statements provided above.
* Manually insert your initial `super_admin` record into `admin_users` using a bcrypt hash generator for the password.


2. **Deploy to Vercel**:
* Push your codebase to a GitHub repository.
* Import the project into your Vercel Dashboard.
* Configure all required **Environment Variables** under Vercel Project Settings.
* Click **Deploy**.


3. **Post-Deployment Verification**:
* Test the public form submission workflow end-to-end.
* Attempt to access Supabase data directly from an unauthenticated client connection to verify that RLS policies block public access (`0 rows returned`).



