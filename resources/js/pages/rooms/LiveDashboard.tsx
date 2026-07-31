import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Copy,
    Eye,
    EyeOff,
    Lock,
    Pause,
    Play,
    QrCode,
    Rocket,
    StopCircle,
    Users,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface QuestionOption {
    id: number;
    option_text: string;
    is_correct: boolean;
}

interface Question {
    id: number;
    question_text: string;
    points: number;
    options: QuestionOption[];
}

interface Assessment {
    id: number;
    title: string;
    questions: Question[];
}

interface Answer {
    question_id: number;
    is_correct: boolean;
    score_awarded: number;
}

interface Participant {
    id: number;
    name: string;
    score: number;
    team_color: string;
    created_at?: string;
    completed_at?: string;
    answers: Answer[];
}

interface Room {
    id: number;
    code: string;
    mode: 'student_paced' | 'teacher_paced' | 'space_race' | 'exit_ticket';
    status: 'waiting' | 'active' | 'paused' | 'completed';
    current_question_index: number;
    assessment: Assessment;
    participants: Participant[];
}

interface Props {
    room: Room;
}

export default function LiveDashboard({ room: initialRoom }: Props) {
    const [room, setRoom] = useState<Room>(initialRoom);
    const [hideNames, setHideNames] = useState(false);
    const [hideAnswers, setHideAnswers] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    const { post } = useForm();

    // Fast polling every 2 seconds for live responses
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/rooms/${initialRoom.id}/live-data`);
                if (res.ok) {
                    const data = await res.json();
                    const newStatus = data.status || data.room?.status;
                    setRoom((prev) => ({
                        ...prev,
                        status: newStatus || prev.status,
                        current_question_index: data.current_question_index ?? data.room?.current_question_index ?? prev.current_question_index,
                        participants: data.participants || prev.participants,
                    }));
                }
            } catch (e) {
                // Ignore temporary network errors
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [initialRoom.id]);

    const handleToggleLock = () => {
        const action = room.status === 'paused' ? 'resume' : 'pause';
        post(`/rooms/${room.id}/${action}`);
    };

    const handleEndSession = () => {
        if (confirm('Are you sure you want to end this room session? Participants will no longer be able to submit answers.')) {
            post(`/rooms/${room.id}/end`);
        }
    };

    const handleNextQuestion = () => {
        post(`/rooms/${room.id}/next-question`);
    };

    const handlePrevQuestion = () => {
        post(`/rooms/${room.id}/prev-question`);
    };

    const copyJoinLink = () => {
        const joinUrl = `${window.location.origin}/join?code=${room.code}`;
        navigator.clipboard.writeText(joinUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const questions = room.assessment?.questions || [];
    const participants = room.participants || [];
    const currentQ = questions[room.current_question_index || 0];

    const getParticipantTimeInfo = (created_at?: string, completed_at?: string) => {
        if (!created_at) return { isCompleted: false, text: 'In Progress' };

        const parseDate = (dStr: string) => {
            const iso = dStr.includes(' ') ? dStr.replace(' ', 'T') : dStr;
            const t = new Date(iso).getTime();
            return isNaN(t) ? Date.now() : t;
        };

        const startTime = parseDate(created_at);

        if (completed_at) {
            const endTime = parseDate(completed_at);
            const durationSecs = Math.max(0, Math.floor((endTime - startTime) / 1000));
            const mins = Math.floor(durationSecs / 60);
            const secs = durationSecs % 60;
            return {
                isCompleted: true,
                text: `Finished (${mins > 0 ? `${mins}m ` : ''}${secs}s)`,
            };
        }

        const elapsedSecs = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        const mins = Math.floor(elapsedSecs / 60);
        const secs = elapsedSecs % 60;
        return {
            isCompleted: false,
            text: `Elapsed: ${mins > 0 ? `${mins}m ` : ''}${secs}s`,
        };
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Live Dashboard', href: '#' }]}>
            <Head title={`Live Room Monitor - Code ${room.code}`} />

            <div className="p-4 sm:p-6 space-y-6 max-w-full min-w-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl shadow-xs text-card-foreground min-w-0">
                    <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-black text-xs uppercase tracking-wider">
                                LIVE ROOM CODE: {room.code}
                            </span>
                            <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-xs capitalize">
                                {room.mode.replace('_', ' ')}
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-foreground truncate">
                            {room.assessment?.title || 'Live Assessment Session'}
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button onClick={copyJoinLink} variant="outline" className="text-xs font-bold gap-2 cursor-pointer">
                            <Copy className="w-3.5 h-3.5" /> {copiedLink ? 'Link Copied!' : 'Copy Join Link'}
                        </Button>
                        <Button variant="outline" onClick={() => setHideNames(!hideNames)} className="font-bold text-xs gap-1.5 cursor-pointer">
                            {hideNames ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            {hideNames ? 'Show Names' : 'Hide Names'}
                        </Button>
                        {room.status !== 'completed' ? (
                            <>
                                <Button onClick={handleToggleLock} variant={room.status === 'paused' ? 'default' : 'outline'} className="text-xs font-bold gap-2 cursor-pointer">
                                    {room.status === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                                    {room.status === 'paused' ? 'Resume Room' : 'Pause Room'}
                                </Button>
                                <Button variant="destructive" onClick={handleEndSession} className="font-bold text-xs gap-2 cursor-pointer shadow-xs">
                                    <StopCircle className="w-3.5 h-3.5" /> End Session
                                </Button>
                            </>
                        ) : (
                            <Link href={`/reports/${room.id}`}>
                                <Button variant="default" className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs gap-2 cursor-pointer shadow-xs">
                                    <CheckCircle2 className="w-4 h-4" /> Session Completed - View Report
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {room.status === 'completed' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                            <div>
                                <h3 className="text-sm font-black">Examination Room Session Completed</h3>
                                <p className="text-xs font-semibold text-emerald-600/80 dark:text-emerald-400/80">This examination session has ended and candidate scorecards have been compiled.</p>
                            </div>
                        </div>
                        <Link href={`/reports/${room.id}`}>
                            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-xs whitespace-nowrap">
                                View Full Report
                            </Button>
                        </Link>
                    </div>
                )}

                {room.mode === 'teacher_paced' && (
                    <Card className="bg-primary/10 border-primary/20 p-4 text-card-foreground min-w-0">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 min-w-0">
                            <div className="space-y-1 text-center sm:text-left min-w-0 flex-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                                    Teacher-Paced Control (Question {room.current_question_index + 1} of {questions.length})
                                </span>
                                <h3 className="text-base font-bold text-foreground max-w-xl truncate">{currentQ?.question_text}</h3>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Button disabled={room.current_question_index <= 0} onClick={handlePrevQuestion} variant="outline" className="text-xs font-bold gap-1 cursor-pointer">
                                    <ChevronLeft className="w-4 h-4" /> Previous
                                </Button>
                                <Button disabled={room.current_question_index >= questions.length - 1} onClick={handleNextQuestion} className="text-xs font-bold gap-1 cursor-pointer shadow-xs">
                                    Next Question <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                <Card className="bg-card border-border text-card-foreground p-5 space-y-4 shadow-xs min-w-0">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" /> Live Student Response Grid ({participants.length} Joined)
                        </h3>
                    </div>

                    {participants.length === 0 ? (
                        <div className="text-center py-12 space-y-3">
                            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary font-black text-xl flex items-center justify-center mx-auto border border-primary/20">
                                {room.code}
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Waiting for Students to Join</h3>
                        </div>
                    ) : (
                        <div className="overflow-x-auto max-w-full rounded-xl border border-border">
                            <table className="w-full min-w-max text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-border text-muted-foreground uppercase tracking-wider font-extrabold text-[10px] bg-muted/30">
                                        <th className="p-3 w-12 text-center">NO.</th>
                                        <th className="p-3 min-w-[160px]">STUDENT NAME</th>
                                        <th className="p-3 min-w-[180px]">STATUS & EXAM TIME</th>
                                        <th className="p-3 text-center min-w-[100px]">TOTAL SCORE</th>
                                        {questions.map((q, idx) => (
                                            <th key={q.id} className="p-3 text-center min-w-[55px]">Q{idx + 1}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {participants.map((p, idx) => {
                                        const timeInfo = getParticipantTimeInfo(p.created_at, p.completed_at);
                                        return (
                                            <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="p-3 text-center font-bold text-muted-foreground text-xs">{idx + 1}</td>
                                                <td className="p-3 font-bold text-foreground text-sm">{hideNames ? `Student #${idx + 1}` : p.name}</td>
                                                <td className="p-3">
                                                    {timeInfo.isCompleted ? (
                                                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] border border-emerald-500/20 inline-flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {timeInfo.text}
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[11px] border border-amber-500/20 inline-flex items-center gap-1 animate-pulse">
                                                            <Clock className="w-3 h-3 text-amber-500" /> {timeInfo.text}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center font-extrabold text-foreground text-sm">{p.score} Pts</td>
                                                {questions.map((q) => {
                                                    const ans = (p.answers || []).find((a) => a.question_id === q.id);
                                                    return (
                                                        <td key={q.id} className="p-3 text-center">
                                                            {ans ? (
                                                                ans.is_correct ? (
                                                                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] inline-flex items-center justify-center border border-emerald-500/30">✓</span>
                                                                ) : (
                                                                    <span className="w-6 h-6 rounded-full bg-destructive/20 text-destructive font-bold text-[10px] inline-flex items-center justify-center border border-destructive/30">✕</span>
                                                                )
                                                            ) : (
                                                                <span className="w-2 h-2 rounded-full bg-muted-foreground/30 inline-block"></span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
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
