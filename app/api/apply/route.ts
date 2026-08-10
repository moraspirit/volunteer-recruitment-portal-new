import { NextResponse } from 'next/server';
import { applicationSchema } from '@/lib/validators';
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
      .select('closing_time, is_open')
      .single();

    if (settings) {
      // 1. Check if admin manually turned off the form
      if (settings.is_open === false) {
        return NextResponse.json(
          { error: 'Submissions are currently closed.' },
          { status: 403 }
        );
      }

      // 2. Check if the deadline has passed
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

    // 2. Verify Cloudflare Turnstile
    const secretKey = '1x0000000000000000000000000000000AA';
    const turnstileVerify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${turnstileToken}`,
    });

    const turnstileResult = await turnstileVerify.json();
    if (!turnstileResult.success) {
      return NextResponse.json({ error: 'Security check failed. Please try again.' }, { status: 400 });
    }

    // 3. Validate the JSON data securely
    const parsedData = JSON.parse(rawData);
    const validatedData = applicationSchema.parse(parsedData);

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

    // 6. Save the Pillar Selections (Resolve Pillar Names to UUIDs first)
    const { data: pillarsData, error: pillarsQueryError } = await supabaseAdmin
      .from('pillars')
      .select('id, name')
      .in('name', validatedData.pillars);

    if (pillarsQueryError || !pillarsData) {
      console.error('Pillar Lookup Error:', pillarsQueryError);
    } else {
      const pillarInserts = pillarsData.map((p) => ({
        application_id: appData.id, // Safe now because !appData is guarded above
        pillar_id: p.id,
      }));

      const { error: pillarError } = await supabaseAdmin
        .from('application_pillars')
        .insert(pillarInserts);

      if (pillarError) {
        console.error('Pillar Junction Error:', pillarError);
      }
    }

    return NextResponse.json({ success: true, applicationId: appData.id }, { status: 201 });

  } catch (error) {
    console.error('Submission Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}