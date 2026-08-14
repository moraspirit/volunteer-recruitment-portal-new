import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAdminSession } from '@/lib/auth';

export async function PATCH(request: Request) {
    // Middleware already gates /api/admin/*, but this route decides whether the
    // form is open to the public — re-check here so it is never one middleware
    // matcher edit away from being wide open.
    const session = await getAdminSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { closing_time, opening_time, is_open } = body;

        if (typeof is_open !== 'boolean' && is_open !== undefined && is_open !== null) {
            return NextResponse.json({ error: 'is_open must be a boolean' }, { status: 400 });
        }

        // Reject unparseable dates rather than storing "Invalid Date", which
        // would silently disable the deadline check in /api/apply.
        const toIso = (value: unknown, field: string): string | null => {
            if (!value) return null;
            const date = new Date(value as string);
            if (Number.isNaN(date.getTime())) throw new Error(`Invalid ${field}`);
            return date.toISOString();
        };

        const { error } = await supabaseAdmin
            .from('app_settings')
            .upsert({
                id: 1,
                closing_time: toIso(closing_time, 'closing_time'),
                opening_time: toIso(opening_time, 'opening_time'),
                is_open,
            });

        if (error) {
            console.error('Supabase Error:', error);
            return NextResponse.json(
                { error: 'Failed to update application settings.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: 'Settings updated successfully' });
    } catch (error: any) {
        if (error?.message?.startsWith('Invalid ')) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error('Error updating settings:', error);
        return NextResponse.json(
            { error: 'Failed to update application settings.' },
            { status: 500 }
        );
    }
}
