import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAdminSession } from '@/lib/auth';

const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

// GET: Fetch single application details
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const applicationId = resolvedParams.id;

        if (!(await getAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: application, error } = await supabaseAdmin
            .from('applications')
            .select(`
        *,
        application_pillars (
          pillars (
            name
          )
        )
      `)
            .eq('id', applicationId)
            .single();

        if (error || !application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, application }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH: Update status APPROVED/REJECTED + hr_notes
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const applicationId = resolvedParams.id;

        // 1. Verify token and extract Admin ID for the Audit Log
        const decodedAdmin = await getAdminSession();
        if (!decodedAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { status, hr_notes } = body;

        // Reject unknown statuses here rather than relying on the DB CHECK
        // constraint, which surfaces as an opaque 500.
        if (status !== undefined && !VALID_STATUSES.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        if (hr_notes !== undefined && hr_notes !== null && typeof hr_notes !== 'string') {
            return NextResponse.json({ error: 'Invalid hr_notes' }, { status: 400 });
        }

        // 2. Update the Application
        const { data, error } = await supabaseAdmin
            .from('applications')
            .update({
                status,
                hr_notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', applicationId)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
        }

        // 3. INSERT INTO AUDIT LOG (The previously missing step)
        const { error: auditError } = await supabaseAdmin
            .from('audit_logs')
            .insert({
                admin_id: decodedAdmin.id,
                action: `Updated status to ${status}`,
                application_id: applicationId,
            });

        if (auditError) {
            console.error('Failed to write to audit log:', auditError);
            // We don't necessarily want to fail the whole request if the audit log fails, 
            // but you can adjust this error handling based on your strictness requirements.
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}