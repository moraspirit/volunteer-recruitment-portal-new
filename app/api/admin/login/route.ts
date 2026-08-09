import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { signToken } from '@/lib/auth';
import { loginRateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    // 1. Enforce Rate Limiting against brute-force attacks
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success } = await loginRateLimit.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // 2. Parse request body
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 3. Fetch admin user from Supabase using high-privilege admin client
    const { data: user, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 4. Verify password hash using bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 5. Generate secure JWT token
    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // 6. Return response and set secure HttpOnly cookie
    const response = NextResponse.json({ success: true }, { status: 200 });

    response.cookies.set({
      name: 'ms-admin-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60, // 2 hours
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}