import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type User } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    Search,
    Shield,
    ShieldAlert,
    Trash2,
    UserCheck,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';

interface PaginatedUsers {
    data: User[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    current_page: number;
    last_page: number;
}

interface Props {
    users: PaginatedUsers;
    filters: { search: string; role: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Super Admin', href: '/admin/dashboard' },
    { title: 'Instructors & Users', href: '/admin/users' },
];

export default function AdminUsers({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/users', { search, role }, { preserveState: true });
    };

    const handleToggleRole = (user: User) => {
        const actionText = user.role === 'super_admin' ? 'demote to Instructor' : 'promote to Super Admin';
        if (confirm(`Are you sure you want to ${actionText} for ${user.name}?`)) {
            router.post(`/admin/users/${user.id}/toggle-role`);
        }
    };

    const handleImpersonateUser = (user: User) => {
        if (confirm(`Login as ${user.name}? You can return to Admin Panel anytime.`)) {
            router.post(`/admin/users/${user.id}/impersonate`);
        }
    };

    const handleDeleteUser = (user: User) => {
        if (confirm(`WARNING: Deleting user ${user.name} will delete all their courses, modules, and exam rooms. Continue?`)) {
            router.delete(`/admin/users/${user.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Instructors & Users Management - K-EMS Super Admin" />

            <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
                            <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Platform Instructors & Users
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                            Manage all registered platform accounts, assign Super Admin privileges, or delete accounts.
                        </p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold w-fit">
                        Total Users: {users.total}
                    </div>
                </div>

                {/* Filters Bar */}
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 rounded-2xl border border-border/80 shadow-xs">
                    <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or student number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="px-3 py-2 text-xs font-bold rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                        <option value="">All Roles</option>
                        <option value="instructor">Instructors Only</option>
                        <option value="super_admin">Super Admins Only</option>
                    </select>

                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer w-full sm:w-auto"
                    >
                        Filter Users
                    </button>
                </form>

                {/* Users Table */}
                <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/60 text-muted-foreground font-extrabold uppercase tracking-wider">
                                <tr>
                                    <th className="p-3">ID</th>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Email / Student No</th>
                                    <th className="p-3">Role</th>
                                    <th className="p-3">Registered Date</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border font-medium">
                                {users.data.map((u) => (
                                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3 font-mono font-bold text-muted-foreground">
                                            #{u.id}
                                        </td>
                                        <td className="p-3 font-bold text-foreground">
                                            {u.name}
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            <span className="block font-semibold text-foreground">{u.email}</span>
                                            {u.student_number && (
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    SN: {u.student_number}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                                                u.role === 'super_admin'
                                                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                            }`}>
                                                {u.role === 'super_admin' ? '🛡️ Super Admin' : '🎓 Instructor'}
                                            </span>
                                            <span className="block mt-1 text-[10px] font-bold text-muted-foreground">
                                                Plan: <strong className="text-emerald-600 dark:text-emerald-400 uppercase">{u.subscription_plan || 'free'}</strong>
                                            </span>
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-3 text-right space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => handleImpersonateUser(u)}
                                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-bold text-[11px] cursor-pointer"
                                                title="Log in as this Instructor"
                                            >
                                                Log in As
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleRole(u)}
                                                className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-bold text-[11px] cursor-pointer"
                                                title="Toggle Super Admin Role"
                                            >
                                                {u.role === 'super_admin' ? 'Demote' : 'Make Admin'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteUser(u)}
                                                className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 font-bold text-[11px] cursor-pointer"
                                                title="Delete User Account"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Links */}
                    {users.links.length > 3 && (
                        <div className="p-4 border-t border-border flex items-center justify-center gap-1">
                            {users.links.map((link, idx) => (
                                <button
                                    key={idx}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                        link.active
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-muted text-foreground hover:bg-muted/80'
                                    } ${!link.url ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
