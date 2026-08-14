import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getSuperAdminSession as verifySuperAdmin } from '@/lib/auth';

// GET: List all admins (Super Admin only)
export async function GET() {
    const admin = await verifySuperAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized / Forbidden' }, { status: 403 });
    }

    const { data: users, error } = await supabaseAdmin
        .from('admin_users')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({ users }, { status: 200 });
}

// POST: Create a new admin (Super Admin only)
export async function POST(request: Request) {
    const admin = await verifySuperAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized / Forbidden' }, { status: 403 });
    }

    try {
        const { email, password, role } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);

        const { data, error } = await supabaseAdmin
            .from('admin_users')
            .insert({
                email,
                password_hash,
                role: role || 'admin',
                created_by: admin.id,
            })
            .select('id, email, role, created_at')
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'An admin with this email already exists' }, { status: 400 });
            }
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        return NextResponse.json({ success: true, user: data }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Remove an admin account (Super Admin only)
export async function DELETE(request: Request) {
    const admin = await verifySuperAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized / Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    if (id === admin.id) {
        return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
        .from('admin_users')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
}