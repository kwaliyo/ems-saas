import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    Award,
    BarChart3,
    BookOpen,
    CheckCircle2,
    Clock,
    FileCheck2,
    FileSpreadsheet,
    HelpCircle,
    Layers,
    LogIn,
    Play,
    Radio,
    Rocket,
    ShieldCheck,
    Sparkles,
    Users,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;
    const [joinCode, setJoinCode] = useState('');

    const handleJoinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinCode.trim()) {
            window.location.href = `/join?code=${encodeURIComponent(joinCode.trim())}`;
        } else {
            window.location.href = '/join';
        }
    };

    return (
        <>
            <Head title="EMS SAAS - Real-Time Continuous Assessment & Exam Platform">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700,800"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
                {/* Navbar */}
                <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-lg shadow-xs">
                                <FileCheck2 className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="font-extrabold text-lg tracking-tight text-foreground flex items-center gap-1.5">
                                    EMS <span className="text-primary font-black">SAAS</span>
                                </span>
                                <span className="block text-[10px] text-muted-foreground font-semibold tracking-wider uppercase">
                                    Assessment System
                                </span>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-muted-foreground">
                            <a href="#features" className="hover:text-foreground transition-colors">
                                Features
                            </a>
                            <a href="#how-it-works" className="hover:text-foreground transition-colors">
                                How It Works
                            </a>
                            <a href="#student-access" className="hover:text-foreground transition-colors">
                                Student Join
                            </a>
                            <a href="#analytics" className="hover:text-foreground transition-colors">
                                Analytics & Reports
                            </a>
                        </nav>

                        {/* CTA Controls */}
                        <div className="flex items-center gap-3">
                            <Link href="/join">
                                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
                                    <Radio className="w-3.5 h-3.5 animate-pulse" /> Student Join
                                </span>
                            </Link>

                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all shadow-xs flex items-center gap-1.5"
                                >
                                    Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="px-3.5 py-2 rounded-lg text-xs font-bold text-foreground hover:bg-muted transition-colors"
                                    >
                                        Log in
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all shadow-xs flex items-center gap-1.5"
                                        >
                                            Register <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1">
                    {/* Hero Section */}
                    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background border-b border-border">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
                            {/* Eyebrow Badge */}
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black tracking-wide uppercase shadow-xs">
                                <Sparkles className="w-3.5 h-3.5" /> Real-Time Continuous Assessment Platform
                            </div>

                            {/* Main Title */}
                            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]">
                                Transform Continuous Assessment with{' '}
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-600 to-indigo-500">
                                    Live Quiz Rooms
                                </span>{' '}
                                & Instant Analytics
                            </h1>

                            {/* Subtitle */}
                            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
                                Empower educators to launch live student-paced & teacher-paced assessments, manage courses, track student scorecards, and generate real-time reports in under 60 seconds.
                            </p>

                            {/* Quick Student Room Join Bar */}
                            <div id="student-access" className="max-w-md mx-auto p-2 rounded-2xl bg-card border border-border shadow-lg text-card-foreground">
                                <form onSubmit={handleJoinSubmit} className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                            placeholder="Enter 6-Digit Room Code..."
                                            maxLength={6}
                                            className="w-full pl-3 pr-2 py-2.5 bg-background border border-input rounded-xl text-foreground font-mono font-bold text-sm uppercase tracking-widest placeholder:text-muted-foreground placeholder:font-sans placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-primary/40"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-extrabold text-xs hover:opacity-90 transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                                    >
                                        <Play className="w-3.5 h-3.5 fill-current" /> Join Live Room
                                    </button>
                                </form>
                                <p className="text-[11px] text-muted-foreground mt-2 font-medium">
                                    No registration required for students to take live room exams.
                                </p>
                            </div>

                            {/* Secondary CTA buttons */}
                            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                                {auth.user ? (
                                    <Link href="/courses">
                                        <button className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all shadow-xs flex items-center gap-2 cursor-pointer">
                                            <BookOpen className="w-4 h-4" /> Manage Courses & Modules
                                        </button>
                                    </Link>
                                ) : (
                                    <Link href={register()}>
                                        <button className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all shadow-xs flex items-center gap-2 cursor-pointer">
                                            <Rocket className="w-4 h-4" /> Get Started Free (Instructor)
                                        </button>
                                    </Link>
                                )}
                                <Link href="/assessments">
                                    <button className="px-6 py-3 rounded-xl bg-card border border-border text-foreground font-bold text-sm hover:bg-muted transition-all shadow-xs flex items-center gap-2 cursor-pointer">
                                        <FileCheck2 className="w-4 h-4 text-primary" /> Browse Assessments Library
                                    </button>
                                </Link>
                            </div>

                            {/* Trust metrics */}
                            <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-border/60">
                                <div className="p-3 text-center">
                                    <div className="text-2xl sm:text-3xl font-black text-primary">50,000+</div>
                                    <div className="text-xs text-muted-foreground font-semibold">Assessments Delivered</div>
                                </div>
                                <div className="p-3 text-center">
                                    <div className="text-2xl sm:text-3xl font-black text-foreground">99.9%</div>
                                    <div className="text-xs text-muted-foreground font-semibold">Real-Time Uptime</div>
                                </div>
                                <div className="p-3 text-center">
                                    <div className="text-2xl sm:text-3xl font-black text-primary">&lt; 60s</div>
                                    <div className="text-xs text-muted-foreground font-semibold">Assessment Setup</div>
                                </div>
                                <div className="p-3 text-center">
                                    <div className="text-2xl sm:text-3xl font-black text-foreground">1-Click</div>
                                    <div className="text-xs text-muted-foreground font-semibold">CSV Scorecard Export</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features Grid */}
                    <section id="features" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                        <div className="text-center space-y-3 max-w-3xl mx-auto">
                            <h2 className="text-xs font-black uppercase tracking-widest text-primary">Powerful Capabilities</h2>
                            <p className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                                Everything You Need for Continuous Assessment
                            </p>
                            <p className="text-sm text-muted-foreground font-medium">
                                Designed specifically for modern educators, universities, corporate trainers, and high-impact learning environments.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Feature 1 */}
                            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all space-y-3 text-card-foreground">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                    <Radio className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Live Assessment Rooms</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Host live student-paced or teacher-paced assessment sessions with instant 6-digit room codes, real-time matrix dashboards, and automatic lock/pause controls.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all space-y-3 text-card-foreground">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Course & Module Hierarchy</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Structure learning into distinct courses and modules. Attach dedicated question banks and launch assessment rooms directly from specific module tables.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all space-y-3 text-card-foreground">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                    <Users className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Smart Student Roster & CSV Import</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Manage comprehensive student profiles (Student ID, Bio, DOB, Gender). Seamlessly import class rosters from CSV files and attach course enrollments in bulk.
                                </p>
                            </div>

                            {/* Feature 4 */}
                            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all space-y-3 text-card-foreground">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                    <BarChart3 className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Instant Scorecards & Analytics</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Generate instant student scorecards, class average percentages, detailed item response accuracy, and export formatted CSV reports for grading systems.
                                </p>
                            </div>

                            {/* Feature 5 */}
                            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all space-y-3 text-card-foreground">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Course Access Guarding</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Built-in access control ensures students can only join assessments for courses they are officially enrolled in, keeping continuous assessment secure and isolated.
                                </p>
                            </div>

                            {/* Feature 6 */}
                            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all space-y-3 text-card-foreground">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                    <FileSpreadsheet className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Bulk CSV Question Import</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Upload hundreds of questions in seconds using custom CSV templates supporting Multiple Choice, Multi-Select, True/False, and Short Answer question types.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* How It Works Section */}
                    <section id="how-it-works" className="py-16 md:py-24 bg-muted/30 border-y border-border">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                            <div className="text-center space-y-3 max-w-3xl mx-auto">
                                <h2 className="text-xs font-black uppercase tracking-widest text-primary">Simple & Efficient</h2>
                                <p className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                                    How EMS SAAS Works in 4 Steps
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Step 1 */}
                                <div className="p-5 rounded-2xl bg-card border border-border space-y-3 relative text-card-foreground shadow-xs">
                                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">
                                        1
                                    </div>
                                    <h4 className="text-base font-bold text-foreground">Build Question Bank</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Create course modules and populate question banks manually or via 1-click CSV import.
                                    </p>
                                </div>

                                {/* Step 2 */}
                                <div className="p-5 rounded-2xl bg-card border border-border space-y-3 relative text-card-foreground shadow-xs">
                                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">
                                        2
                                    </div>
                                    <h4 className="text-base font-bold text-foreground">Launch Live Room</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Click "Launch Live Room" on any module table to generate an instant 6-digit access code.
                                    </p>
                                </div>

                                {/* Step 3 */}
                                <div className="p-5 rounded-2xl bg-card border border-border space-y-3 relative text-card-foreground shadow-xs">
                                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">
                                        3
                                    </div>
                                    <h4 className="text-base font-bold text-foreground">Students Take Exam</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Students enter the 6-digit code on mobile or desktop without needing account registration.
                                    </p>
                                </div>

                                {/* Step 4 */}
                                <div className="p-5 rounded-2xl bg-card border border-border space-y-3 relative text-card-foreground shadow-xs">
                                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">
                                        4
                                    </div>
                                    <h4 className="text-base font-bold text-foreground">Review & Export CSV</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Monitor live responses on screen and download comprehensive scorecards and CSV reports.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Final CTA Banner */}
                    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="p-8 sm:p-12 rounded-3xl bg-primary text-primary-foreground shadow-xl space-y-6 max-w-4xl mx-auto">
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                                Ready to Elevate Continuous Assessment?
                            </h2>
                            <p className="text-sm sm:text-base text-primary-foreground/90 max-w-2xl mx-auto font-medium">
                                Join educators who rely on EMS SAAS for seamless live exams, instant scoring, and effortless roster management.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                                {auth.user ? (
                                    <Link href={dashboard()}>
                                        <button className="px-6 py-3 rounded-xl bg-background text-foreground font-extrabold text-xs hover:bg-muted transition-all shadow-md flex items-center gap-2 cursor-pointer">
                                            Go to Instructor Dashboard <ArrowRight className="w-4 h-4 text-primary" />
                                        </button>
                                    </Link>
                                ) : (
                                    <>
                                        {canRegister && (
                                            <Link href={register()}>
                                                <button className="px-6 py-3 rounded-xl bg-background text-foreground font-extrabold text-xs hover:bg-muted transition-all shadow-md flex items-center gap-2 cursor-pointer">
                                                    Create Free Account <ArrowRight className="w-4 h-4 text-primary" />
                                                </button>
                                            </Link>
                                        )}
                                        <Link href="/join">
                                            <button className="px-6 py-3 rounded-xl bg-primary-foreground/20 border border-primary-foreground/30 text-primary-foreground font-bold text-xs hover:bg-primary-foreground/30 transition-all cursor-pointer">
                                                Join Live Room (Student)
                                            </button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="border-t border-border bg-card text-muted-foreground py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium">
                        <div className="flex items-center gap-2">
                            <FileCheck2 className="w-4 h-4 text-primary" />
                            <span className="font-bold text-foreground">EMS SAAS</span> — Continuous Assessment Platform
                        </div>
                        <div>
                            &copy; {new Date().getFullYear()} EMS SAAS. All rights reserved.
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
