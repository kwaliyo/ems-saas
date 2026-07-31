import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type User } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    CreditCard,
    Crown,
    DollarSign,
    GraduationCap,
    Radio,
    Search,
    Sparkles,
    TrendingUp,
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

interface Metrics {
    estimated_mrr: number;
    free_count: number;
    pro_count: number;
    institution_count: number;
    total_subscribers: number;
}

interface Props {
    metrics: Metrics;
    subscribers: PaginatedUsers;
    filters: { search: string; plan: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Super Admin', href: '/admin/dashboard' },
    { title: 'Subscription Telemetry', href: '/admin/subscriptions' },
];

export default function AdminSubscriptions({ metrics, subscribers, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [plan, setPlan] = useState(filters.plan || '');

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/subscriptions', { search, plan }, { preserveState: true });
    };

    const handleUpdatePlan = (userId: number, userName: string, newPlan: string) => {
        if (confirm(`Change subscription plan for ${userName} to ${newPlan.toUpperCase()}?`)) {
            router.post(`/admin/users/${userId}/plan`, { plan: newPlan });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Subscription Telemetry & Billing - K-EMS Super Admin" />

            <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
                {/* Executive Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
                            <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Subscription Telemetry & Revenue
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                            Monitor MRR, subscriber growth across Free, Pro, and Institution plans, and manage instructor subscription tiers.
                        </p>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Estimated MRR */}
                    <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider">
                                Estimated MRR
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                ${metrics.estimated_mrr.toLocaleString()}
                            </div>
                            <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                                Monthly Recurring Revenue
                            </p>
                        </div>
                    </div>

                    {/* Pro Subscribers */}
                    <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider">
                                Pro Educators ($29/mo)
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                                <Sparkles className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-foreground">
                                {metrics.pro_count} Subscribers
                            </div>
                            <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                                Limit: 250 seats / room
                            </p>
                        </div>
                    </div>

                    {/* Institution Subscribers */}
                    <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider">
                                Institutions ($199/mo)
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                                <Crown className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-foreground">
                                {metrics.institution_count} Colleges
                            </div>
                            <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                                Limit: Unlimited seats
                            </p>
                        </div>
                    </div>

                    {/* Free Users */}
                    <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider">
                                Free Starter Tier
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-foreground">
                                {metrics.free_count} Accounts
                            </div>
                            <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                                Limit: 25 seats / room
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 rounded-2xl border border-border/80 shadow-xs">
                    <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                        <input
                            type="text"
                            placeholder="Search subscribers by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <select
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        className="px-3 py-2 text-xs font-bold rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                        <option value="">All Subscription Plans</option>
                        <option value="free">Free Starter</option>
                        <option value="pro">Pro Educator ($29/mo)</option>
                        <option value="institution">Institution ($199/mo)</option>
                    </select>

                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer w-full sm:w-auto"
                    >
                        Filter Subscribers
                    </button>
                </form>

                {/* Subscribers Table */}
                <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/60 text-muted-foreground font-extrabold uppercase tracking-wider">
                                <tr>
                                    <th className="p-3">Subscriber Name</th>
                                    <th className="p-3">Email Address</th>
                                    <th className="p-3">Current Plan</th>
                                    <th className="p-3 text-center">Live Candidate Limit</th>
                                    <th className="p-3">Joined Date</th>
                                    <th className="p-3 text-right">Change Plan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border font-medium">
                                {subscribers.data.map((u) => {
                                    const currentPlan = u.subscription_plan || 'free';
                                    return (
                                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-3 font-bold text-foreground">
                                                {u.name}
                                            </td>
                                            <td className="p-3 text-muted-foreground font-semibold">
                                                {u.email}
                                            </td>
                                            <td className="p-3">
                                                {currentPlan === 'institution' && (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                                        👑 Institution ($199)
                                                    </span>
                                                )}
                                                {currentPlan === 'pro' && (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                                        ✨ Pro ($29)
                                                    </span>
                                                )}
                                                {currentPlan === 'free' && (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                                                        🎓 Free Starter
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center font-bold text-foreground">
                                                {currentPlan === 'institution' ? 'Unlimited Seats' : currentPlan === 'pro' ? '250 seats' : '25 seats'}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-3 text-right">
                                                <select
                                                    value={currentPlan}
                                                    onChange={(e) => handleUpdatePlan(u.id, u.name, e.target.value)}
                                                    className="px-2.5 py-1 rounded-lg border border-border bg-background text-foreground font-bold text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                                >
                                                    <option value="free">Free ($0)</option>
                                                    <option value="pro">Pro ($29/mo)</option>
                                                    <option value="institution">Institution ($199/mo)</option>
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Links */}
                    {subscribers.links.length > 3 && (
                        <div className="p-4 border-t border-border flex items-center justify-center gap-1">
                            {subscribers.links.map((link, idx) => (
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
