import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
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
    pillar_access: {} as Record<string, string[]>,
    default_pillars: null as string[] | null,
};

// Only these columns may be written through this endpoint. Spreading the raw
// request body into the upsert would let a caller set any column on the row.
const WRITABLE_FIELDS = Object.keys(DEFAULTS);

export async function GET() {
    const payload = await getAdminSession();
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
    const payload = await getAdminSession();
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();

        const updates: Record<string, unknown> = {};
        for (const field of WRITABLE_FIELDS) {
            if (body[field] !== undefined) updates[field] = body[field];
        }

        const { error } = await supabaseAdmin
            .from('app_config')
            .upsert({ id: 1, ...updates, updated_at: new Date().toISOString() });

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
