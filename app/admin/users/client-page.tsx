'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminUsersClient() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('admin');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (res.ok) {
                setUsers(data.users);
            } else {
                setErrorMsg(data.error || 'Failed to load users');
            }
        } catch (err) {
            setErrorMsg('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role }),
            });

            const data = await res.json();
            if (res.ok) {
                setSuccessMsg(`Successfully created admin: ${data.user.email}`);
                setEmail('');
                setPassword('');
                fetchUsers();
            } else {
                setErrorMsg(data.error || 'Failed to create admin');
            }
        } catch (err) {
            setErrorMsg('An error occurred');
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this admin access?')) return;

        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' }); 
            if (res.ok) {
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete user');
            }
        } catch (err) {
            alert('An error occurred');
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900">Admin Management</h1>
                        <p className="text-zinc-500 mt-1">Super Admin portal to manage access of other admins</p>
                    </div>
                    <Link href="/admin" className="px-4 py-2 bg-zinc-200 text-zinc-800 rounded-md text-sm font-medium hover:bg-zinc-300">
                        &larr; Back to Dashboard
                    </Link>
                </div>

                {/* Create User Form */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
                    <h2 className="text-lg font-bold mb-4">Add New Admin</h2>
                    {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">{errorMsg}</div>}
                    {successMsg && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-sm rounded-md">{successMsg}</div>}

                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-600 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="colleague@domain.lk"
                                className="w-full p-2 border rounded-md text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600 mb-1">Temporary Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full p-2 border rounded-md text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600 mb-1">Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full p-2 border rounded-md text-sm bg-white"
                            >
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>
                        <div className="md:col-span-3 flex justify-end">
                            <button type="submit" className="px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800">
                                Create Admin Account
                            </button>
                        </div>
                    </form>
                </div>

                {/* User List Table */}
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                    <div className="p-4 border-b border-zinc-200 font-bold">Existing Admins</div>
                    {loading ? (
                        <div className="p-8 text-center text-zinc-500">Loading admins...</div>
                    ) : (
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-600">
                                    <th className="p-4 font-medium">Email</th>
                                    <th className="p-4 font-medium">Role</th>
                                    <th className="p-4 font-medium">Created At</th>
                                    <th className="p-4 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-zinc-50">
                                        <td className="p-4 font-medium text-zinc-900">{u.email}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-zinc-500">{new Date(u.created_at).toLocaleDateString()}</td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-800 font-medium">
                                                Revoke
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}