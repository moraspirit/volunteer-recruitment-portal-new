import { NextResponse } from 'next/server';
import { applicationSchema } from '@/lib/validators';
import { allowedPillarSlugs } from '@/lib/pillarAccess';
import { applyRateLimit } from '@/lib/rateLimit';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Make sure this is in your .env.local file
);

// Helper function to check Magic Bytes
function isValidFileType(buffer: Uint8Array): boolean {
  // Check for PDF (%PDF)
  if (buffer.length > 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return true;
  }
  // Check for DOCX (PK\x03\x04 ZIP archive format)
  if (buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return true;
  }
  return false;
}

export async function POST(request: Request) {
  try {
    // Extract the IP address from headers (Vercel provides x-forwarded-for)
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success } = await applyRateLimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many submissions from this IP. Please try again later.' },
        { status: 429 }
      );
    }

    // --- SYSTEM DEADLINE CHECK ---
    const { data: settings } = await supabaseAdmin
      .from('app_settings')
      .select('closing_time, opening_time, is_open')
      .single();

    if (settings) {
      // 1. Check if admin manually turned off the form
      if (settings.is_open === false) {
        return NextResponse.json(
          { error: 'Submissions are currently closed.' },
          { status: 403 }
        );
      }

      // 2. Check if applications haven't opened yet
      if (settings.opening_time && new Date() < new Date(settings.opening_time)) {
        return NextResponse.json(
          { error: 'Applications are not open yet.' },
          { status: 403 }
        );
      }

      // 3. Check if the deadline has passed
      if (settings.closing_time && new Date() > new Date(settings.closing_time)) {
        return NextResponse.json(
          { error: 'The application deadline has passed.' },
          { status: 403 }
        );
      }
    }

    const formData = await request.formData();

    const cvFile = formData.get('cv') as File | null;
    const turnstileToken = formData.get('turnstileToken') as string | null;
    const rawData = formData.get('data') as string | null;

    if (!cvFile || !turnstileToken || !rawData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Strict File Validation (Size & Magic Bytes)
    if (cvFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    const arrayBuffer = await cvFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    if (!isValidFileType(buffer)) {
      return NextResponse.json({ error: 'Invalid file type. Only real PDF or DOCX allowed.' }, { status: 400 });
    }

    // 2. Verify Cloudflare Turnstile.
    // No fallback secret: '1x0000...AA' is Cloudflare's test key, which approves
    // every token. Defaulting to it would silently disable bot protection if the
    // variable were ever missing in production.
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.error('TURNSTILE_SECRET_KEY is not set — refusing to accept submissions.');
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // URLSearchParams encodes the values; string interpolation would let a
    // crafted token inject extra form fields and override the secret.
    const turnstileVerify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: secretKey, response: turnstileToken }),
    });

    const turnstileResult = await turnstileVerify.json();
    if (!turnstileResult.success) {
      return NextResponse.json({ error: 'Security check failed. Please try again.' }, { status: 400 });
    }

    // 3. Validate the JSON data securely
    const parsedData = JSON.parse(rawData);
    const validatedData = applicationSchema.parse(parsedData);

    // 3b. Enforce per-university pillar access.
    // The form only *displays* the permitted pillars; this is the check that
    // actually enforces it, so a crafted request can't apply to a pillar its
    // university was never offered. Runs before the upload so a rejected
    // submission never leaves an orphaned CV in storage.
    const [{ data: pillarRows }, { data: accessConfig }] = await Promise.all([
      supabaseAdmin.from('pillars').select('id, name, slug'),
      supabaseAdmin.from('app_config').select('pillar_access, default_pillars').eq('id', 1).single(),
    ]);

    if (!pillarRows?.length) {
      console.error('Pillar lookup returned nothing');
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const allowed = new Set(
      allowedPillarSlugs(
        validatedData.university,
        accessConfig?.pillar_access,
        accessConfig?.default_pillars,
        pillarRows.map((p) => p.slug),
      ),
    );

    // Resolve submitted names → rows, rejecting anything unknown or not offered
    // to this university. Deduplicated so the same pillar can't be sent 3 times.
    const requested = [...new Set(validatedData.pillars)];
    const matched = requested.map((name) => pillarRows.find((p) => p.name === name));

    if (matched.some((p) => !p || !allowed.has(p.slug))) {
      return NextResponse.json(
        { error: 'One or more selected pillars are not available for your university.' },
        { status: 400 }
      );
    }

    const selectedPillarRows = matched as { id: string; name: string; slug: string }[];

    // 4. Upload CV to private bucket with secure naming convention
    const fileExt = cvFile.name.split('.').pop();
    const fileName = `${validatedData.indexNumber}_${Date.now()}.${fileExt}`;

    const { data: storageData, error: storageError } = await supabaseAdmin
      .storage
      .from('cvs')
      .upload(fileName, buffer, {
        contentType: cvFile.type,
        upsert: false
      });

    if (storageError) {
      console.error('Storage Error:', storageError);
      return NextResponse.json({ error: 'Failed to upload CV' }, { status: 500 });
    }

    // 5. Save Application to the Database
    const { data: appData, error: appError } = await supabaseAdmin
      .from('applications')
      .insert({
        batch: validatedData.batch,
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        index_number: validatedData.indexNumber,
        faculty: validatedData.faculty,
        department: validatedData.department,
        university: validatedData.university,
        email: validatedData.email,
        whatsapp_number: validatedData.whatsappNumber,
        dob: validatedData.dob,
        address: validatedData.address,
        cv_path: storageData.path,
        portfolio_url: validatedData.portfolioUrl || null,
        interests: validatedData.interests || null,
        clubs: validatedData.clubs || null,
      })
      .select('id')
      .single();

    if (appError || !appData) {
      await supabaseAdmin.storage.from('cvs').remove([storageData.path]);
      console.error('Database Error:', appError);
      if (appError?.code === '23505') {
        return NextResponse.json({ error: 'An application with this Index Number or Email already exists.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to save application' }, { status: 500 });
    }

    // 6. Save the Pillar Selections (already resolved and authorised in step 3b)
    const { error: pillarError } = await supabaseAdmin
      .from('application_pillars')
      .insert(
        selectedPillarRows.map((p) => ({
          application_id: appData.id, // Safe now because !appData is guarded above
          pillar_id: p.id,
        }))
      );

    // An application with no pillars is useless to reviewers, so roll the whole
    // thing back rather than leaving a half-saved record behind.
    if (pillarError) {
      console.error('Pillar Junction Error:', pillarError);
      await supabaseAdmin.from('applications').delete().eq('id', appData.id);
      await supabaseAdmin.storage.from('cvs').remove([storageData.path]);
      return NextResponse.json({ error: 'Failed to save application' }, { status: 500 });
    }

    return NextResponse.json({ success: true, applicationId: appData.id }, { status: 201 });

  } catch (error) {
    console.error('Submission Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}