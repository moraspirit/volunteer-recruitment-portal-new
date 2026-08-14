import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAdminSession } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const applicationId = resolvedParams.id;

        // 1. Verify Admin session via HttpOnly cookie
        if (!(await getAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch application cv_path from database
        const { data: app, error } = await supabaseAdmin
            .from('applications')
            .select('cv_path')
            .eq('id', applicationId)
            .single();

        if (error || !app || !app.cv_path) {
            return NextResponse.json({ error: 'CV not found' }, { status: 404 });
        }

        // 3. Generate strict 60-second signed URL as required by spec
        const { data: signedData, error: signError } = await supabaseAdmin.storage
            .from('cvs')
            .createSignedUrl(app.cv_path, 60);

        if (signError || !signedData?.signedUrl) {
            return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
        }

        // 4. Redirect to the secure signed URL
        return NextResponse.redirect(signedData.signedUrl);

    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}