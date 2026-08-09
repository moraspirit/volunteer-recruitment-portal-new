import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import AdminTable from '@/components/AdminTable';
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // <-- Using the secure admin client

async function logout() {
  'use server';
  const cookieStore = await cookies();
  cookieStore.delete('ms-admin-token'); 
  redirect('/admin/login');
}


export default async function AdminDashboard() {
  // Fetch applications and join with pillars using supabaseAdmin
  const { data: applications, error } = await supabaseAdmin
    .from('applications')
    .select(`
      *,
      application_pillars (
        pillars (
          name
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch applications:', error);
  }

  // Generate secure signed URLs using supabaseAdmin
  const appsWithUrls = await Promise.all(
    (applications || []).map(async (app) => {
      let cvUrl = null;
      if (app.cv_path) {
        const { data } = await supabaseAdmin.storage
          .from('cvs')
          .createSignedUrl(app.cv_path, 60); // Strict 60s expiry
        cvUrl = data?.signedUrl;
      }

      const selectedPillars = app.application_pillars
        .map((ap: any) => ap.pillars?.name)
        .filter(Boolean)
        .join(', ');

      return { ...app, cvUrl, selectedPillars };
    })
  );

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="items-center mb-8">
            <h1 className="text-3xl font-bold text-zinc-900">Admin Dashboard</h1>
            <p className="text-zinc-500 mt-1">Review volunteer applications</p>
        </div>

        {/* Interactive Data Table Component */}
        <AdminTable initialApplications={appsWithUrls} />

      </div>
    </div>
  );
}