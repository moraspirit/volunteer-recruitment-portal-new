'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
    const router = useRouter();

    // Inside app/admin/LogoutButton.tsx
    const handleLogout = async () => {
        try {
            await fetch('/api/admin/logout', { method: 'POST' });

            router.push('/admin/login');
            router.refresh();
        } catch (error) {
            console.error('Failed to logout:', error);
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors ml-auto"
        >
            Logout
        </button>
    );
}