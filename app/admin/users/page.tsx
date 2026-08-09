import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import AdminUsersClient from './client-page';

// 1. FORCE NEXT.JS TO BYPASS THE CACHE AND READ THE LIVE COOKIE
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  let isSuperAdmin = false;

  try {
    // 2. Await the cookies promise (required in Next.js 15+)
    const cookieStore = await cookies();
    const token = cookieStore.get('ms-admin-token')?.value;

    if (!token) {
      console.log('🚨 PAGE LEVEL: No token cookie found! (Did the cookie path or name change?)');
    } else {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      
      console.log('✅ PAGE LEVEL: Decoded Payload:', payload);
      
      isSuperAdmin = payload.role === 'super_admin';
    }
  } catch (error) {
    console.error('🚨 PAGE LEVEL: JWT Verification Failed:', error);
  }

  // 3. If verification fails, redirect to /admin (which renders your login/dashboard screen)
  if (!isSuperAdmin) {
    console.log('🔄 PAGE LEVEL: isSuperAdmin is false. Redirecting to /admin');
    redirect('/admin');
  }

  // If they are a Super Admin, render the form!
  return <AdminUsersClient />;
}