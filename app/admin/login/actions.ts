'use server'

import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { signToken } from '@/lib/auth'
import { loginRateLimit } from '@/lib/rateLimit' // Import the rate limiter

export async function login(formData: FormData) {
    // 1. Enforce Rate Limiting (20 login attempts per hour)
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') ?? '127.0.0.1';

    const { success } = await loginRateLimit.limit(ip);
    if (!success) {
        return redirect('/admin/login?error=Too many login attempts. Please try again in an hour.');
    }

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // 2. Fetch user from the database
    const { data: user, error } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !user) {
        return redirect('/admin/login?error=Invalid email or password');
    }

    // 3. Verify the password hash
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
        return redirect('/admin/login?error=Invalid email or password');
    }

    // 4. Generate the JWT token
    const token = await signToken({
        id: user.id,
        email: user.email,
        role: user.role
    });

    // 5. Set the secure HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('ms-admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 2 * 60 * 60, // 2 hours
        path: '/',
    });

    redirect('/admin');
}