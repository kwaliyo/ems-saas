import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    CreditCard,
    Crown,
    GraduationCap,
    Radio,
    ShieldCheck,
    Sparkles,
    Zap,
} from 'lucide-react';

interface Plan {
    id: string;
    name: string;
    price: string;
    period: string;
    max_candidates: number;
    features: string[];
}

interface Subscription {
    plan: string;
    max_candidates: number;
    expires_at?: string | null;
}

interface Props {
    subscription: Subscription;
    plans: Plan[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings/profile' },
    { title: 'Subscription & Billing', href: '/settings/billing' },
];

export default function SettingsBilling({ subscription, plans }: Props) {
    const handleUpgrade = (planId: string, planName: string) => {
        if (confirm(`Switch your subscription plan to ${planName}?`)) {
            router.post('/settings/billing/upgrade', { plan: planId });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Subscription & Billing - K-EMS Settings" />

            <div className="p-4 md:p-6 space-y-8 max-w-[1400px] mx-auto">
                {/* Header Banner */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 border border-emerald-500/30 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
                            <Zap className="w-3.5 h-3.5" /> Plan & Candidate Capacity
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            Subscription & Billing Settings
                        </h1>
                        <p className="text-xs text-emerald-200/80 font-medium">
                            Manage your instructor plan, candidate live room seat capacity, and features.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/10 border border-white/20 text-right shrink-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 block">
                            Current Active Plan
                        </span>
                        <div className="text-xl font-black text-white flex items-center justify-end gap-1.5 mt-0.5">
                            {subscription.plan === 'institution' && <Crown className="w-5 h-5 text-amber-400" />}
                            {subscription.plan === 'pro' && <Sparkles className="w-5 h-5 text-emerald-400" />}
                            {subscription.plan === 'free' && <GraduationCap className="w-5 h-5 text-slate-300" />}
                            {subscription.plan.toUpperCase()}
                        </div>
                        <p className="text-xs font-bold text-emerald-200 mt-1">
                            Seat Limit: {subscription.max_candidates === 999999 ? 'Unlimited Seats' : `${subscription.max_candidates} candidates / room`}
                        </p>
                    </div>
                </div>

                {/* Plan Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                        const isCurrent = subscription.plan === plan.id;
                        return (
                            <div
                                key={plan.id}
                                className={`rounded-2xl p-6 border flex flex-col justify-between transition-all space-y-6 ${
                                    isCurrent
                                        ? 'bg-gradient-to-b from-emerald-500/10 via-card to-card border-emerald-500 shadow-xl ring-1 ring-emerald-500/30'
                                        : 'bg-card border-border/80 shadow-xs hover:border-emerald-500/40'
                                }`}
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-black text-foreground">
                                            {plan.name}
                                        </h2>
                                        {isCurrent && (
                                            <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-xs">
                                                Active Plan
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-foreground">{plan.price}</span>
                                        <span className="text-xs font-bold text-muted-foreground">{plan.period}</span>
                                    </div>

                                    <div className="p-3 rounded-xl bg-muted/50 border border-border/60 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                        <Radio className="w-4 h-4 text-emerald-500" />
                                        {plan.max_candidates === 999999 ? 'Unlimited candidate seats' : `Up to ${plan.max_candidates} seats per room`}
                                    </div>

                                    <hr className="border-border/60" />

                                    <ul className="space-y-2.5 text-xs text-muted-foreground font-medium">
                                        {plan.features.map((feat, idx) => (
                                            <li key={idx} className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                <span>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    type="button"
                                    disabled={isCurrent}
                                    onClick={() => handleUpgrade(plan.id, plan.name)}
                                    className={`w-full py-3 rounded-xl font-black text-xs transition-all cursor-pointer shadow-xs ${
                                        isCurrent
                                            ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                                            : plan.id === 'pro'
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                                            : 'bg-primary text-primary-foreground hover:opacity-90'
                                    }`}
                                >
                                    {isCurrent ? 'Current Plan' : `Switch to ${plan.name}`}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
