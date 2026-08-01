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
    Menu,
    Play,
    Radio,
    Rocket,
    ShieldCheck,
    Sparkles,
    Users,
    X,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { AppFooter } from '@/components/app-footer';
import AppLogo from '@/components/app-logo';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;
    const [joinCode, setJoinCode] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <Head title="K-EMS - Continuous Assessment & Examination System">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700,800"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
                {/* Navbar */}
                <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
                        {/* Logo */}
                        <Link href="/" className="shrink-0">
                            <AppLogo />
                        </Link>

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
                        <div className="hidden md:flex items-center gap-3">
                            <AppearanceToggleDropdown />

                            <Link href="/join">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors">
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

                        {/* Mobile Header Right Controls */}
                        <div className="flex md:hidden items-center gap-2">
                            <AppearanceToggleDropdown />

                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 rounded-xl border border-border bg-muted/50 text-foreground hover:bg-muted transition-colors cursor-pointer"
                                aria-label="Toggle navigation menu"
                            >
                                {mobileMenuOpen ? (
                                    <X className="w-5 h-5" />
                                ) : (
                                    <Menu className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Drawer / Slide-Down Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden border-b border-border bg-background/98 backdrop-blur-xl px-4 py-6 space-y-5 animate-in slide-in-from-top duration-200 shadow-xl">
                            {/* Mobile Navigation Links */}
                            <nav className="flex flex-col space-y-3 font-semibold text-sm">
                                <a
                                    href="#features"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                >
                                    <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Features
                                </a>
                                <a
                                    href="#how-it-works"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                >
                                    <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> How It Works
                                </a>
                                <a
                                    href="#student-access"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                >
                                    <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Student Join
                                </a>
                                <a
                                    href="#analytics"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                >
                                    <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Analytics & Reports
                                </a>
                            </nav>

                            <hr className="border-border" />

                            {/* Mobile Quick Join Code Input */}
                            <form onSubmit={handleJoinSubmit} className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                                    Join Live Room
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter Room Code (e.g. ROOM-101)"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value)}
                                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors cursor-pointer"
                                    >
                                        Join
                                    </button>
                                </div>
                            </form>

                            <hr className="border-border" />

                            {/* Mobile Account CTAs */}
                            <div className="flex flex-col gap-2.5 pt-1">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs text-center flex items-center justify-center gap-2 shadow-xs"
                                    >
                                        Go to Dashboard <ArrowRight className="w-4 h-4" />
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href="/join"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs text-center flex items-center justify-center gap-2"
                                        >
                                            <Radio className="w-4 h-4 animate-pulse" /> Student Join Portal
                                        </Link>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Link
                                                href={login()}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="py-2.5 rounded-xl border border-border text-foreground font-bold text-xs text-center hover:bg-muted transition-colors"
                                            >
                                                Log in
                                            </Link>
                                            {canRegister && (
                                                <Link
                                                    href={register()}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className="py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs text-center hover:opacity-90 transition-all shadow-xs"
                                                >
                                                    Register
                                                </Link>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
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

                    {/* Pricing Section */}
                    <section id="pricing" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                        <div className="text-center space-y-3 max-w-3xl mx-auto">
                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-xs uppercase tracking-widest">
                                Simple, Transparent Pricing
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                                Plans Scaled for Every Educator & Institution
                            </h2>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                                Choose the plan that fits your classroom size. Upgrade or downgrade anytime in Nigerian Naira (₦).
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Free Starter */}
                            <div className="rounded-3xl p-6 sm:p-8 bg-card border border-border shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-black text-foreground">Free Starter</h3>
                                        <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-bold text-[10px] uppercase">
                                            Forever Free
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-foreground">₦0</span>
                                        <span className="text-xs font-bold text-muted-foreground">/ month</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-medium">
                                        Ideal for individual tutors and small classroom quizzes.
                                    </p>
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                                        Up to 25 Candidate Seats / Room
                                    </div>
                                    <hr className="border-border/60" />
                                    <ul className="space-y-3 text-xs text-muted-foreground font-medium">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>25 candidate seats per live room</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>Unlimited Courses & Modules</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>Instant auto-graded exams</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>Basic report downloads</span>
                                        </li>
                                    </ul>
                                </div>
                                <Link href={canRegister ? register() : '/login'}>
                                    <button className="w-full py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-extrabold text-xs transition-colors cursor-pointer">
                                        Get Started Free
                                    </button>
                                </Link>
                            </div>

                            {/* Pro Educator */}
                            <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-emerald-500/10 via-card to-card border-2 border-emerald-500 shadow-xl flex flex-col justify-between space-y-6 relative">
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider shadow-md">
                                    Most Popular Choice
                                </div>
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-black text-foreground">Pro Educator</h3>
                                        <Sparkles className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400">₦15,000</span>
                                        <span className="text-xs font-bold text-muted-foreground">/ month</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-medium">
                                        Built for university lecturers, departments, and large classes.
                                    </p>
                                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                                        Up to 250 Candidate Seats / Room
                                    </div>
                                    <hr className="border-border/60" />
                                    <ul className="space-y-3 text-xs text-muted-foreground font-medium">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span><strong>250 candidate seats</strong> per live room</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>Bulk CSV student & question imports</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>External Guest ID Generator</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>CSV scorecard report export</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>Custom exam retake policies</span>
                                        </li>
                                    </ul>
                                </div>
                                <Link href={canRegister ? register() : '/login'}>
                                    <button className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-colors shadow-emerald-500/20 shadow-lg cursor-pointer">
                                        Upgrade to Pro Educator
                                    </button>
                                </Link>
                            </div>

                            {/* Institution */}
                            <div className="rounded-3xl p-6 sm:p-8 bg-card border border-border shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-black text-foreground">Institution</h3>
                                        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase">
                                            University Tier
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-foreground">₦95,000</span>
                                        <span className="text-xs font-bold text-muted-foreground">/ month</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-medium">
                                        Designed for faculties, polytechnics, and full institutions.
                                    </p>
                                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-extrabold text-amber-600 dark:text-amber-400">
                                        Unlimited Candidate Seats / Room
                                    </div>
                                    <hr className="border-border/60" />
                                    <ul className="space-y-3 text-xs text-muted-foreground font-medium">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span><strong>Unlimited candidate seats</strong> per live room</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>Multi-instructor administration</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>Dedicated priority server capacity</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>Custom university branding</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>Full invigilation audit logs & 24/7 support</span>
                                        </li>
                                    </ul>
                                </div>
                                <Link href={canRegister ? register() : '/login'}>
                                    <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-extrabold text-xs transition-opacity cursor-pointer">
                                        Contact Sales / Enroll
                                    </button>
                                </Link>
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

                <AppFooter />
            </div>
        </>
    );
}
