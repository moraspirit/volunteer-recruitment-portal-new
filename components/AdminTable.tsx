'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Application = any;

interface Filters {
    search: string;
    status: string;
    batch: string;
    faculty: string;
    university: string;
    pillar: string;
}

const STATUS_STYLES: Record<string, string> = {
    APPROVED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    REJECTED: 'bg-red-50 text-red-600 ring-1 ring-red-200',
    PENDING: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
};

function InfoItem({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <span className="text-xs text-zinc-400 block">{label}</span>
            <p className="text-sm text-zinc-800 font-medium mt-0.5 break-words">{value || '—'}</p>
        </div>
    );
}

export default function AdminTable({ initialApplications }: { initialApplications: Application[] }) {
    const router = useRouter();

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Detail modal
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [status, setStatus] = useState('');
    const [hrNotes, setHrNotes] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Bulk actions
    const [bulkStatus, setBulkStatus] = useState('');
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    // Filters
    const [filters, setFilters] = useState<Filters>({
        search: '',
        status: 'ALL',
        batch: 'ALL',
        faculty: 'ALL',
        university: 'ALL',
        pillar: 'ALL',
    });

    // Derive unique filter option values from data
    const uniqueValues = useMemo(() => {
        const universities = [...new Set(initialApplications.map((a) => a.university).filter(Boolean))];
        const batches = [...new Set(initialApplications.map((a) => a.batch).filter(Boolean))].sort();
        const faculties = [...new Set(initialApplications.map((a) => a.faculty).filter(Boolean))];
        const allPillarNames = initialApplications.flatMap((a) =>
            (a.application_pillars || []).map((p: any) => p.pillars?.name).filter(Boolean)
        );
        const pillars = [...new Set(allPillarNames)].sort();
        return { universities, batches, faculties, pillars };
    }, [initialApplications]);

    // Apply all filters
    const filteredApplications = useMemo(() => {
        return initialApplications.filter((app) => {
            const query = filters.search.toLowerCase();
            const fullName = `${app.first_name} ${app.last_name}`.toLowerCase();

            const matchSearch =
                !query ||
                fullName.includes(query) ||
                (app.index_number || '').toLowerCase().includes(query) ||
                (app.email || '').toLowerCase().includes(query) ||
                (app.department || '').toLowerCase().includes(query) ||
                (app.university || '').toLowerCase().includes(query);

            const matchStatus = filters.status === 'ALL' || (app.status || 'PENDING') === filters.status;
            const matchBatch = filters.batch === 'ALL' || app.batch === filters.batch;
            const matchFaculty = filters.faculty === 'ALL' || app.faculty === filters.faculty;
            const matchUniversity = filters.university === 'ALL' || app.university === filters.university;
            const matchPillar =
                filters.pillar === 'ALL' ||
                (app.application_pillars || []).some((p: any) => p.pillars?.name === filters.pillar);

            return matchSearch && matchStatus && matchBatch && matchFaculty && matchUniversity && matchPillar;
        });
    }, [initialApplications, filters]);

    const activeFilterCount =
        Object.entries(filters).filter(([k, v]) => k !== 'search' && v !== 'ALL').length +
        (filters.search ? 1 : 0);

    // Stats
    const stats = useMemo(() => {
        const total = initialApplications.length;
        const pending = initialApplications.filter((a) => !a.status || a.status === 'PENDING').length;
        const approved = initialApplications.filter((a) => a.status === 'APPROVED').length;
        const rejected = initialApplications.filter((a) => a.status === 'REJECTED').length;
        return { total, pending, approved, rejected };
    }, [initialApplications]);

    // CSV Export — respects both selection and filters
    const handleExportCSV = useCallback(() => {
        const toExport =
            selectedIds.size > 0
                ? filteredApplications.filter((a) => selectedIds.has(a.id))
                : filteredApplications;

        const headers = [
            'Date',
            'First Name',
            'Last Name',
            'Index Number',
            'University',
            'Faculty',
            'Department',
            'Batch',
            'Email',
            'WhatsApp',
            'Date of Birth',
            'Address',
            'Applied Pillars',
            'Portfolio URL',
            'Skills / Interests',
            'Clubs / Societies',
            'Status',
            'HR Notes',
        ];

        const rows = toExport.map((app) =>
            [
                new Date(app.created_at).toLocaleDateString('en-GB'),
                app.first_name,
                app.last_name,
                app.index_number,
                app.university || 'University of Moratuwa',
                app.faculty,
                app.department,
                app.batch,
                app.email,
                app.whatsapp_number,
                app.dob,
                app.address,
                app.selectedPillars,
                app.portfolio_url || '',
                app.interests || '',
                app.clubs || '',
                app.status || 'PENDING',
                (app.hr_notes || '').replace(/"/g, '""'),
            ]
                .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
                .join(',')
        );

        const csv = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `moraspirit_applications_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [filteredApplications, selectedIds]);

    // Selection helpers
    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredApplications.length && filteredApplications.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredApplications.map((a) => a.id)));
        }
    };

    // Filter helpers
    const setFilter = (key: keyof Filters, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setSelectedIds(new Set());
    };

    const clearFilters = () => {
        setFilters({ search: '', status: 'ALL', batch: 'ALL', faculty: 'ALL', university: 'ALL', pillar: 'ALL' });
        setSelectedIds(new Set());
    };

    // Modal handlers
    const openModal = (app: Application) => {
        setSelectedApp(app);
        setStatus(app.status || 'PENDING');
        setHrNotes(app.hr_notes || '');
        setUpdateMessage(null);
    };

    const closeModal = () => {
        setSelectedApp(null);
        setUpdateMessage(null);
    };

    const handleUpdate = async () => {
        if (!selectedApp) return;
        setIsUpdating(true);
        setUpdateMessage(null);

        try {
            const res = await fetch(`/api/admin/applications/${selectedApp.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, hr_notes: hrNotes }),
            });

            if (res.ok) {
                setUpdateMessage({ type: 'success', text: 'Saved successfully.' });
                setTimeout(() => {
                    router.refresh();
                    closeModal();
                }, 800);
            } else {
                setUpdateMessage({ type: 'error', text: 'Failed to update. Try again.' });
            }
        } catch {
            setUpdateMessage({ type: 'error', text: 'Network error. Try again.' });
        } finally {
            setIsUpdating(false);
        }
    };

    // Bulk update
    const handleBulkUpdate = async () => {
        if (!bulkStatus || selectedIds.size === 0) return;
        setIsBulkUpdating(true);

        try {
            await Promise.all(
                Array.from(selectedIds).map((id) =>
                    fetch(`/api/admin/applications/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: bulkStatus }),
                    })
                )
            );
            setSelectedIds(new Set());
            setBulkStatus('');
            router.refresh();
        } catch (err) {
            console.error('Bulk update error:', err);
        } finally {
            setIsBulkUpdating(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total', value: stats.total, color: 'text-zinc-700', dot: 'bg-zinc-400' },
                    { label: 'Pending', value: stats.pending, color: 'text-amber-700', dot: 'bg-amber-400' },
                    { label: 'Approved', value: stats.approved, color: 'text-emerald-700', dot: 'bg-emerald-500' },
                    { label: 'Rejected', value: stats.rejected, color: 'text-red-700', dot: 'bg-red-400' },
                ].map(({ label, value, color, dot }) => (
                    <div key={label} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                        <span className={`w-2.5 h-2.5 rounded-full ${dot} shrink-0`} />
                        <div>
                            <p className={`text-xl font-bold ${color}`}>{value}</p>
                            <p className="text-xs text-zinc-400">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter & Search Card */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                {/* Search row */}
                <div className="p-4 flex flex-wrap gap-3 items-center border-b border-zinc-100">
                    <div className="relative flex-1 min-w-[200px]">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search name, index number, email, department..."
                            value={filters.search}
                            onChange={(e) => setFilter('search', e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1.5 text-xs px-3 py-2 border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Clear ({activeFilterCount})
                            </button>
                        )}
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export{' '}
                            {selectedIds.size > 0
                                ? `(${selectedIds.size} selected)`
                                : `(${filteredApplications.length})`}
                        </button>
                    </div>
                </div>

                {/* Filter dropdowns */}
                <div className="px-4 py-3 flex flex-wrap gap-2 bg-zinc-50/60">
                    <FilterSelect
                        value={filters.status}
                        onChange={(v) => setFilter('status', v)}
                        label="Status"
                        options={[
                            { value: 'ALL', label: 'All Statuses' },
                            { value: 'PENDING', label: 'Pending' },
                            { value: 'APPROVED', label: 'Approved' },
                            { value: 'REJECTED', label: 'Rejected' },
                        ]}
                    />
                    {uniqueValues.universities.length > 1 && (
                        <FilterSelect
                            value={filters.university}
                            onChange={(v) => setFilter('university', v)}
                            label="University"
                            options={[
                                { value: 'ALL', label: 'All Universities' },
                                ...uniqueValues.universities.map((u) => ({ value: u, label: u })),
                            ]}
                        />
                    )}
                    <FilterSelect
                        value={filters.faculty}
                        onChange={(v) => setFilter('faculty', v)}
                        label="Faculty"
                        options={[
                            { value: 'ALL', label: 'All Faculties' },
                            ...uniqueValues.faculties.map((f) => ({ value: f, label: f })),
                        ]}
                    />
                    <FilterSelect
                        value={filters.batch}
                        onChange={(v) => setFilter('batch', v)}
                        label="Batch"
                        options={[
                            { value: 'ALL', label: 'All Batches' },
                            ...uniqueValues.batches.map((b) => ({ value: b, label: b })),
                        ]}
                    />
                    <FilterSelect
                        value={filters.pillar}
                        onChange={(v) => setFilter('pillar', v)}
                        label="Pillar"
                        options={[
                            { value: 'ALL', label: 'All Pillars' },
                            ...uniqueValues.pillars.map((p) => ({ value: p, label: p })),
                        ]}
                    />
                </div>

                {/* Results count */}
                <div className="px-4 py-2 border-t border-zinc-100 text-xs text-zinc-500">
                    Showing <strong className="text-zinc-700">{filteredApplications.length}</strong> of{' '}
                    <strong className="text-zinc-700">{initialApplications.length}</strong> applications
                </div>
            </div>

            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
                <div className="bg-zinc-900 text-white rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold">{selectedIds.size} selected</span>
                    <div className="flex items-center gap-2">
                        <select
                            value={bulkStatus}
                            onChange={(e) => setBulkStatus(e.target.value)}
                            className="h-8 px-3 bg-zinc-800 border border-zinc-700 text-white rounded-lg text-sm focus:outline-none"
                        >
                            <option value="">Change status to…</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                        <button
                            onClick={handleBulkUpdate}
                            disabled={!bulkStatus || isBulkUpdating}
                            className="h-8 px-3 bg-white text-zinc-900 rounded-lg text-sm font-semibold hover:bg-zinc-100 disabled:opacity-40"
                        >
                            {isBulkUpdating ? 'Updating…' : 'Apply'}
                        </button>
                    </div>
                    <button
                        onClick={handleExportCSV}
                        className="h-8 px-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                    >
                        Export Selected
                    </button>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="ml-auto text-xs text-zinc-400 hover:text-white"
                    >
                        Clear selection
                    </button>
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse" style={{ minWidth: 700 }}>
                        <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-500 uppercase tracking-wide">
                                <th className="p-3 pl-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={
                                            filteredApplications.length > 0 &&
                                            selectedIds.size === filteredApplications.length
                                        }
                                        onChange={toggleSelectAll}
                                        className="rounded border-zinc-300 cursor-pointer"
                                    />
                                </th>
                                <th className="p-3 font-semibold">Status</th>
                                <th className="p-3 font-semibold">Date</th>
                                <th className="p-3 font-semibold">Applicant</th>
                                <th className="p-3 font-semibold">Index / University</th>
                                <th className="p-3 font-semibold">Faculty / Batch</th>
                                <th className="p-3 font-semibold">Pillars</th>
                                <th className="p-3 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {filteredApplications.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-zinc-400">
                                            <svg className="w-10 h-10 text-zinc-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-sm">No matching applications found.</p>
                                            {activeFilterCount > 0 && (
                                                <button onClick={clearFilters} className="text-xs text-zinc-500 underline">
                                                    Clear filters
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredApplications.map((app) => (
                                    <tr
                                        key={app.id}
                                        className={`hover:bg-zinc-50 transition-colors text-sm ${selectedIds.has(app.id) ? 'bg-blue-50/40' : ''}`}
                                    >
                                        <td className="p-3 pl-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(app.id)}
                                                onChange={() => toggleSelect(app.id)}
                                                className="rounded border-zinc-300 cursor-pointer"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_STYLES[app.status || 'PENDING'] || STATUS_STYLES.PENDING}`}
                                            >
                                                {app.status || 'PENDING'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-zinc-400 text-xs whitespace-nowrap">
                                            {new Date(app.created_at).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="p-3">
                                            <p className="font-medium text-zinc-900 whitespace-nowrap">
                                                {app.first_name} {app.last_name}
                                            </p>
                                            <p className="text-xs text-zinc-400 mt-0.5">{app.email}</p>
                                        </td>
                                        <td className="p-3">
                                            <p className="font-mono text-xs text-zinc-800">{app.index_number}</p>
                                            <p className="text-xs text-zinc-400 mt-0.5">{app.university || 'UOM'}</p>
                                        </td>
                                        <td className="p-3">
                                            <p className="text-xs text-zinc-700">{app.faculty}</p>
                                            <p className="text-xs text-zinc-400 mt-0.5">{app.batch}</p>
                                        </td>
                                        <td className="p-3 max-w-[200px]">
                                            <div className="flex flex-wrap gap-1">
                                                {(app.application_pillars || []).map((p: any, i: number) => (
                                                    <span
                                                        key={i}
                                                        className="inline-block px-1.5 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded"
                                                        title={p.pillars?.name}
                                                    >
                                                        {(p.pillars?.name || '')
                                                            .replace(' Pillar', '')
                                                            .replace(' Panel', '')}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-3 whitespace-nowrap">
                                            <button
                                                onClick={() => openModal(app)}
                                                className="text-xs px-2.5 py-1.5 bg-zinc-900 text-white rounded-md hover:bg-zinc-700 font-medium mr-2 transition-colors"
                                            >
                                                Review
                                            </button>
                                            {app.cvUrl && (
                                                <a
                                                    href={app.cvUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs px-2.5 py-1.5 border border-zinc-200 text-zinc-600 rounded-md hover:bg-zinc-50 font-medium transition-colors"
                                                >
                                                    CV
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail / Review Modal */}
            {selectedApp && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-10 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto">
                        {/* Header */}
                        <div className="p-5 border-b border-zinc-100 flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900">
                                    {selectedApp.first_name} {selectedApp.last_name}
                                </h2>
                                <p className="text-sm text-zinc-500 mt-0.5">
                                    {selectedApp.index_number} &middot;{' '}
                                    {selectedApp.university || 'University of Moratuwa'}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                                <span
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[selectedApp.status || 'PENDING'] || STATUS_STYLES.PENDING}`}
                                >
                                    {selectedApp.status || 'PENDING'}
                                </span>
                                <button
                                    onClick={closeModal}
                                    className="p-1 text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-100"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-6 max-h-[65vh] overflow-y-auto">
                            {/* Personal Information */}
                            <section>
                                <SectionHeading>Personal Information</SectionHeading>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-3">
                                    <InfoItem label="Full Name" value={`${selectedApp.first_name} ${selectedApp.last_name}`} />
                                    <InfoItem label="Email" value={selectedApp.email} />
                                    <InfoItem label="WhatsApp" value={selectedApp.whatsapp_number} />
                                    <InfoItem label="Date of Birth" value={selectedApp.dob} />
                                    <div className="col-span-2">
                                        <InfoItem label="Address" value={selectedApp.address} />
                                    </div>
                                </div>
                            </section>

                            {/* Academic Information */}
                            <section className="pt-4 border-t border-zinc-100">
                                <SectionHeading>Academic Information</SectionHeading>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-3">
                                    <InfoItem label="University" value={selectedApp.university || 'University of Moratuwa'} />
                                    <InfoItem label="Index Number" value={selectedApp.index_number} />
                                    <InfoItem label="Faculty" value={selectedApp.faculty} />
                                    <InfoItem label="Department / Course" value={selectedApp.department} />
                                    <InfoItem label="Batch" value={selectedApp.batch} />
                                </div>
                            </section>

                            {/* Applied Pillars */}
                            <section className="pt-4 border-t border-zinc-100">
                                <SectionHeading>Applied Pillars</SectionHeading>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {(selectedApp.application_pillars || []).length > 0 ? (
                                        (selectedApp.application_pillars || []).map((p: any, i: number) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg"
                                            >
                                                {p.pillars?.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-zinc-400">No pillars recorded</span>
                                    )}
                                </div>
                            </section>

                            {/* Additional Information */}
                            <section className="pt-4 border-t border-zinc-100">
                                <SectionHeading>Additional Information</SectionHeading>
                                <div className="space-y-3 mt-3">
                                    {selectedApp.portfolio_url && (
                                        <div>
                                            <span className="text-xs text-zinc-400 block">Portfolio / LinkedIn</span>
                                            <a
                                                href={selectedApp.portfolio_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm text-blue-600 hover:underline break-all"
                                            >
                                                {selectedApp.portfolio_url}
                                            </a>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-xs text-zinc-400 block mb-1">Skills / Interests</span>
                                        <p className="p-3 bg-zinc-50 rounded-lg text-sm text-zinc-700 whitespace-pre-wrap">
                                            {selectedApp.interests || '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-zinc-400 block mb-1">Clubs / Societies / Experience</span>
                                        <p className="p-3 bg-zinc-50 rounded-lg text-sm text-zinc-700 whitespace-pre-wrap">
                                            {selectedApp.clubs || '—'}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Documents */}
                            {selectedApp.cvUrl && (
                                <section className="pt-4 border-t border-zinc-100">
                                    <SectionHeading>Documents</SectionHeading>
                                    <div className="mt-3">
                                        <a
                                            href={selectedApp.cvUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50 font-medium transition-colors"
                                        >
                                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                            </svg>
                                            Download CV / Resume
                                        </a>
                                    </div>
                                </section>
                            )}

                            {/* HR Review */}
                            <section className="pt-4 border-t border-zinc-100">
                                <SectionHeading>HR Review</SectionHeading>
                                <div className="space-y-3 mt-3">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">Decision</label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="w-full h-10 px-3 border border-zinc-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                                        >
                                            <option value="PENDING">Pending Review</option>
                                            <option value="APPROVED">Approved</option>
                                            <option value="REJECTED">Rejected</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                                            Internal HR Notes{' '}
                                            <span className="text-zinc-400 font-normal">(private, not shown to applicant)</span>
                                        </label>
                                        <textarea
                                            value={hrNotes}
                                            onChange={(e) => setHrNotes(e.target.value)}
                                            className="w-full h-24 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none"
                                            placeholder="Add notes from interview or review session..."
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-zinc-100 flex items-center justify-between">
                            <div>
                                {updateMessage && (
                                    <p
                                        className={`text-sm font-medium ${updateMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}
                                    >
                                        {updateMessage.text}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    disabled={isUpdating}
                                    className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 font-medium text-sm disabled:opacity-50 transition-colors"
                                >
                                    {isUpdating ? 'Saving…' : 'Save Decision'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Small helper components
function FilterSelect({
    value,
    onChange,
    label,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    label: string;
    options: { value: string; label: string }[];
}) {
    const isActive = value !== 'ALL';
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`h-8 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors ${isActive ? 'border-zinc-900 text-zinc-900 font-medium' : 'border-zinc-200 text-zinc-600'}`}
            aria-label={label}
        >
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{children}</h3>
    );
}
