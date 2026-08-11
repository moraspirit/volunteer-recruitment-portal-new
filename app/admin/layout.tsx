import Link from 'next/link';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import LogoutButton from '../../components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let isSuperAdmin = false;

    try {
        // FIX: In Next.js 15+, cookies() is a Promise and must be awaited
        const cookieStore = await cookies();
        const token = cookieStore.get('ms-admin-token')?.value;

        if (token) {
            // Verify and decode the JWT using jose
            const secret = new TextEncoder().encode(process.env.JWT_SECRET);
            const { payload } = await jwtVerify(token, secret);

            isSuperAdmin = payload.role === 'super_admin';
        }
    } catch (error: any) {
        if (error?.digest === 'DYNAMIC_SERVER_USAGE' || error?.message?.includes('Dynamic server usage')) {
            throw error;
        }
        console.error('Failed to verify JWT in layout:', error);
    }

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col">
            {/* --- TOP NAVIGATION BAR --- */}
            <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <nav className="flex items-center h-16 gap-8 w-full">
                        <span className="font-bold text-lg text-zinc-900 tracking-tight mr-4">
                            HR Portal
                        </span>

                        <Link
                            href="/admin"
                            className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/admin/settings"
                            className="text-zinc-600 hover:text-zinc-900 font-medium text-sm"
                        >
                            Settings
                        </Link>

                        {isSuperAdmin && (
                            <Link
                                href="/admin/users"
                                className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
                            >
                                Admins
                            </Link>
                        )}


                        {/* --- LOGOUT BUTTON --- */}
                        {/* The ml-auto class inside the button component pushes it to the far right */}
                        <div className="flex-1 flex justify-end">
                            <LogoutButton />
                        </div>
                    </nav>
                </div>
            </header>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-6">
                {children}
            </main>
        </div>
    );
}