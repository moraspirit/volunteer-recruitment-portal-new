'use client';

import { useState, useEffect } from 'react';

const ALL_UNIVERSITIES = [
    'University of Moratuwa',
    'University of Colombo',
    'University of Peradeniya',
    'University of Sri Jayewardenepura',
    'University of Kelaniya',
    'University of Ruhuna',
    'University of Jaffna',
    'Eastern University',
    'Rajarata University',
    'Sabaragamuwa University',
    'South Eastern University',
    'Wayamba University',
    'Uva Wellassa University',
    'Open University of Sri Lanka',
    'SLIIT',
    'NSBM Green University',
    'IIT (Informatics Institute of Technology)',
    'CINEC Campus',
    'APIIT Sri Lanka',
];

const DEFAULT_FACULTIES = [
    'Faculty of Engineering',
    'Faculty of Information Technology',
    'Faculty of Architecture',
    'Faculty of Business',
    'Faculty of Medicine',
    'NDT',
];

interface AppConfig {
    app_name: string;
    app_year: number;
    app_description: string;
    eligible_universities: string[];
    eligible_batches: string[];
    eligible_faculties: string[];
    index_number_hint: string;
    phone_hint: string;
    allow_multi_university: boolean;
}

export default function AppConfigManager() {
    const [config, setConfig] = useState<AppConfig>({
        app_name: 'MoraSpirit Volunteer Recruitment',
        app_year: new Date().getFullYear(),
        app_description: 'Join MoraSpirit and be part of our amazing team!',
        eligible_universities: ['University of Moratuwa'],
        eligible_batches: ['Batch 21', 'Batch 22', 'Batch 23', 'Batch 24', 'Batch 25'],
        eligible_faculties: [...DEFAULT_FACULTIES],
        index_number_hint: 'e.g. 220123X',
        phone_hint: 'e.g. 0712345678 or +94712345678',
        allow_multi_university: false,
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Batch editing
    const [newBatch, setNewBatch] = useState('');
    const [newFaculty, setNewFaculty] = useState('');
    const [newUniversity, setNewUniversity] = useState('');

    useEffect(() => {
        fetch('/api/admin/config', { cache: 'no-store' })
            .then((r) => r.json())
            .then((data) => {
                if (!data.error) setConfig(data);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/config', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage({ type: 'success', text: 'Configuration saved successfully!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to save configuration.' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 4000);
        }
    };

    const toggleUniversity = (uni: string) => {
        setConfig((prev) => ({
            ...prev,
            eligible_universities: prev.eligible_universities.includes(uni)
                ? prev.eligible_universities.filter((u) => u !== uni)
                : [...prev.eligible_universities, uni],
        }));
    };

    const addCustomUniversity = () => {
        const val = newUniversity.trim();
        if (!val || config.eligible_universities.includes(val)) return;
        setConfig((prev) => ({ ...prev, eligible_universities: [...prev.eligible_universities, val] }));
        setNewUniversity('');
    };

    const removeBatch = (b: string) =>
        setConfig((prev) => ({ ...prev, eligible_batches: prev.eligible_batches.filter((x) => x !== b) }));

    const addBatch = () => {
        const val = newBatch.trim();
        if (!val || config.eligible_batches.includes(val)) return;
        setConfig((prev) => ({ ...prev, eligible_batches: [...prev.eligible_batches, val] }));
        setNewBatch('');
    };

    const removeFaculty = (f: string) =>
        setConfig((prev) => ({ ...prev, eligible_faculties: prev.eligible_faculties.filter((x) => x !== f) }));

    const addFaculty = () => {
        const val = newFaculty.trim();
        if (!val || config.eligible_faculties.includes(val)) return;
        setConfig((prev) => ({ ...prev, eligible_faculties: [...prev.eligible_faculties, val] }));
        setNewFaculty('');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Application Setup */}
            <section className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-zinc-900 mb-4">Application Setup</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Application Name</label>
                            <input
                                type="text"
                                value={config.app_name}
                                onChange={(e) => setConfig((p) => ({ ...p, app_name: e.target.value }))}
                                className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                                placeholder="MoraSpirit Volunteer Recruitment"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Year</label>
                            <input
                                type="number"
                                value={config.app_year}
                                onChange={(e) => setConfig((p) => ({ ...p, app_year: parseInt(e.target.value) || p.app_year }))}
                                className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Application Description</label>
                        <textarea
                            value={config.app_description}
                            onChange={(e) => setConfig((p) => ({ ...p, app_description: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none"
                            placeholder="Short description shown on the application form..."
                        />
                    </div>
                </div>
            </section>

            {/* University Configuration */}
            <section className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-base font-semibold text-zinc-900">Eligible Universities</h2>
                        <p className="text-sm text-zinc-500 mt-0.5">Select which universities can apply this cycle.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Multi-university</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={config.allow_multi_university}
                                onChange={(e) => setConfig((p) => ({ ...p, allow_multi_university: e.target.checked }))}
                            />
                            <div className="w-9 h-5 bg-zinc-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900" />
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {ALL_UNIVERSITIES.map((uni) => (
                        <label key={uni} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-zinc-100 hover:bg-zinc-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.eligible_universities.includes(uni)}
                                onChange={() => toggleUniversity(uni)}
                                className="rounded border-zinc-300 text-zinc-900"
                            />
                            <span className="text-sm text-zinc-700">{uni}</span>
                        </label>
                    ))}
                </div>

                <div className="flex gap-2 mt-3">
                    <input
                        type="text"
                        value={newUniversity}
                        onChange={(e) => setNewUniversity(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCustomUniversity()}
                        placeholder="Add custom university..."
                        className="flex-1 h-9 px-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                    <button
                        onClick={addCustomUniversity}
                        className="px-3 h-9 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-700"
                    >
                        Add
                    </button>
                </div>

                {config.eligible_universities.filter((u) => !ALL_UNIVERSITIES.includes(u)).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {config.eligible_universities
                            .filter((u) => !ALL_UNIVERSITIES.includes(u))
                            .map((uni) => (
                                <span key={uni} className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-full text-xs">
                                    {uni}
                                    <button onClick={() => toggleUniversity(uni)} className="text-zinc-400 hover:text-zinc-700">&times;</button>
                                </span>
                            ))}
                    </div>
                )}
            </section>

            {/* Batch Configuration */}
            <section className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-zinc-900 mb-1">Eligible Batches</h2>
                <p className="text-sm text-zinc-500 mb-4">Configure which student batches can apply.</p>

                <div className="flex flex-wrap gap-2 mb-4">
                    {config.eligible_batches.map((b) => (
                        <span key={b} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 text-zinc-800 rounded-full text-sm font-medium">
                            {b}
                            <button onClick={() => removeBatch(b)} className="text-zinc-400 hover:text-red-500 ml-0.5 leading-none">&times;</button>
                        </span>
                    ))}
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newBatch}
                        onChange={(e) => setNewBatch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addBatch()}
                        placeholder='e.g. "Batch 26" or "2024/25"'
                        className="flex-1 h-9 px-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                    <button onClick={addBatch} className="px-3 h-9 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-700">
                        Add
                    </button>
                </div>
            </section>

            {/* Faculty Configuration */}
            <section className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-zinc-900 mb-1">Faculties / Departments</h2>
                <p className="text-sm text-zinc-500 mb-4">Configure the faculty options shown in the application form.</p>

                <div className="flex flex-wrap gap-2 mb-4">
                    {config.eligible_faculties.map((f) => (
                        <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 text-zinc-800 rounded-full text-sm font-medium">
                            {f}
                            <button onClick={() => removeFaculty(f)} className="text-zinc-400 hover:text-red-500 ml-0.5 leading-none">&times;</button>
                        </span>
                    ))}
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newFaculty}
                        onChange={(e) => setNewFaculty(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addFaculty()}
                        placeholder='e.g. "Faculty of Science"'
                        className="flex-1 h-9 px-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                    <button onClick={addFaculty} className="px-3 h-9 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-700">
                        Add
                    </button>
                </div>
            </section>

            {/* Hints & Validation */}
            <section className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-zinc-900 mb-4">Field Hints</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Index Number Hint</label>
                        <input
                            type="text"
                            value={config.index_number_hint}
                            onChange={(e) => setConfig((p) => ({ ...p, index_number_hint: e.target.value }))}
                            className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                            placeholder="e.g. 220123X"
                        />
                        <p className="text-xs text-zinc-400 mt-1">Shown as placeholder in the form</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Phone Number Hint</label>
                        <input
                            type="text"
                            value={config.phone_hint}
                            onChange={(e) => setConfig((p) => ({ ...p, phone_hint: e.target.value }))}
                            className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                            placeholder="e.g. 0712345678 or +94712345678"
                        />
                        <p className="text-xs text-zinc-400 mt-1">Shown as placeholder in the form</p>
                    </div>
                </div>
            </section>

            {/* Save Button */}
            <div className="flex items-center gap-4 pb-6">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 h-11 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-sm"
                >
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>

                {message && (
                    <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {message.text}
                    </p>
                )}
            </div>
        </div>
    );
}
