import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertOctagon,
    CheckCircle2,
    Clock,
    PauseCircle,
    Radio,
    Search,
    ShieldAlert,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';

interface RoomItem {
    id: number;
    code: string;
    assessment_title: string;
    assessment_subject: string;
    mode: string;
    status: string;
    participants_count: number;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

interface PaginatedRooms {
    data: RoomItem[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    current_page: number;
    last_page: number;
}

interface Props {
    rooms: PaginatedRooms;
    filters: { search: string; status: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Super Admin', href: '/admin/dashboard' },
    { title: 'Global Live Rooms', href: '/admin/rooms' },
];

export default function AdminRooms({ rooms, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/rooms', { search, status }, { preserveState: true });
    };

    const handleEmergencyTerminate = (roomId: number, code: string) => {
        if (confirm(`EMERGENCY ACTION: Terminate live room ${code}? Active candidates will be auto-submitted.`)) {
            router.post(`/admin/rooms/${roomId}/end`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Global Live Rooms Telemetry - K-EMS Super Admin" />

            <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
                            <Radio className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-pulse" /> Global Live Exam Rooms Monitor
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                            Real-time platform room telemetry across all instructors with emergency room termination controls.
                        </p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold w-fit">
                        Total Rooms: {rooms.total}
                    </div>
                </div>

                {/* Filters Bar */}
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 rounded-2xl border border-border/80 shadow-xs">
                    <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                        <input
                            type="text"
                            placeholder="Search room code, assessment title, or subject..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="px-3 py-2 text-xs font-bold rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active Live</option>
                        <option value="waiting">Waiting Room</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                    </select>

                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer w-full sm:w-auto"
                    >
                        Filter Rooms
                    </button>
                </form>

                {/* Rooms Table */}
                <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/60 text-muted-foreground font-extrabold uppercase tracking-wider">
                                <tr>
                                    <th className="p-3">Room Code</th>
                                    <th className="p-3">Assessment & Subject</th>
                                    <th className="p-3">Instructor</th>
                                    <th className="p-3">Mode</th>
                                    <th className="p-3 text-center">Candidates</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border font-medium">
                                {rooms.data.map((r) => (
                                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
                                            {r.code}
                                        </td>
                                        <td className="p-3 font-bold text-foreground max-w-[200px] truncate">
                                            {r.assessment_title}
                                            <span className="block text-[10px] text-muted-foreground font-normal">
                                                {r.assessment_subject}
                                            </span>
                                        </td>
                                        <td className="p-3 text-foreground">
                                            {r.user?.name ?? 'Unknown'}
                                            <span className="block text-[10px] text-muted-foreground">
                                                {r.user?.email}
                                            </span>
                                        </td>
                                        <td className="p-3 font-bold uppercase text-[10px] text-muted-foreground">
                                            {r.mode}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                                                <Users className="w-3 h-3" /> {r.participants_count}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {r.status === 'active' && (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                                                    <Radio className="w-3 h-3 animate-pulse" /> Active Live
                                                </span>
                                            )}
                                            {r.status === 'waiting' && (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                                                    <Clock className="w-3 h-3" /> Waiting
                                                </span>
                                            )}
                                            {r.status === 'paused' && (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1 w-fit">
                                                    <PauseCircle className="w-3 h-3" /> Paused
                                                </span>
                                            )}
                                            {r.status === 'completed' && (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border flex items-center gap-1 w-fit">
                                                    <CheckCircle2 className="w-3 h-3" /> Completed
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 text-right space-x-2">
                                            <Link href={`/rooms/${r.id}/dashboard`}>
                                                <button className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-bold text-[11px] cursor-pointer">
                                                    Monitor
                                                </button>
                                            </Link>
                                            {r.status !== 'completed' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleEmergencyTerminate(r.id, r.code)}
                                                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 font-bold text-[11px] cursor-pointer"
                                                >
                                                    Terminate
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Links */}
                    {rooms.links.length > 3 && (
                        <div className="p-4 border-t border-border flex items-center justify-center gap-1">
                            {rooms.links.map((link, idx) => (
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
