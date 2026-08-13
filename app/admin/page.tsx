import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminTable from '@/components/AdminTable';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function AdminDashboard() {
    const cookieStore = await cookies();
    const token = cookieStore.get('ms-admin-token')?.value;
    if (!token) redirect('/admin/login');

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

    // Attach signed CV URLs (60 s expiry, generated server-side)
    const appsWithUrls = await Promise.all(
        (applications || []).map(async (app) => {
            let cvUrl: string | null = null;
            if (app.cv_path) {
                const { data } = await supabaseAdmin.storage
                    .from('cvs')
                    .createSignedUrl(app.cv_path, 60);
                cvUrl = data?.signedUrl ?? null;
            }

            const selectedPillars = app.application_pillars
                .map((ap: any) => ap.pillars?.name)
                .filter(Boolean)
                .join(', ');

            return { ...app, cvUrl, selectedPillars };
        })
    );

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
