import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Define protected routes
    // Protect EVERYTHING under /admin EXCEPT the specific login page
    const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login';
    const isAdminApiRoute = pathname.startsWith('/api/admin') && pathname !== '/api/admin/login';

    // 2. Check for the standardized HttpOnly cookie
    const token = request.cookies.get('ms-admin-token')?.value;

    // 3. If accessing a protected route without a token, redirect to the login page
    if (isAdminRoute && !token) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    if (isAdminApiRoute && !token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 4. If already logged in and trying to access the login page, redirect to dashboard
    if (pathname === '/admin/login' && token) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/api/admin/:path*'],
};