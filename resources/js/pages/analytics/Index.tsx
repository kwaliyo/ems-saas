import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Award,
    BarChart3,
    BookOpen,
    CheckCircle2,
    Clock,
    FileSpreadsheet,
    GraduationCap,
    HelpCircle,
    Layers,
    PieChart,
    Sparkles,
    TrendingDown,
    TrendingUp,
    Users,
    XCircle,
} from 'lucide-react';

interface Summary {
    totalCompletedExams: number;
    totalCandidatesTested: number;
    overallAveragePercent: number;
    overallPassRate: number;
    scoreDistribution: {
        '90-100%': number;
        '75-89%': number;
        '50-74%': number;
        'below-50%': number;
    };
}

interface CourseAnalytic {
    id: number;
    code: string;
    title: string;
    students_count: number;
    modules_count: number;
    total_exams: number;
    average_pct: number;
    pass_rate_pct: number;
}

interface ItemAnalytic {
    id: number;
    question_text: string;
    type: string;
    total_attempts: number;
    correct_count: number;
    error_rate_pct: number;
}

interface Props {
    summary: Summary;
    courseAnalytics: CourseAnalytic[];
    itemAnalysis: ItemAnalytic[];
}

export default function AnalyticsIndex({ summary, courseAnalytics, itemAnalysis }: Props) {
    const totalDistributionCount =
        (summary.scoreDistribution['90-100%'] || 0) +
        (summary.scoreDistribution['75-89%'] || 0) +
        (summary.scoreDistribution['50-74%'] || 0) +
        (summary.scoreDistribution['below-50%'] || 0);

    const getDistPercent = (count: number) => {
        if (totalDistributionCount === 0) return 0;
        return Math.round((count / totalDistributionCount) * 100);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Analytics & Insights', href: '/analytics' }]}>
            <Head title="Analytics & Performance Insights" />

            <div className="p-4 sm:p-6 lg:p-8 space-y-8 w-full max-w-[1800px] mx-auto text-foreground">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2">
                            <BarChart3 className="w-8 h-8 text-primary" /> Analytics & Performance Insights
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Psychometric item analysis, score distribution, course breakdown, and candidate mastery metrics.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/reports">
                            <Button variant="outline" className="font-bold text-xs gap-2 cursor-pointer shadow-xs">
                                <FileSpreadsheet className="w-4 h-4 text-primary" /> View Session Reports
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Summary Executive Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-card border-border shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Candidates Evaluated
                            </CardTitle>
                            <Users className="w-5 h-5 text-primary" />
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                                {summary.totalCandidatesTested}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                                Across {summary.totalCompletedExams} completed exam sessions
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Overall Pass Rate
                            </CardTitle>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                {summary.overallPassRate}%
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                                Benchmark: 50% passing threshold
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Mean Grade Average
                            </CardTitle>
                            <TrendingUp className="w-5 h-5 text-primary" />
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <div className="text-2xl sm:text-3xl font-extrabold text-primary">
                                {summary.overallAveragePercent}%
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                                Average percentage achieved
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Completed Exam Sessions
                            </CardTitle>
                            <Award className="w-5 h-5 text-primary" />
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                                {summary.totalCompletedExams}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                                Fully submitted examination rooms
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Score Distribution & Course Performance Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Score Distribution Histogram */}
                    <Card className="bg-card border-border shadow-xs lg:col-span-1">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-primary" /> Grade Score Distribution
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">Categorized performance breakdown of all candidate submissions.</p>
                        </CardHeader>
                        <CardContent className="pt-5 space-y-4">
                            {/* 90-100% Mastery */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-emerald-600 dark:text-emerald-400">90 - 100% (Mastery)</span>
                                    <span>{summary.scoreDistribution['90-100%']} candidate(s) ({getDistPercent(summary.scoreDistribution['90-100%'])}%)</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${getDistPercent(summary.scoreDistribution['90-100%'])}%` }}
                                    />
                                </div>
                            </div>

                            {/* 75-89% Proficient */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-primary">75 - 89% (Proficient)</span>
                                    <span>{summary.scoreDistribution['75-89%']} candidate(s) ({getDistPercent(summary.scoreDistribution['75-89%'])}%)</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-primary h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${getDistPercent(summary.scoreDistribution['75-89%'])}%` }}
                                    />
                                </div>
                            </div>

                            {/* 50-74% Passing */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-amber-600 dark:text-amber-400">50 - 74% (Passing)</span>
                                    <span>{summary.scoreDistribution['50-74%']} candidate(s) ({getDistPercent(summary.scoreDistribution['50-74%'])}%)</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${getDistPercent(summary.scoreDistribution['50-74%'])}%` }}
                                    />
                                </div>
                            </div>

                            {/* Below 50% Remediation */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-rose-600 dark:text-rose-400">Below 50% (Remediation Needed)</span>
                                    <span>{summary.scoreDistribution['below-50%']} candidate(s) ({getDistPercent(summary.scoreDistribution['below-50%'])}%)</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-rose-500 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${getDistPercent(summary.scoreDistribution['below-50%'])}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Course Performance Breakdown Table */}
                    <Card className="bg-card border-border shadow-xs lg:col-span-2">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-primary" /> Course-by-Course Mastery Breakdown
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">Aggregated performance across your taught academic courses.</p>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {courseAnalytics.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                                                <th className="pb-3 px-2">Course</th>
                                                <th className="pb-3 px-2">Students</th>
                                                <th className="pb-3 px-2">Exams Taken</th>
                                                <th className="pb-3 px-2">Mean Score</th>
                                                <th className="pb-3 px-2">Pass Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {courseAnalytics.map((c) => (
                                                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="py-3 px-2 font-bold text-foreground">
                                                        <div>{c.title}</div>
                                                        <div className="text-[10px] text-muted-foreground font-mono">{c.code}</div>
                                                    </td>
                                                    <td className="py-3 px-2 font-semibold text-muted-foreground">{c.students_count}</td>
                                                    <td className="py-3 px-2 font-semibold text-muted-foreground">{c.total_exams}</td>
                                                    <td className="py-3 px-2 font-extrabold text-primary">{c.average_pct}%</td>
                                                    <td className="py-3 px-2">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                                                c.pass_rate_pct >= 75
                                                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                                                                    : c.pass_rate_pct >= 50
                                                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30'
                                                                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/30'
                                                            }`}
                                                        >
                                                            {c.pass_rate_pct}% Pass Rate
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 space-y-2">
                                    <BookOpen className="w-8 h-8 text-muted-foreground mx-auto" />
                                    <p className="text-xs font-semibold text-muted-foreground">No course analytics recorded yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Item Analysis: Hardest Questions Section */}
                <Card className="bg-card border-border shadow-xs">
                    <CardHeader className="border-b border-border pb-4">
                        <CardTitle className="text-base font-extrabold flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" /> Psychometric Item Analysis: Hardest Questions
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">Questions with the highest error rates across candidate submissions.</p>
                    </CardHeader>
                    <CardContent className="pt-5">
                        {itemAnalysis.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {itemAnalysis.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-4 rounded-xl bg-muted/40 border border-border space-y-3 flex flex-col justify-between"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] uppercase border border-amber-300 dark:border-amber-500/40">
                                                    {item.error_rate_pct}% Error Rate
                                                </span>
                                                <span className="text-[11px] text-muted-foreground font-mono uppercase font-bold">
                                                    {item.type.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-foreground line-clamp-3 leading-snug">
                                                "{item.question_text}"
                                            </p>
                                        </div>

                                        <div className="space-y-2 pt-2 border-t border-border/60 text-xs">
                                            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                                                <span>Total Attempts: <strong>{item.total_attempts}</strong></span>
                                                <span>Correct: <strong className="text-emerald-600 dark:text-emerald-400">{item.correct_count}</strong></span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-rose-500 h-2 rounded-full"
                                                    style={{ width: `${item.error_rate_pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 space-y-2">
                                <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto" />
                                <p className="text-xs font-semibold text-muted-foreground">No question item analysis data available yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
