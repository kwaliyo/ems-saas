import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Download,
    FileCheck2,
    Info,
    User,
    XCircle,
} from 'lucide-react';

interface QuestionOption {
    id: number;
    option_text: string;
    is_correct?: boolean;
}

interface Question {
    id: number;
    question_text: string;
    points: number;
    type: string;
    explanation?: string;
    options?: QuestionOption[];
}

interface Answer {
    question_id: number;
    selected_option_ids?: number[];
    short_answer_text?: string;
    is_correct: boolean;
    score_awarded: number;
}

interface Participant {
    id: number;
    name: string;
    student_id_code?: string;
    score: number;
    completed_at?: string;
    answers: Answer[];
}

interface Room {
    id: number;
    code: string;
    mode: string;
    assessment: {
        title: string;
        subject: string;
        questions: Question[];
    };
}

interface Props {
    room: Room;
    participant: Participant;
}

export default function StudentScript({ room, participant }: Props) {
    const questions = room.assessment.questions || [];
    const ansMap = (participant.answers || []).reduce((acc, a) => ({ ...acc, [a.question_id]: a }), {} as Record<number, Answer>);

    const totalPossiblePoints = questions.reduce((acc, q) => acc + (q.points || 1), 0);
    const scorePct = totalPossiblePoints > 0 ? Math.round((participant.score / totalPossiblePoints) * 100) : 0;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Reports', href: '/reports' },
                { title: `Report ${room.code}`, href: `/reports/${room.id}` },
                { title: `Script: ${participant.name}`, href: '#' },
            ]}
        >
            <Head title={`Student Script - ${participant.name} - Room ${room.code}`} />

            <div className="p-4 sm:p-6 space-y-6 w-full max-w-[1700px] mx-auto">
                {/* Back Link & Header Bar */}
                <div className="flex items-center justify-between gap-4">
                    <Link
                        href={`/reports/${room.id}`}
                        className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Return to Session Analytics Report
                    </Link>

                    <Button
                        onClick={() => window.print()}
                        variant="outline"
                        className="bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold gap-2 h-9 cursor-pointer"
                    >
                        <Download className="w-4 h-4" /> Print / Save PDF
                    </Button>
                </div>

                {/* Candidate Overview Card */}
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs uppercase tracking-wider border border-indigo-200 dark:border-indigo-500/30">
                                    EXAM SCRIPT REPORT
                                </span>
                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                    Room Code: <strong className="text-slate-900 dark:text-white">{room.code}</strong>
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                                {room.assessment.title}
                            </h1>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                Subject: <strong className="text-slate-800 dark:text-slate-200">{room.assessment.subject}</strong>
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center min-w-[200px] space-y-1 shadow-inner">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Candidate Score</span>
                            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                {participant.score} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ {totalPossiblePoints} pts</span>
                            </div>
                            <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-300 pt-0.5">
                                {scorePct}% Accuracy Grade
                            </div>
                        </div>
                    </div>

                    {/* Candidate Metadata Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Student Name</span>
                            <p className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> {participant.name}
                            </p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Student ID Code</span>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{participant.student_id_code || 'N/A'}</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Exam Status</span>
                            <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                {participant.completed_at ? 'Concluded / Submitted' : 'In Progress'}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Itemized Questions Script Section */}
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <FileCheck2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Itemized Question Breakdown & Answers
                            </h2>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Review student responses against correct answer keys and explanations.</p>
                        </div>
                        <span className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                            {questions.length} Questions
                        </span>
                    </div>

                    <div className="space-y-4">
                        {questions.map((q, qIdx) => {
                            const ans = ansMap[q.id];
                            const selectedIds = (ans?.selected_option_ids || []).map((id: any) => Number(id));
                            const isCorrect = ans?.is_correct;

                            return (
                                <div
                                    key={q.id}
                                    className={`p-5 rounded-2xl border space-y-4 transition-all ${
                                        !ans
                                            ? 'bg-slate-100/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                                            : isCorrect
                                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/30'
                                            : 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/30'
                                    }`}
                                >
                                    {/* Question Header */}
                                    <div className="flex items-center justify-between text-xs gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black flex items-center justify-center text-xs">
                                                Q{qIdx + 1}
                                            </span>
                                            <span className="font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
                                                {q.type.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 font-bold">
                                            {!ans ? (
                                                <span className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px]">Unanswered</span>
                                            ) : isCorrect ? (
                                                <span className="px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-[11px] flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{ans.score_awarded ?? q.points} Pt)
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 text-[11px] flex items-center gap-1">
                                                    <XCircle className="w-3.5 h-3.5" /> Incorrect (0 Pts)
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Question Text */}
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                                        {q.question_text}
                                    </h3>

                                    {/* Options or Short Answer */}
                                    {q.type !== 'short_answer' ? (
                                        <div className="space-y-2 text-xs">
                                            {(q.options || []).map((opt, oIdx) => {
                                                const isCandidateChoice = selectedIds.includes(Number(opt.id));
                                                const isCorrectKey = opt.is_correct;

                                                let style = 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400';
                                                if (isCandidateChoice && isCorrectKey) {
                                                    style = 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-500/60 text-emerald-900 dark:text-emerald-200 font-bold ring-1 ring-emerald-500';
                                                } else if (isCandidateChoice && !isCorrectKey) {
                                                    style = 'bg-rose-100 dark:bg-rose-950/60 border-rose-400 dark:border-rose-500/60 text-rose-900 dark:text-rose-200 font-bold ring-1 ring-rose-500';
                                                } else if (isCorrectKey) {
                                                    style = 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-500/40 text-indigo-900 dark:text-indigo-300 font-bold';
                                                }

                                                return (
                                                    <div
                                                        key={opt.id}
                                                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${style}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-900 text-slate-800 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center">
                                                                {String.fromCharCode(65 + oIdx)}
                                                            </span>
                                                            <span>{opt.option_text}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] font-extrabold">
                                                            {isCandidateChoice && (
                                                                <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30">Student Choice</span>
                                                            )}
                                                            {isCorrectKey && (
                                                                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">Correct Key</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                                            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Student Response Submission:</span>
                                            <p className="font-bold text-slate-900 dark:text-white">{ans?.short_answer_text || 'No response entered.'}</p>
                                        </div>
                                    )}

                                    {q.explanation && (
                                        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                                            <strong className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1.5">
                                                <Info className="w-3.5 h-3.5" /> Explanation
                                            </strong>
                                            <p className="leading-relaxed text-[11px] text-slate-600 dark:text-slate-400">{q.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
