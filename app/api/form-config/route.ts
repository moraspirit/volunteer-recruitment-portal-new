import { NextResponse } from 'next/server';
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

export async function GET() {
    try {
        const { data } = await supabaseAdmin
            .from('app_config')
            .select('app_name,app_year,app_description,eligible_universities,eligible_batches,eligible_faculties,index_number_hint,phone_hint,allow_multi_university,pillar_access,default_pillars')
            .eq('id', 1)
            .single();

        return NextResponse.json(data ?? DEFAULTS, {
            headers: { 'Cache-Control': 'no-store' },
        });
    } catch {
        return NextResponse.json(DEFAULTS);
    }
}
