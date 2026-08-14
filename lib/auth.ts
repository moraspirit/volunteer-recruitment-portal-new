import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'ms-admin-token';

export interface AdminSession {
    id: string;
    email: string;
    role: 'admin' | 'super_admin';
}

/**
 * There is deliberately no fallback secret. A hardcoded default that ships in
 * the repo lets anyone forge a super_admin token, so a missing JWT_SECRET must
 * be a hard failure rather than a silent downgrade.
 *
 * Read lazily so a missing variable surfaces as a failed request (fail closed)
 * instead of breaking the build.
 */
function getKey(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error(
            'JWT_SECRET is missing or shorter than 32 characters. Set it in your environment — ' +
            'generate one with: openssl rand -base64 48'
        );
    }
    return new TextEncoder().encode(secret);
}

export async function signToken(payload: AdminSession) {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h') // Spec requirement: Auto logout 2 hours
        .sign(getKey());
}

/**
 * Verifies a token and returns the session, or null if it is missing, expired,
 * tampered with, or signed with a different key. Never throws — every failure
 * path denies access.
 */
export async function verifyToken(token: string): Promise<AdminSession | null> {
    try {
        const { payload } = await jwtVerify(token, getKey(), { algorithms: ['HS256'] });

        // A token is only useful if it actually carries an identity and a role
        // we recognise; anything else is treated as unauthenticated.
        const { id, email, role } = payload as Record<string, unknown>;
        if (typeof id !== 'string' || typeof email !== 'string') return null;
        if (role !== 'admin' && role !== 'super_admin') return null;

        return { id, email, role };
    } catch (error) {
        console.error('JWT verification failed:', error instanceof Error ? error.message : error);
        return null;
    }
}

/**
 * Session for the current request, verified. For use in route handlers and
 * server components — middleware must use verifyToken directly, since
 * next/headers is unavailable on the Edge runtime.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
    const token = (await cookies()).get(ADMIN_COOKIE)?.value;
    if (!token) return null;
    return verifyToken(token);
}

/** Session for the current request, but only if the admin is a super_admin. */
export async function getSuperAdminSession(): Promise<AdminSession | null> {
    const session = await getAdminSession();
    return session?.role === 'super_admin' ? session : null;
}
