import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Award,
    Download,
    FileText,
    HelpCircle,
    Trash2,
    Users,
} from 'lucide-react';

interface Question {
    id: number;
    question_text: string;
    points: number;
}

interface Answer {
    question_id: number;
    is_correct: boolean;
    score_awarded: number;
}

interface Participant {
    id: number;
    name: string;
    student_id_code?: string;
    score: number;
    total_questions: number;
    completed_at?: string;
    answers: Answer[];
}

interface Room {
    id: number;
    code: string;
    mode: string;
    status: string;
    assessment: {
        title: string;
        subject: string;
        questions: Question[];
    };
    participants: Participant[];
}

interface Props {
    room: Room;
}

export default function ReportShow({ room }: Props) {
    const { delete: destroyReport } = useForm();

    const handleDeleteReport = () => {
        if (confirm(`Are you sure you want to delete report for Room (${room.code})? This action cannot be undone.`)) {
            destroyReport(`/reports/${room.id}`);
        }
    };

    const questions = room.assessment.questions || [];
    const participants = room.participants || [];

    const totalParticipants = participants.length;
    const totalPossible = questions.length;
    const avgScore = totalParticipants > 0
        ? (participants.reduce((acc, p) => acc + p.score, 0) / totalParticipants).toFixed(1)
        : 0;
    const avgPct = totalPossible > 0 ? ((Number(avgScore) / totalPossible) * 100).toFixed(0) : 0;

    return (
        <AppLayout breadcrumbs={[{ title: 'Reports', href: '/reports' }, { title: `Report ${room.code}`, href: '#' }]}>
            <Head title={`Report ${room.code} - ${room.assessment.title}`} />

            <div className="p-4 sm:p-6 space-y-6 w-full max-w-[1800px] mx-auto">
                {/* Header Banner */}
                <div className="p-6 rounded-2xl bg-card border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs text-card-foreground">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded bg-primary/10 text-primary text-xs font-bold uppercase border border-primary/20">
                                Room Code: {room.code}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium capitalize">
                                Delivery Mode: {room.mode.replace('_', ' ')}
                            </span>
                        </div>
                        <h1 className="text-2xl font-black text-foreground mt-1">
                            {room.assessment.title} - Analytics Report
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <a href={`/reports/${room.id}/export-csv`} download>
                            <Button className="font-bold text-xs gap-2 cursor-pointer shadow-xs">
                                <Download className="w-4 h-4" /> Export CSV Report
                            </Button>
                        </a>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteReport}
                            className="font-bold text-xs gap-2 cursor-pointer shadow-xs"
                            title="Delete Report"
                        >
                            <Trash2 className="w-4 h-4" /> Delete Report
                        </Button>
                    </div>
                </div>

                {/* Stat Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-card border-border p-4 space-y-1 text-card-foreground shadow-xs">
                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-primary" /> Total Participants
                        </div>
                        <div className="text-2xl font-black text-foreground">{totalParticipants}</div>
                    </Card>

                    <Card className="bg-card border-border p-4 space-y-1 text-card-foreground shadow-xs">
                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-primary" /> Class Average Score
                        </div>
                        <div className="text-2xl font-black text-primary">
                            {avgScore} / {totalPossible} ({avgPct}%)
                        </div>
                    </Card>

                    <Card className="bg-card border-border p-4 space-y-1 text-card-foreground shadow-xs">
                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                            <HelpCircle className="w-4 h-4 text-primary" /> Total Exam Questions
                        </div>
                        <div className="text-2xl font-black text-foreground">{totalPossible}</div>
                    </Card>
                </div>

                {/* Scorecard Table */}
                <Card className="bg-card border-border shadow-xs p-5 space-y-4 text-card-foreground">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" /> Student Scorecard Roster ({totalParticipants})
                        </h3>
                    </div>

                    {totalParticipants === 0 ? (
                        <p className="text-xs text-muted-foreground italic text-center p-6">
                            No student submissions recorded for this room session yet.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-border text-muted-foreground uppercase tracking-wider font-extrabold text-[10px]">
                                        <th className="p-3 w-12 text-center">NO.</th>
                                        <th className="p-3">STUDENT NAME</th>
                                        <th className="p-3">STUDENT ID / CODE</th>
                                        <th className="p-3 text-center">SCORE</th>
                                        <th className="p-3 text-center">ACCURACY</th>
                                        <th className="p-3 text-right">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {participants.map((p, idx) => {
                                        const pct = totalPossible > 0 ? ((p.score / totalPossible) * 100).toFixed(0) : 0;

                                        return (
                                            <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="p-3 text-center font-bold text-muted-foreground">{idx + 1}</td>
                                                <td className="p-3 font-bold text-foreground text-sm">{p.name}</td>
                                                <td className="p-3 text-muted-foreground font-mono">{p.student_id_code || '—'}</td>
                                                <td className="p-3 text-center font-extrabold text-foreground text-sm">
                                                    {p.score} / {totalPossible}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                        Number(pct) >= 70
                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                            : Number(pct) >= 50
                                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                            : 'bg-destructive/10 text-destructive border border-destructive/20'
                                                    }`}>
                                                        {pct}%
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <Link href={`/reports/${room.id}/participant/${p.id}`}>
                                                        <Button variant="outline" size="sm" className="text-xs font-bold cursor-pointer">
                                                            View Script →
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
