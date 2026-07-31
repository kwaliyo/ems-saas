import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    Award,
    BookOpen,
    CheckCircle2,
    Clock,
    FileCheck2,
    Layers,
    Radio,
    ShieldCheck,
    TrendingUp,
    Users,
    Zap,
} from 'lucide-react';

interface ActiveRoom {
    id: number;
    code: string;
    title: string;
    subject: string;
    status: string;
    mode: string;
    instructor_name: string;
    instructor_email: string;
    participants_count: number;
    created_at: string;
}

interface RecentUser {
    id: number;
    name: string;
    email: string;
    role: string | null;
    created_at: string;
}

interface Metrics {
    total_instructors: number;
    total_super_admins: number;
    total_courses: number;
    total_modules: number;
    active_rooms_count: number;
    completed_rooms_count: number;
    total_candidate_sessions: number;
    platform_pass_rate: number;
    platform_average_score: number;
}

interface Props {
    metrics: Metrics;
    activeRooms: ActiveRoom[];
    recentUsers: RecentUser[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Super Admin', href: '/admin/dashboard' },
    { title: 'Platform Telemetry', href: '/admin/dashboard' },
];

export default function AdminDashboard({ metrics, activeRooms, recentUsers }: Props) {
    const handleTerminateRoom = (roomId: number, code: string) => {
        if (confirm(`Are you sure you want to terminate live exam room ${code}?`)) {
            router.post(`/admin/rooms/${roomId}/end`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Platform Telemetry & Super Admin Dashboard - K-EMS" />

            <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
                {/* Executive Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 border border-emerald-500/30 text-white shadow-xl">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
                            <ShieldCheck className="w-3.5 h-3.5" /> Platform Executive Overview
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                            K-EMS Platform Control Center
                        </h1>
                        <p className="text-xs text-emerald-200/80 font-medium">
                            Real-time platform telemetry, instructor management, live room invigilation, and system health.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/admin/users">
                            <button className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2">
                                <Users className="w-4 h-4 text-emerald-400" /> Instructors ({metrics.total_instructors})
                            </button>
                        </Link>
                        <Link href="/admin/rooms">
                            <button className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-md">
                                <Radio className="w-4 h-4 animate-pulse" /> Live Rooms ({metrics.active_rooms_count})
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Primary Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Stat Card 1 */}
                    <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider">
                                Active Instructors
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-foreground">
                                {metrics.total_instructors.toLocaleString()}
                            </div>
                            <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                                +{metrics.total_super_admins} Super Admins
                            </p>
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider">
                                Live Rooms Running
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                <Radio className="w-5 h-5 animate-pulse text-emerald-500" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {metrics.active_rooms_count}
                            </div>
                            <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                                {metrics.completed_rooms_count} Completed Total
                            </p>
                        </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider">
                                Candidate Sessions
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                                <FileCheck2 className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-foreground">
                                {metrics.total_candidate_sessions.toLocaleString()}
                            </div>
                            <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                                Avg Score: {metrics.platform_average_score}%
                            </p>
                        </div>
                    </div>

                    {/* Stat Card 4 */}
                    <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider">
                                Platform Pass Rate
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-foreground">
                                {metrics.platform_pass_rate}%
                            </div>
                            <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                                {metrics.total_courses} Courses / {metrics.total_modules} Modules
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Live Exam Rooms Monitor Feed */}
                    <div className="lg:col-span-2 space-y-4 bg-card border border-border/80 rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                <h2 className="text-lg font-bold text-foreground">
                                    Active Live Assessment Rooms
                                </h2>
                            </div>
                            <Link href="/admin/rooms" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                                View All Rooms →
                            </Link>
                        </div>

                        {activeRooms.length === 0 ? (
                            <div className="p-8 text-center border border-dashed border-border rounded-xl space-y-2">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-80" />
                                <p className="text-xs font-bold text-foreground">No Live Rooms Active Right Now</p>
                                <p className="text-[11px] text-muted-foreground">
                                    When instructors launch assessments, live telemetry will stream here in real time.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-muted/60 text-muted-foreground font-extrabold uppercase tracking-wider">
                                        <tr>
                                            <th className="p-3">Room Code</th>
                                            <th className="p-3">Assessment Title</th>
                                            <th className="p-3">Instructor</th>
                                            <th className="p-3 text-center">Candidates</th>
                                            <th className="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border font-medium">
                                        {activeRooms.map((room) => (
                                            <tr key={room.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
                                                    {room.code}
                                                </td>
                                                <td className="p-3 font-bold text-foreground max-w-[180px] truncate">
                                                    {room.title}
                                                    <span className="block text-[10px] text-muted-foreground font-normal">
                                                        {room.subject}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-foreground">
                                                    {room.instructor_name}
                                                    <span className="block text-[10px] text-muted-foreground">
                                                        {room.instructor_email}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                                                        <Users className="w-3 h-3" /> {room.participants_count}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right space-x-2">
                                                    <Link href={`/rooms/${room.id}/dashboard`}>
                                                        <button className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-bold text-[11px] cursor-pointer">
                                                            Monitor
                                                        </button>
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTerminateRoom(room.id, room.code)}
                                                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 font-bold text-[11px] cursor-pointer"
                                                    >
                                                        Terminate
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* System Status & Recent Users Widget */}
                    <div className="space-y-6">
                        {/* System Health Card */}
                        <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-4 shadow-xs">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                <h2 className="text-sm font-bold text-foreground">
                                    System Telemetry & Health
                                </h2>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                                    <span className="font-semibold text-muted-foreground flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> SQLite Database
                                    </span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Healthy</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                                    <span className="font-semibold text-muted-foreground flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Invigilation Security
                                    </span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Active</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                                    <span className="font-semibold text-muted-foreground flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Instant Auto-Grading
                                    </span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Operational</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Registered Instructors */}
                        <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-4 shadow-xs">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Recent Instructors
                                </h2>
                                <Link href="/admin/users" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                                    Manage →
                                </Link>
                            </div>

                            <div className="space-y-2">
                                {recentUsers.map((u) => (
                                    <div key={u.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 text-xs">
                                        <div className="truncate">
                                            <span className="font-bold text-foreground block truncate">{u.name}</span>
                                            <span className="text-[10px] text-muted-foreground block truncate">{u.email}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            u.role === 'super_admin'
                                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        }`}>
                                            {u.role === 'super_admin' ? 'Admin' : 'Instructor'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
