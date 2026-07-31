import AppLogo from '@/components/app-logo';
import { Link } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';

export function AppFooter() {
    return (
        <footer className="w-full border-t border-border/80 bg-card/60 backdrop-blur-md text-card-foreground mt-auto">
            <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-8 space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border">
                    {/* Brand Section */}
                    <div className="space-y-2 max-w-md">
                        <Link href="/dashboard" className="inline-block">
                            <AppLogo />
                        </Link>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Continuous Assessment Management System for real-time examinations, automated scoring, invigilation security, and analytics.
                        </p>
                    </div>

                    {/* Navigation Quick Links */}
                    <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-muted-foreground">
                        <Link href="/dashboard" className="hover:text-foreground transition-colors">
                            Dashboard
                        </Link>
                        <Link href="/courses" className="hover:text-foreground transition-colors">
                            Courses & Modules
                        </Link>
                        <Link href="/students" className="hover:text-foreground transition-colors">
                            Students Roster
                        </Link>
                        <Link href="/assessments" className="hover:text-foreground transition-colors">
                            Assessments
                        </Link>
                        <Link href="/reports" className="hover:text-foreground transition-colors">
                            Reports
                        </Link>
                        <Link href="/join" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-extrabold transition-colors">
                            Student Join Portal
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> All Systems Operational
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Strict Invigilation Security Enabled
                        </span>
                    </div>

                    <div>
                        <span className="font-medium text-[11px]">
                            © {new Date().getFullYear()} <strong className="text-foreground font-black">K-EMS</strong>. All rights reserved.
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
