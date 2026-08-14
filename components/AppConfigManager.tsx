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
    // University name → pillar slugs it recruits for. Universities absent from
    // this map fall back to default_pillars.
    pillar_access: Record<string, string[]>;
    default_pillars: string[] | null;
}

interface Pillar {
    id: string;
    name: string;
    slug: string;
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
        pillar_access: {},
        default_pillars: null,
    });

    const [pillars, setPillars] = useState<Pillar[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Batch editing
    const [newBatch, setNewBatch] = useState('');
    const [newFaculty, setNewFaculty] = useState('');
    const [newUniversity, setNewUniversity] = useState('');

    useEffect(() => {
        Promise.all([
            fetch('/api/admin/config', { cache: 'no-store' }).then((r) => r.json()),
            fetch('/api/pillars', { cache: 'no-store' }).then((r) => r.json()),
        ])
            .then(([cfg, { pillars: pData }]) => {
                if (!cfg.error) {
                    setConfig({ ...cfg, pillar_access: cfg.pillar_access ?? {} });
                }
                if (pData?.length) setPillars(pData);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    // Pillar slugs a university currently recruits for. No explicit entry means
    // it inherits default_pillars — and no default means every pillar.
    const slugsFor = (uni: string): string[] => {
        const entry = config.pillar_access?.[uni];
        if (entry) return entry;
        return config.default_pillars ?? pillars.map((p) => p.slug);
    };

    const usesDefault = (uni: string) => !config.pillar_access?.[uni];

    const setSlugsFor = (uni: string, slugs: string[]) =>
        setConfig((prev) => ({
            ...prev,
            pillar_access: { ...prev.pillar_access, [uni]: slugs },
        }));

    const togglePillarFor = (uni: string, slug: string) => {
        const current = slugsFor(uni);
        setSlugsFor(uni, current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]);
    };

    // Drop the explicit entry so this university follows the default set again.
    const resetToDefault = (uni: string) =>
        setConfig((prev) => {
            const next = { ...prev.pillar_access };
            delete next[uni];
            return { ...prev, pillar_access: next };
        });

    const toggleDefaultPillar = (slug: string) => {
        const current = config.default_pillars ?? pillars.map((p) => p.slug);
        setConfig((prev) => ({
            ...prev,
            default_pillars: current.includes(slug)
                ? current.filter((s) => s !== slug)
                : [...current, slug],
        }));
    };

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

            {/* Pillars per University */}
            <section className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-zinc-900">Pillars per University</h2>
                <p className="text-xs text-zinc-500 mt-1 mb-5">
                    Choose which pillars each university recruits for. Applicants only see — and can
                    only be accepted into — the pillars ticked for their university.
                </p>

                {/* Default set */}
                <div className="border border-zinc-200 rounded-xl p-4 mb-4 bg-zinc-50/60">
                    <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-900">Default set</h3>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Used for any university without its own selection below, including
                                custom names applicants type in the &ldquo;Other&rdquo; box.
                            </p>
                        </div>
                        <span className="text-xs font-medium text-zinc-500 shrink-0">
                            {(config.default_pillars ?? pillars.map((p) => p.slug)).length} of {pillars.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {pillars.map((p) => {
                            const checked = (config.default_pillars ?? pillars.map((x) => x.slug)).includes(p.slug);
                            return (
                                <label
                                    key={p.slug}
                                    className="flex items-center gap-2.5 text-sm text-zinc-700 cursor-pointer hover:bg-white rounded-md px-2 py-1.5 transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleDefaultPillar(p.slug)}
                                        className="w-4 h-4 rounded border-zinc-300 accent-zinc-900"
                                    />
                                    {p.name}
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Per-university overrides */}
                <div className="space-y-3">
                    {config.eligible_universities.map((uni) => {
                        const selected = slugsFor(uni);
                        const inherited = usesDefault(uni);
                        return (
                            <div key={uni} className="border border-zinc-200 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-sm font-semibold text-zinc-900">{uni}</h3>
                                        {inherited && (
                                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                                                using default
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs font-medium text-zinc-500">
                                            {selected.length} of {pillars.length}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setSlugsFor(uni, pillars.map((p) => p.slug))}
                                            className="text-xs px-2 py-1 border border-zinc-200 rounded-md hover:bg-zinc-50 text-zinc-600 font-medium"
                                        >
                                            All
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSlugsFor(uni, [])}
                                            className="text-xs px-2 py-1 border border-zinc-200 rounded-md hover:bg-zinc-50 text-zinc-600 font-medium"
                                        >
                                            None
                                        </button>
                                        {!inherited && (
                                            <button
                                                type="button"
                                                onClick={() => resetToDefault(uni)}
                                                className="text-xs px-2 py-1 border border-zinc-200 rounded-md hover:bg-zinc-50 text-zinc-600 font-medium"
                                            >
                                                Use default
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {pillars.map((p) => (
                                        <label
                                            key={p.slug}
                                            className="flex items-center gap-2.5 text-sm text-zinc-700 cursor-pointer hover:bg-zinc-50 rounded-md px-2 py-1.5 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(p.slug)}
                                                onChange={() => togglePillarFor(uni, p.slug)}
                                                className="w-4 h-4 rounded border-zinc-300 accent-zinc-900"
                                            />
                                            {p.name}
                                        </label>
                                    ))}
                                </div>

                                {selected.length === 0 && (
                                    <p className="text-xs text-amber-700 mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                        No pillars selected — applicants from {uni} will not be able to apply.
                                    </p>
                                )}
                            </div>
                        );
                    })}

                    {config.eligible_universities.length === 0 && (
                        <p className="text-sm text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                            Add at least one university above to configure its pillars.
                        </p>
                    )}
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
