import Link from 'next/link';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import Image from 'next/image';
import LogoutButton from '../../components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    let isSuperAdmin = false;

    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('ms-admin-token')?.value;
        if (token) {
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
            {/* Top Navigation */}
            <header className="bg-white border-b border-zinc-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <nav className="flex items-center h-16 gap-1 w-full">
                        {/* Brand */}
                        <Link href="/admin" className="flex items-center gap-2.5 mr-4 shrink-0">
                            <div className="w-8 h-8 relative">
                                <Image
                                    src="/Moraspirit logo transparent.png"
                                    alt="MoraSpirit"
                                    fill
                                    sizes="32px"
                                    className="object-contain"
                                />
                            </div>
                            <div className="hidden sm:block">
                                <p className="font-bold text-sm text-zinc-900 leading-tight">MoraSpirit</p>
                                <p className="text-xs text-zinc-400 leading-tight">HR Portal</p>
                            </div>
                        </Link>

                        <div className="hidden sm:block h-5 w-px bg-zinc-200 mx-2" />

                        {/* Nav links */}
                        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
                            <NavLink href="/admin">Applications</NavLink>
                            <NavLink href="/admin/config">Configuration</NavLink>
                            <NavLink href="/admin/settings">Settings</NavLink>
                            {isSuperAdmin && <NavLink href="/admin/users">Admins</NavLink>}
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                            <a
                                href="/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden md:flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 px-2 py-1.5 rounded-md hover:bg-zinc-100 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                View Form
                            </a>
                            <LogoutButton />
                        </div>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-zinc-100 py-4 mt-auto">
                <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 relative opacity-50">
                            <Image
                                src="/Moraspirit logo transparent.png"
                                alt="MoraSpirit"
                                fill
                                sizes="16px"
                                className="object-contain"
                            />
                        </div>
                        <span className="text-xs text-zinc-400">
                            &copy; {new Date().getFullYear()} MoraSpirit. All rights reserved.
                        </span>
                    </div>
                    <a
                        href="https://moraspirit.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                        moraspirit.com
                    </a>
                </div>
            </footer>
        </div>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="px-3 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors whitespace-nowrap"
        >
            {children}
        </Link>
    );
}
