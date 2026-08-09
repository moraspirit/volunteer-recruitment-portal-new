'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

type Application = any;

export default function AdminTable({ initialApplications }: { initialApplications: Application[] }) {
    const router = useRouter();
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [status, setStatus] = useState('');
    const [hrNotes, setHrNotes] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Filter & Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [batchFilter, setBatchFilter] = useState('ALL');
    const [facultyFilter, setFacultyFilter] = useState('ALL');

    // Filter logic
    const filteredApplications = useMemo(() => {
        return initialApplications.filter((app) => {
            const fullName = `${app.first_name} ${app.last_name}`.toLowerCase();
            const indexNo = (app.index_number || '').toLowerCase();
            const email = (app.email || '').toLowerCase();
            const query = searchTerm.toLowerCase();

            const matchesSearch = fullName.includes(query) || indexNo.includes(query) || email.includes(query);
            const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
            const matchesBatch = batchFilter === 'ALL' || app.batch === batchFilter;
            const matchesFaculty = facultyFilter === 'ALL' || app.faculty === facultyFilter;

            return matchesSearch && matchesStatus && matchesBatch && matchesFaculty;
        });
    }, [initialApplications, searchTerm, statusFilter, batchFilter, facultyFilter]);

    // CSV Export Handler
    const handleExportCSV = () => {
        const headers = ['Date,First Name,Last Name,Index Number,Faculty,Department,Email,WhatsApp,Batch,Selected Pillars,Status,HR Notes'];
        const rows = filteredApplications.map((app) => [
            new Date(app.created_at).toLocaleDateString(),
            `"${app.first_name}"`,
            `"${app.last_name}"`,
            `"${app.index_number}"`,
            `"${app.faculty}"`,
            `"${app.department}"`,
            `"${app.email}"`,
            `"${app.whatsapp_number}"`,
            `"${app.batch}"`,
            `"${app.selectedPillars}"`,
            `"${app.status || 'PENDING'}"`,
            `"${(app.hr_notes || '').replace(/"/g, '""')}"`,
        ].join(','));

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `volunteer_applications_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const openModal = (app: Application) => {
        setSelectedApp(app);
        setStatus(app.status || 'PENDING');
        setHrNotes(app.hr_notes || '');
    };

    const closeModal = () => {
        setSelectedApp(null);
        setIsUpdating(false);
    };

    const handleUpdate = async () => {
        if (!selectedApp) return;
        setIsUpdating(true);

        try {
            const res = await fetch(`/api/admin/applications/${selectedApp.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, hr_notes: hrNotes }),
            });

            if (res.ok) {
                router.refresh();
                closeModal();
            } else {
                alert('Failed to update application.');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* --- CONTROLS / FILTERS BAR --- */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200 flex flex-wrap gap-4 justify-between items-center">
                <div className="flex flex-wrap gap-3 items-center flex-1">
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search by name, index, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm w-72 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm bg-white"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>

                    {/* Batch Filter */}
                    <select
                        value={batchFilter}
                        onChange={(e) => setBatchFilter(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm bg-white"
                    >
                        <option value="ALL">All Batches</option>
                        <option value="25">Batch 25</option>
                        <option value="24">Batch 24</option>
                        <option value="23">Batch 23</option>
                    </select>
                </div>

                {/* Export Button */}
                <button
                    onClick={handleExportCSV}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                    Export CSV ({filteredApplications.length})
                </button>
            </div>

            {/* --- DATA TABLE --- */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-100 border-b border-zinc-200 text-sm text-zinc-600">
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Name</th>
                                <th className="p-4 font-medium">Index No.</th>
                                <th className="p-4 font-medium">Faculty</th>
                                <th className="p-4 font-medium">Selected Pillars</th>
                                <th className="p-4 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {filteredApplications.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-zinc-500">
                                        No matching applications found.
                                    </td>
                                </tr>
                            ) : (
                                filteredApplications.map((app) => (
                                    <tr key={app.id} className="hover:bg-zinc-50 transition-colors text-sm">
                                        <td className="p-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                        ${app.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                    app.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'}`}>
                                                {app.status || 'PENDING'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-zinc-500 whitespace-nowrap">{new Date(app.created_at).toLocaleDateString()}</td>
                                        <td className="p-4 font-medium text-zinc-900 whitespace-nowrap">{app.first_name} {app.last_name}</td>
                                        <td className="p-4 text-zinc-600 whitespace-nowrap">{app.index_number}</td>
                                        <td className="p-4 text-zinc-600 whitespace-nowrap">{app.faculty}</td>
                                        <td className="p-4 text-zinc-600">{app.selectedPillars}</td>
                                        <td className="p-4 whitespace-nowrap">
                                            <button
                                                onClick={() => openModal(app)}
                                                className="text-blue-600 hover:text-blue-800 font-medium hover:underline mr-4"
                                            >
                                                Review
                                            </button>
                                            {app.cvUrl && (
                                                <a href={app.cvUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-900 font-medium hover:underline">
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

            {/* --- DETAIL MODAL --- */}
            {selectedApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-zinc-200 flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-xl font-bold">Review Application</h2>
                            <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-800 text-xl font-bold">&times;</button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="font-semibold text-zinc-500">Name:</span> {selectedApp.first_name} {selectedApp.last_name}</div>
                                <div><span className="font-semibold text-zinc-500">Index No:</span> {selectedApp.index_number}</div>
                                <div><span className="font-semibold text-zinc-500">Batch:</span> {selectedApp.batch}</div>
                                <div><span className="font-semibold text-zinc-500">Email:</span> {selectedApp.email}</div>
                                <div><span className="font-semibold text-zinc-500">WhatsApp:</span> {selectedApp.whatsapp_number}</div>
                                <div><span className="font-semibold text-zinc-500">DOB:</span> {selectedApp.dob}</div>
                                <div className="col-span-2"><span className="font-semibold text-zinc-500">Faculty/Dept:</span> {selectedApp.faculty} - {selectedApp.department}</div>
                                <div className="col-span-2"><span className="font-semibold text-zinc-500">Address:</span> {selectedApp.address}</div>
                                {selectedApp.portfolio_url && (
                                    <div className="col-span-2"><span className="font-semibold text-zinc-500">Portfolio:</span> <a href={selectedApp.portfolio_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">{selectedApp.portfolio_url}</a></div>
                                )}
                            </div>

                            <div className="space-y-4 text-sm border-t pt-4">

                                {/* --- ADDED APPLIED PILLARS SECTION --- */}
                                <div>
                                    <h4 className="font-semibold text-zinc-800 mb-2">Applied Pillars</h4>
                                    {selectedApp.application_pillars?.length > 0 || selectedApp.pillars?.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {(selectedApp.application_pillars?.map((p: any) => p.pillars?.name) || selectedApp.pillars || []).map((pillar: string, idx: number) => (
                                                <span key={idx} className="px-3 py-1.5 bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-medium rounded-md">
                                                    {pillar}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="p-3 bg-zinc-50 rounded-md whitespace-pre-wrap text-zinc-500">None provided</p>
                                    )}
                                </div>
                                {/* ------------------------------------- */}

                                <div>
                                    <h4 className="font-semibold text-zinc-800 mb-1">Clubs/ Societies/ Experience</h4>
                                    <p className="p-3 bg-zinc-50 rounded-md whitespace-pre-wrap">{selectedApp.clubs || 'None provided'}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-zinc-800 mb-1">Skills/ Interests</h4>
                                    <p className="p-3 bg-zinc-50 rounded-md whitespace-pre-wrap">{selectedApp.interests || 'None provided'}</p>
                                </div>
                            </div>

                            <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 mt-4">
                                <h3 className="font-bold mb-3">HR Review</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Status</label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="w-full p-2 border rounded-md bg-white"
                                        >
                                            <option value="PENDING">PENDING</option>
                                            <option value="APPROVED">APPROVED</option>
                                            <option value="REJECTED">REJECTED</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Internal HR Notes (Private)</label>
                                        <textarea
                                            value={hrNotes}
                                            onChange={(e) => setHrNotes(e.target.value)}
                                            className="w-full p-2 border rounded-md h-24"
                                            placeholder="Add notes from interview or review..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-zinc-200 flex justify-end gap-3 sticky bottom-0 bg-white">
                            <button onClick={closeModal} className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-md font-medium">Cancel</button>
                            <button
                                onClick={handleUpdate}
                                disabled={isUpdating}
                                className="px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 font-medium disabled:opacity-50"
                            >
                                {isUpdating ? 'Saving...' : 'Save Decision'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}