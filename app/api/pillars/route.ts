import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
    try {
        const { data: pillars, error } = await supabaseAdmin
            .from('pillars')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch pillars' }, { status: 500 });
        }

        return NextResponse.json({ pillars }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}