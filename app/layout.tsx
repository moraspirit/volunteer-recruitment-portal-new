import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Here is the metadata you asked for earlier!
export const metadata: Metadata = {
  title: 'MoraSpirit Volunteer Application Portal',
  description: 'Official volunteer application portal. Submit your details, academic information, and CV to apply for positions across Web Development, Event Management, Public Relations, and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* min-h-screen flex flex-col ensures the footer is always pushed to the bottom */}
      <body className={`${inter.className} min-h-screen flex flex-col bg-zinc-50/50`}>
        
        {/* Main Page Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="w-full py-6 mt-12 border-t border-zinc-200 bg-white text-center">
          <p className="text-xs text-zinc-500 font-medium">
            &copy; {new Date().getFullYear()} MoraSpirit Volunteer Application Portal. All rights reserved.
          </p>
        </footer>
        
      </body>
    </html>
  );
}