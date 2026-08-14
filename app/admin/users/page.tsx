import { redirect } from 'next/navigation';
import { getSuperAdminSession } from '@/lib/auth';
import AdminUsersClient from './client-page';

// Force Next.js to bypass the cache and read the live cookie
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await getSuperAdminSession();
  if (!session) redirect('/admin');

  return <AdminUsersClient />;
}