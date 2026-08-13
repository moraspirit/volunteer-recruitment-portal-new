import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const DEFAULTS = {
    app_name: 'MoraSpirit Volunteer Recruitment',
    app_year: new Date().getFullYear(),
    app_description: 'Join MoraSpirit and be part of our amazing team!',
    eligible_universities: ['University of Moratuwa'],
    eligible_batches: ['Batch 21', 'Batch 22', 'Batch 23', 'Batch 24', 'Batch 25'],
    eligible_faculties: [
        'Faculty of Engineering',
        'Faculty of Information Technology',
        'Faculty of Architecture',
        'Faculty of Business',
        'Faculty of Medicine',
        'NDT',
    ],
    index_number_hint: 'e.g. 220123X',
    phone_hint: 'e.g. 0712345678 or +94712345678',
    allow_multi_university: false,
};

async function getAdminPayload() {
    const cookieStore = await cookies();
    const token = cookieStore.get('ms-admin-token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function GET() {
    const payload = await getAdminPayload();
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { data } = await supabaseAdmin
            .from('app_config')
            .select('*')
            .eq('id', 1)
            .single();

        return NextResponse.json(data ?? DEFAULTS);
    } catch {
        return NextResponse.json(DEFAULTS);
    }
}

export async function PATCH(request: Request) {
    const payload = await getAdminPayload();
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();

        const { error } = await supabaseAdmin
            .from('app_config')
            .upsert({ id: 1, ...body, updated_at: new Date().toISOString() });

        if (error) {
            console.error('Config update error:', error);
            return NextResponse.json({ error: 'Failed to update config. Run the migration SQL first.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Config update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
