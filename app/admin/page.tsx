import { redirect } from 'next/navigation';
import AdminTable from '@/components/AdminTable';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    // Verify the signature, not just that a cookie exists — this page returns
    // every applicant's PII, so the check has to actually mean something.
    const session = await getAdminSession();
    if (!session) redirect('/admin/login');

    const { data: applications, error } = await supabaseAdmin
        .from('applications')
        .select(`
            *,
            application_pillars (
                pillars ( name )
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Failed to fetch applications:', error);
    }

    // Point CV links at our own auth-gated endpoint, which mints a fresh 60 s
    // signed URL on every request. Never bake a signed URL into the page — it
    // expires long before the admin clicks it, and is already dead by the time
    // an exported CSV is opened.
    const appsWithUrls = (applications || []).map((app) => {
        const selectedPillars = app.application_pillars
            .map((ap: any) => ap.pillars?.name)
            .filter(Boolean)
            .join(', ');

        return {
            ...app,
            cvUrl: app.cv_path ? `/api/admin/cv/${app.id}` : null,
            selectedPillars,
        };
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Applications</h1>
                <p className="text-zinc-500 text-sm mt-1">
                    Review, filter, and manage all submitted volunteer applications.
                </p>
            </div>

            <AdminTable initialApplications={appsWithUrls} />
        </div>
    );
}
