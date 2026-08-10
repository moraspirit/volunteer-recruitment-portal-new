import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a server-side Supabase client using the secure service role key
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { closing_time, is_open } = body;

        // Use upsert to guarantee ID 1 gets updated or created
        const { error } = await supabaseAdmin
            .from('app_settings')
            .upsert({
                id: 1,
                closing_time: closing_time ? new Date(closing_time).toISOString() : null,
                is_open: is_open
            });

        if (error) {
            console.error("Supabase Error:", error);
            throw error;
        }

        return NextResponse.json({ message: 'Settings updated successfully' });
    } catch (error: any) {
        console.error("Error updating settings:", error);
        return NextResponse.json(
            { error: 'Failed to update application settings.' },
            { status: 500 }
        );
    }
}