import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Define protected routes
    // Protect EVERYTHING under /admin EXCEPT the specific login page
    const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login';
    const isAdminApiRoute = pathname.startsWith('/api/admin') && pathname !== '/api/admin/login';

    // 2. Verify the signature — a cookie merely being present proves nothing,
    // since anyone can set one. Everything below keys off the verified session.
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    const session = token ? await verifyToken(token) : null;

    // 3. Block protected routes without a valid session, clearing any junk or
    // expired cookie on the way out so the browser stops resending it.
    if (!session && (isAdminRoute || isAdminApiRoute)) {
        const response = isAdminApiRoute
            ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            : NextResponse.redirect(new URL('/admin/login', request.url));

        if (token) response.cookies.delete(ADMIN_COOKIE);
        return response;
    }

    // 4. If already logged in and trying to access the login page, redirect to
    // dashboard. Gated on the verified session, not the raw cookie — otherwise
    // an expired token bounces between /admin and /admin/login forever.
    if (pathname === '/admin/login' && session) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/api/admin/:path*'],
};
