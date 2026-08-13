import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'MoraSpirit Volunteer Application Portal',
    description:
        'Official volunteer application portal. Submit your details, academic information, and CV to apply for positions across various MoraSpirit pillars.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={`${inter.className} min-h-screen flex flex-col bg-zinc-50`}>
                {/* Public Header */}
                <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 relative shrink-0">
                                <Image
                                    src="/moraspirit-logo.svg"
                                    alt="MoraSpirit"
                                    fill
                                    sizes="28px"
                                    className="object-contain"
                                />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-zinc-900 leading-tight">MoraSpirit</p>
                                <p className="text-xs text-zinc-400 leading-tight hidden sm:block">Volunteer Recruitment</p>
                            </div>
                        </div>

                        <a
                            href="https://moraspirit.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
                        >
                            moraspirit.com
                        </a>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1">{children}</main>

                {/* Public Footer */}
                <footer className="bg-white border-t border-zinc-200 py-8 mt-auto">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 relative opacity-70">
                                    <Image
                                        src="/moraspirit-logo.svg"
                                        alt="MoraSpirit"
                                        fill
                                        sizes="24px"
                                        className="object-contain"
                                    />
                                </div>
                                <span className="text-sm font-semibold text-zinc-700">MoraSpirit</span>
                            </div>

                            <a
                                href="https://moraspirit.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                            >
                                moraspirit.com
                            </a>
                        </div>

                        <p className="text-xs text-zinc-400 text-center mt-6">
                            &copy; {new Date().getFullYear()} MoraSpirit. All rights reserved.
                        </p>
                    </div>
                </footer>
            </body>
        </html>
    );
}
