import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('ms-admin-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const decoded = (await verifyToken(token)) as any;
        if (!decoded || decoded.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const resolvedParams = await params;
        const targetId = resolvedParams.id;

        if (targetId === decoded.id) {
            return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('admin_users')
            .delete()
            .eq('id', targetId);

        if (error) {
            return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}