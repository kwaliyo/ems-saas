import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Award,
    BarChart3,
    BookOpen,
    CheckCircle2,
    Clock,
    FileCheck2,
    FileSpreadsheet,
    GraduationCap,
    Layers,
    LayoutDashboard,
    Play,
    Plus,
    Radio,
    Rocket,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Users,
    ArrowRight,
} from 'lucide-react';
import { useState } from 'react';

interface Metrics {
    coursesCount: number;
    modulesCount: number;
    studentsCount: number;
    assessmentsCount: number;
    activeRoomsCount: number;
    totalExamAttempts: number;
    averageScorePercent: number;
    passRatePercent: number;
}

interface ActiveRoom {
    id: number;
    code: string;
    mode: string;
    status: string;
    participants_count: number;
    assessment_title?: string;
    started_at?: string;
}

interface CompletedRoom {
    id: number;
    code: string;
    assessment_title?: string;
    participants_count: number;
    ended_at?: string;
    created_at?: string;
}

interface StudentItem {
    id: number;
    name: string;
    student_number?: string | null;
    email: string;
}

interface CourseItem {
    id: number;
    code: string;
    title: string;
    modules_count: number;
    students_count: number;
}

interface Props {
    metrics: Metrics;
    activeRooms: ActiveRoom[];
    recentCompletedRooms: CompletedRoom[];
    recentStudents: StudentItem[];
    recentCourses: CourseItem[];
}

export default function Dashboard({
    metrics,
    activeRooms,
    recentCompletedRooms,
    recentStudents,
    recentCourses,
}: Props) {
    const { auth } = usePage<any>().props;

    return (
        <AppLayout breadcrumbs={[{ title: 'Executive Dashboard', href: '/dashboard' }]}>
            <Head title="Executive Dashboard" />

            <div className="p-4 sm:p-6 lg:p-8 space-y-8 w-full max-w-[1800px] mx-auto text-foreground">
                {/* Executive Welcome Hero Header */}
                <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-2 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
                                <Sparkles className="w-3.5 h-3.5" /> Examination Management SaaS Platform
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                                Welcome back, {auth.user.name} 👋
                            </h1>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Overview of your academic courses, active examination rooms, candidate rosters, and real-time performance metrics.
                            </p>
                        </div>

                        {/* Quick Action Shortcuts */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <Link href="/courses">
                                <Button variant="outline" className="font-bold text-xs gap-2 cursor-pointer shadow-xs">
                                    <GraduationCap className="w-4 h-4 text-primary" /> Courses
                                </Button>
                            </Link>
                            <Link href="/students">
                                <Button variant="outline" className="font-bold text-xs gap-2 cursor-pointer shadow-xs">
                                    <Users className="w-4 h-4 text-primary" /> Students
                                </Button>
                            </Link>
                            <Link href="/assessments">
                                <Button className="font-bold text-xs gap-2 cursor-pointer shadow-xs bg-primary text-primary-foreground">
                                    <Play className="w-4 h-4 fill-current" /> Assessments Bank
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Live Active Exam Rooms Notification Banner (If Any) */}
                {metrics.activeRoomsCount > 0 && (
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-medium">
                        <div className="flex items-center gap-3">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <div>
                                <span className="font-extrabold text-foreground text-sm">
                                    {metrics.activeRoomsCount} Active Live Examination Room(s) Running
                                </span>
                                <p className="text-muted-foreground text-xs">Candidates are currently connected and submitting answers live.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {activeRooms.map((room) => (
                                <Link key={room.id} href={`/rooms/${room.id}/dashboard`}>
                                    <Button size="sm" className="font-bold text-xs gap-1.5 bg-primary text-primary-foreground">
                                        <Radio className="w-3.5 h-3.5 animate-pulse" /> Monitor [{room.code}]
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Key Executive Performance Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Active Courses */}
                    <Card className="bg-card border-border shadow-xs hover:border-primary/50 transition-all">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Courses & Modules
                            </CardTitle>
                            <GraduationCap className="w-5 h-5 text-primary" />
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                                {metrics.coursesCount} <span className="text-sm font-normal text-muted-foreground">Courses</span>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                                Across <strong>{metrics.modulesCount}</strong> total module question banks
                            </p>
                        </CardContent>
                    </Card>

                    {/* Candidate Roster */}
                    <Card className="bg-card border-border shadow-xs hover:border-primary/50 transition-all">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Candidate Roster
                            </CardTitle>
                            <Users className="w-5 h-5 text-primary" />
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                                {metrics.studentsCount} <span className="text-sm font-normal text-muted-foreground">Students</span>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                                Enrolled candidate accounts in system
                            </p>
                        </CardContent>
                    </Card>

                    {/* Overall Pass Rate */}
                    <Card className="bg-card border-border shadow-xs hover:border-primary/50 transition-all">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Overall Pass Rate
                            </CardTitle>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                {metrics.passRatePercent}%
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                                Based on {metrics.totalExamAttempts} candidate attempt(s)
                            </p>
                        </CardContent>
                    </Card>

                    {/* Average Exam Score */}
                    <Card className="bg-card border-border shadow-xs hover:border-primary/50 transition-all">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Average Candidate Score
                            </CardTitle>
                            <TrendingUp className="w-5 h-5 text-primary" />
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <div className="text-2xl sm:text-3xl font-extrabold text-primary">
                                {metrics.averageScorePercent}%
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                                Overall mean grade across completed exams
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Primary Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Recent Courses & Assessment Containers */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Course Roster Overview */}
                        <Card className="bg-card border-border shadow-xs">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                                <div>
                                    <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-primary" /> Active Courses Overview
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">Taught courses, enrolled students, and module question banks.</p>
                                </div>
                                <Link href="/courses">
                                    <Button variant="ghost" size="sm" className="font-bold text-xs gap-1 cursor-pointer">
                                        View All Courses <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {recentCourses.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {recentCourses.map((course) => (
                                            <div
                                                key={course.id}
                                                className="p-4 rounded-xl bg-muted/40 border border-border space-y-3 hover:border-primary/40 transition-colors"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-[11px] font-extrabold uppercase">
                                                        {course.code || 'COURSE'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                                                        <Users className="w-3.5 h-3.5" /> {course.students_count} Students
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-sm text-foreground line-clamp-1">{course.title}</h3>
                                                    <p className="text-xs text-muted-foreground">{course.modules_count} Question Modules</p>
                                                </div>
                                                <div className="pt-1 flex items-center justify-between">
                                                    <Link href={`/courses/${course.id}`}>
                                                        <Button size="sm" variant="outline" className="h-7 text-[11px] font-bold gap-1 cursor-pointer">
                                                            Open Course Workspace
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 space-y-3">
                                        <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto" />
                                        <p className="text-sm font-semibold text-muted-foreground">No courses created yet.</p>
                                        <Link href="/courses">
                                            <Button size="sm" className="font-bold text-xs gap-1.5">
                                                <Plus className="w-4 h-4" /> Create First Course
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Completed Examinations */}
                        <Card className="bg-card border-border shadow-xs">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                                <div>
                                    <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                        <FileSpreadsheet className="w-5 h-5 text-primary" /> Recent Exam Room History
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">Concluded live examination sessions and candidate scorecards.</p>
                                </div>
                                <Link href="/reports">
                                    <Button variant="ghost" size="sm" className="font-bold text-xs gap-1 cursor-pointer">
                                        View Full Reports <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {recentCompletedRooms.length > 0 ? (
                                    <div className="space-y-3">
                                        {recentCompletedRooms.map((room) => (
                                            <div
                                                key={room.id}
                                                className="p-3.5 rounded-xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px] font-extrabold">
                                                            ROOM {room.code}
                                                        </span>
                                                        <span className="font-bold text-xs text-foreground">
                                                            {room.assessment_title || 'Assessment Exam'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Total Candidates: <strong>{room.participants_count}</strong> • Completed
                                                    </p>
                                                </div>
                                                <Link href={`/reports/${room.id}`}>
                                                    <Button size="sm" variant="outline" className="h-8 text-xs font-bold gap-1.5 shrink-0 cursor-pointer">
                                                        <FileSpreadsheet className="w-3.5 h-3.5 text-primary" /> View Report
                                                    </Button>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 space-y-2">
                                        <Clock className="w-8 h-8 text-muted-foreground mx-auto" />
                                        <p className="text-xs font-semibold text-muted-foreground">No completed exam sessions recorded yet.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Candidate Roster & Quick Tools */}
                    <div className="space-y-6">
                        {/* Candidate Roster Widget */}
                        <Card className="bg-card border-border shadow-xs">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                                <div>
                                    <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                        <Users className="w-5 h-5 text-primary" /> Candidate Directory
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">Recently registered student profiles.</p>
                                </div>
                                <Link href="/students">
                                    <Button variant="ghost" size="sm" className="font-bold text-xs gap-1 cursor-pointer">
                                        All Roster <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {recentStudents.length > 0 ? (
                                    <div className="space-y-3">
                                        {recentStudents.map((student) => (
                                            <div
                                                key={student.id}
                                                className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3 text-xs"
                                            >
                                                <div className="space-y-0.5 truncate">
                                                    <div className="font-bold text-foreground truncate">{student.name}</div>
                                                    <div className="text-[11px] text-muted-foreground font-mono truncate">
                                                        {student.student_number || student.email}
                                                    </div>
                                                </div>
                                                <Link href={`/students/${student.id}`}>
                                                    <Button size="sm" variant="outline" className="h-7 text-[11px] font-bold shrink-0 cursor-pointer">
                                                        Profile
                                                    </Button>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 space-y-2">
                                        <Users className="w-8 h-8 text-muted-foreground mx-auto" />
                                        <p className="text-xs font-semibold text-muted-foreground">No students in directory.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Analytics & Insights Teaser Card */}
                        <Card className="bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 shadow-xs">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-extrabold flex items-center gap-2 text-foreground">
                                    <BarChart3 className="w-5 h-5 text-primary" /> Deep Analytics & Item Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-xs">
                                <p className="text-muted-foreground leading-relaxed">
                                    View item analysis for hardest questions, pass/fail score distribution histograms, and course-by-course candidate mastery rates.
                                </p>
                                <Link href="/analytics" className="block">
                                    <Button className="w-full font-bold text-xs gap-2 bg-primary text-primary-foreground cursor-pointer">
                                        <BarChart3 className="w-4 h-4" /> Open Analytics & Insights
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
