'use client';

import { useState, useEffect } from 'react';

export default function AdminDeadlineSettings() {
    const [closingTime, setClosingTime] = useState('');
    const [isOpen, setIsOpen] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Fetch the current settings on mount
    useEffect(() => {
        const fetchCurrentSettings = async () => {
            try {
                const res = await fetch('/api/settings', { cache: 'no-store' });
                const data = await res.json();

                if (data) {
                    // The '?? false' ensures this never becomes undefined
                    setIsOpen(data.is_open ?? false);

                    if (data.closing_time) {
                        // Convert to YYYY-MM-DDThh:mm format for the datetime-local input
                        const dateObj = new Date(data.closing_time);
                        const localFormat = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
                            .toISOString()
                            .slice(0, 16);
                        setClosingTime(localFormat);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            }
        };
        fetchCurrentSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    closing_time: closingTime || null,
                    is_open: isOpen
                }),
            });

            if (!res.ok) throw new Error('Failed to update');

            setMessage({ type: 'success', text: 'Deadline updated successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Error saving settings. Try again.' });
        } finally {
            setIsSaving(false);
            // Auto-hide message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        }
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-zinc-200 w-full">
            <h2 className="text-xl font-semibold text-zinc-900 mb-6">Application Status</h2>

            <div className="space-y-6">
                {/* Toggle Open/Closed Override */}
                <div className="flex items-center justify-between p-4 bg-zinc-50/50 rounded-xl border border-zinc-100">
                    <div>
                        <p className="font-medium text-sm text-zinc-900">Accepting Applications</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Master switch to manually open or close the form.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={!!isOpen}
                            onChange={(e) => setIsOpen(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900 hover:bg-zinc-300 peer-checked:hover:bg-zinc-800"></div>
                    </label>
                </div>

                {/* Deadline Picker */}
                <div>
                    <label className="block text-sm font-medium text-zinc-900 mb-2">
                        Closing Date & Time
                    </label>
                    <input
                        type="datetime-local"
                        value={closingTime}
                        onChange={(e) => setClosingTime(e.target.value)}
                        className="w-full h-11 px-3 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all shadow-sm"
                    />
                </div>

                <div className="pt-2">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full h-11 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-sm"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                {message && (
                    <p className={`text-sm text-center font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {message.text}
                    </p>
                )}
            </div>
        </div>
    );
}