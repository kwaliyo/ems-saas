import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    Bookmark,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Eye,
    FileCheck2,
    Flag,
    HelpCircle,
    Info,
    Layers,
    LayoutGrid,
    LogOut,
    Maximize2,
    Rocket,
    Send,
    ShieldAlert,
    Sparkles,
    UserCheck,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface QuestionOption {
    id: number;
    option_text: string;
    order: number;
}

interface Question {
    id: number;
    order: number;
    type: 'multiple_choice' | 'true_false' | 'short_answer' | 'multi_select';
    question_text: string;
    explanation?: string;
    points: number;
    options: QuestionOption[];
}

interface Assessment {
    id: number;
    title: string;
    subject: string;
    questions: Question[];
}

interface Room {
    id: number;
    code: string;
    mode: 'student_paced' | 'teacher_paced' | 'space_race' | 'exit_ticket' | 'time_based';
    status: 'waiting' | 'active' | 'paused' | 'completed';
    current_question_index: number;
    started_at?: string;
    settings?: {
        show_feedback?: boolean;
        duration_minutes?: number;
    };
    assessment: Assessment;
}

interface Participant {
    id: number;
    name: string;
    score: number;
    team_color: string;
    completed_at?: string;
}

interface AnswerRecord {
    question_id: number;
    selected_option_ids?: number[];
    short_answer_text?: string;
    is_correct?: boolean;
    score_awarded?: number;
}

interface Props {
    room: Room;
    participant: Participant;
    answers: Record<string, AnswerRecord>;
}

export default function StudentRoom({ room, participant, answers: initialAnswers }: Props) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<number, AnswerRecord>>(initialAnswers);
    const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
    const [shortAnswer, setShortAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ is_correct: boolean; explanation?: string } | null>(null);
    const isHideScore = Boolean(
        (room.assessment as any)?.module !== undefined && (room.assessment as any)?.module !== null
            ? (room.assessment as any)?.module?.hide_score
            : (room.settings as any)?.hide_score
    );

    const isAllowReview = Boolean(
        (room.assessment as any)?.module !== undefined && (room.assessment as any)?.module !== null
            ? ((room.assessment as any)?.module?.allow_review ?? true)
            : ((room.settings as any)?.allow_review ?? true)
    );

    const [liveStatus, setLiveStatus] = useState(room.status);
    const [liveTeacherIdx, setLiveTeacherIdx] = useState(room.current_question_index);
    const [score, setScore] = useState(participant.score);
    const [tabSwitches, setTabSwitches] = useState<number>(() => {
        const key = `exam_violations_${room.id}_${participant.id}`;
        const stored = sessionStorage.getItem(key);
        if (stored) {
            const num = parseInt(stored, 10);
            if (!isNaN(num)) return num;
        }
        return 0;
    });
    const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
    const [autoSavingQuestionId, setAutoSavingQuestionId] = useState<number | null>(null);

    // Fullscreen & Instructions & Finishing state
    const [isStudentCompleted, setIsStudentCompleted] = useState<boolean>(() => {
        return participant.completed_at !== null || room.status === 'completed';
    });
    const [hasStartedExam, setHasStartedExam] = useState<boolean>(() => {
        return participant.completed_at !== null || Object.keys(initialAnswers || {}).length > 0;
    });
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState<boolean>(false);
    const [isFinalSubmitting, setIsFinalSubmitting] = useState<boolean>(false);

    // Accessibility state
    const [dyslexiaMode, setDyslexiaMode] = useState(false);
    const [highContrast, setHighContrast] = useState(false);
    const [fontSizeLevel, setFontSizeLevel] = useState<number>(1); // 0: 85%, 1: 100%, 2: 115%, 3: 130%

    const getTitleFontSize = () => {
        switch (fontSizeLevel) {
            case 0: return 'text-lg sm:text-xl';
            case 1: return 'text-xl sm:text-2xl';
            case 2: return 'text-2xl sm:text-3xl';
            case 3: return 'text-3xl sm:text-4xl';
            default: return 'text-xl sm:text-2xl';
        }
    };

    const getOptionFontSize = () => {
        switch (fontSizeLevel) {
            case 0: return 'text-sm sm:text-base';
            case 1: return 'text-base sm:text-lg';
            case 2: return 'text-lg sm:text-xl';
            case 3: return 'text-xl sm:text-2xl';
            default: return 'text-base sm:text-lg';
        }
    };

    const questions = room?.assessment?.questions || [];
    const currentQuestion = questions.length > 0
        ? questions[room.mode === 'teacher_paced' ? (liveTeacherIdx || 0) : (currentIdx || 0)]
        : null;

    // Live Timer state for Time-Based mode
    const durationMinutes = (room.settings as any)?.duration_minutes || (room.assessment as any)?.exam_duration_minutes || 60;
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

    const enterFullscreen = () => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
    };

    const hasStartedExamRef = useRef(hasStartedExam);
    useEffect(() => {
        hasStartedExamRef.current = hasStartedExam;
    }, [hasStartedExam]);

    const liveStatusRef = useRef(liveStatus);
    useEffect(() => {
        liveStatusRef.current = liveStatus;
    }, [liveStatus]);

    const handleFinishExamFinal = async () => {
        setIsFinalSubmitting(true);
        try {
            const token = (participant as any).session_token || participant.id;
            await fetch(`/api/room/${room.id}/student/${token}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
            });
            setIsStudentCompleted(true);
            setLiveStatus('completed');
            setIsFinishConfirmOpen(false);
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsFinalSubmitting(false);
        }
    };

    const recordViolation = useCallback(() => {
        if (!hasStartedExamRef.current || liveStatusRef.current === 'completed') return;

        setTabSwitches((prev) => {
            const newCount = prev + 1;
            const key = `exam_violations_${room.id}_${participant.id}`;
            sessionStorage.setItem(key, String(newCount));

            if (newCount >= 4) {
                // 4th Strike -> Auto-Submit paper immediately and persist all current progress!
                handleFinishExamFinal();
            }

            return newCount;
        });
    }, [room.id, participant.id]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFS = !!document.fullscreenElement;
            setIsFullscreen(isFS);
            if (!isFS && hasStartedExamRef.current && liveStatusRef.current !== 'completed') {
                recordViolation();
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden && hasStartedExamRef.current && liveStatusRef.current !== 'completed') {
                recordViolation();
            }
        };

        const handleWindowBlur = () => {
            if (hasStartedExamRef.current && liveStatusRef.current !== 'completed') {
                recordViolation();
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [recordViolation]);

    const handleStartExam = () => {
        setHasStartedExam(true);
        hasStartedExamRef.current = true;
        enterFullscreen();
    };

    // Persistent Candidate Exam Start Time for accurate live countdown
    const [examStartTimestamp] = useState<number>(() => {
        const key = `exam_start_time_${room.id}_${participant.id}`;
        const stored = sessionStorage.getItem(key);
        if (stored) {
            const num = parseInt(stored, 10);
            if (!isNaN(num)) return num;
        }
        if ((room as any).started_at) {
            const serverDate = (room as any).started_at.includes(' ')
                ? (room as any).started_at.replace(' ', 'T')
                : (room as any).started_at;
            const parsed = new Date(serverDate).getTime();
            if (!isNaN(parsed)) {
                sessionStorage.setItem(key, String(parsed));
                return parsed;
            }
        }
        const now = Date.now();
        sessionStorage.setItem(key, String(now));
        return now;
    });

    useEffect(() => {
        if (room.mode !== 'time_based' && !(room.settings as any)?.duration_minutes) return;

        const totalSecs = durationMinutes * 60;

        const updateTimer = () => {
            const elapsed = Math.floor((Date.now() - examStartTimestamp) / 1000);
            const left = Math.max(0, totalSecs - elapsed);
            setRemainingSeconds(left);

            if (left <= 0 && liveStatus !== 'completed' && !isStudentCompleted) {
                handleFinishExamFinal();
            }
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [examStartTimestamp, durationMinutes, room.mode, liveStatus, isStudentCompleted]);

    const formatRemainingTime = (totalSecs: number) => {
        const hrs = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Polling room state every 2 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const token = (participant as any)?.session_token || participant?.id;
                const res = await fetch(`/api/room/${room.id}/student/${token}/state`);
                if (res.ok) {
                    const data = await res.json();
                    const isRoomOrCandidateCompleted = Boolean(
                        data.is_completed ||
                        data.completed_at !== null ||
                        data.room_status === 'completed' ||
                        data.status === 'completed'
                    );

                    if (isRoomOrCandidateCompleted) {
                        if (!isStudentCompleted) {
                            setIsStudentCompleted(true);
                            setLiveStatus('completed');
                            if (document.fullscreenElement) {
                                document.exitFullscreen().catch(() => {});
                            }
                        }
                    } else {
                        setLiveStatus(data.room_status || data.status || room.status);
                    }

                    setLiveTeacherIdx(data.current_question_index);
                    if (data.participant_score !== undefined) {
                        setScore(data.participant_score);
                    }
                }
            } catch (e) {
                // Ignore network polling glitches
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [room.id, participant, isStudentCompleted, room.status]);

    // Update selected answer when index changes
    useEffect(() => {
        if (!currentQuestion) return;
        const existing = answers[currentQuestion.id];
        if (existing) {
            const opts = (existing.selected_option_ids || []).map((id: any) => Number(id));
            setSelectedOptions(opts);
            setShortAnswer(existing.short_answer_text || '');
            if (existing.is_correct !== undefined && room.settings?.show_feedback === true) {
                setFeedback({
                    is_correct: existing.is_correct,
                    explanation: currentQuestion.explanation,
                });
            } else {
                setFeedback(null);
            }
        } else {
            setSelectedOptions([]);
            setShortAnswer('');
            setFeedback(null);
        }
    }, [currentIdx, liveTeacherIdx, answers, currentQuestion]);

    const autoSaveAnswer = async (qId: number, opts: number[], shortText: string) => {
        setAutoSavingQuestionId(qId);
        try {
            const token = (participant as any).session_token || participant.id;
            const res = await fetch(`/api/room/${room.id}/student/${token}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    question_id: qId,
                    selected_option_ids: opts,
                    short_answer_text: shortText,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setAnswers((prev) => ({
                    ...prev,
                    [qId]: {
                        question_id: qId,
                        selected_option_ids: opts,
                        short_answer_text: shortText,
                        is_correct: data.is_correct,
                        score_awarded: data.score_awarded,
                    },
                }));
                if (data.total_score !== undefined) {
                    setScore(data.total_score);
                }
                if (room.settings?.show_feedback === true) {
                    setFeedback({
                        is_correct: data.is_correct,
                        explanation: currentQuestion?.explanation,
                    });
                } else {
                    setFeedback(null);
                }
            }
        } catch (err) {
            console.error('Failed to auto-save answer:', err);
        } finally {
            setAutoSavingQuestionId(null);
        }
    };

    const handleOptionToggle = (optId: number) => {
        if (!currentQuestion) return;
        const id = Number(optId);

        let newOpts: number[] = [];
        if (currentQuestion.type === 'multi_select') {
            newOpts = selectedOptions.map(Number).includes(id)
                ? selectedOptions.filter((i) => Number(i) !== id)
                : [...selectedOptions, id];
        } else {
            newOpts = [id];
        }

        setSelectedOptions(newOpts);
        autoSaveAnswer(currentQuestion.id, newOpts, shortAnswer);
    };

    const toggleMarkForReview = (qId: number) => {
        setFlaggedQuestions((prev) => ({
            ...prev,
            [qId]: !prev[qId],
        }));
    };

    const submitCurrentAnswer = async () => {
        if (!currentQuestion) return;
        await autoSaveAnswer(currentQuestion.id, selectedOptions, shortAnswer);
    };

    const handleNextQuestion = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx((prev) => prev + 1);
        }
    };

    const handlePrevQuestion = () => {
        if (currentIdx > 0) {
            setCurrentIdx((prev) => prev - 1);
        }
    };

    const answeredCount = Object.keys(answers).length;

    // PRE-EXAM INSTRUCTIONS SCREEN BEFORE STARTING
    if (!hasStartedExam && liveStatus !== 'completed') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8 flex flex-col items-center justify-center transition-colors duration-200">
                <Head title={`Exam Instructions - ${room.assessment.title}`} />

                <div className="max-w-4xl w-full space-y-6">
                    {/* Header Banner Card */}
                    <Card className="bg-card border-border shadow-2xl p-6 sm:p-8 space-y-5 rounded-3xl">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
                            <div className="flex items-center gap-3">
                                <span className="px-3.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-black text-xs uppercase tracking-wider">
                                    ROOM CODE: {room.code}
                                </span>
                                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-extrabold text-xs">
                                    {room.mode === 'student_paced' ? 'Student-Paced (Untimed)' : 'Time-Based Live Exam'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <AppearanceToggleDropdown />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
                                {room.assessment.title}
                            </h1>
                            <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-3 font-semibold">
                                <span>Subject: <strong className="text-foreground">{room.assessment.subject}</strong></span>
                                <span>•</span>
                                <span>Candidate: <strong className="text-primary font-bold">{participant.name}</strong></span>
                            </p>
                        </div>

                        {/* Overview Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                            <div className="p-4 rounded-2xl bg-muted/60 border border-border space-y-1">
                                <span className="text-muted-foreground font-medium text-[11px]">Total Questions</span>
                                <p className="font-extrabold text-foreground text-base sm:text-lg">{questions.length} Items</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/60 border border-border space-y-1">
                                <span className="text-muted-foreground font-medium text-[11px]">Time Limit</span>
                                <p className="font-extrabold text-primary text-base sm:text-lg font-mono">
                                    {durationMinutes ? `${String(Math.floor(durationMinutes / 60)).padStart(2, '0')}:${String(durationMinutes % 60).padStart(2, '0')}:00` : 'Untimed'}
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/60 border border-border space-y-1">
                                <span className="text-muted-foreground font-medium text-[11px]">Delivery Mode</span>
                                <p className="font-extrabold text-foreground text-sm uppercase tracking-wide">
                                    {room.mode ? room.mode.replace('_', ' ') : 'Time-Based'}
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/60 border border-border space-y-1">
                                <span className="text-muted-foreground font-medium text-[11px]">Invigilation Security</span>
                                <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">Strict Fullscreen</p>
                            </div>
                        </div>
                    </Card>

                    {/* Interactive Exam Card Walkthrough & Preview */}
                    <Card className="bg-card border-border shadow-2xl p-6 sm:p-8 space-y-6 rounded-3xl overflow-hidden">
                        <div className="space-y-1 border-b border-border pb-4">
                            <h2 className="text-lg sm:text-xl font-extrabold text-foreground flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-primary shrink-0" /> How the Examination Screen Works
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Review this preview of your exam screen layout, controls, timer, and question tools.
                            </p>
                        </div>

                        {/* Mockup Preview Box */}
                        <div className="rounded-2xl border-2 border-primary/30 bg-muted/40 p-4 sm:p-6 space-y-5 shadow-inner">
                            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border/80">
                                <span>Exam Topbar Layout</span>
                                <span className="text-primary font-mono">Interactive Live Control Bar</span>
                            </div>

                            {/* Mockup Topbar Controls */}
                            <div className="p-3 rounded-xl bg-background border border-border flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 rounded bg-primary/10 text-primary font-black text-xs uppercase">
                                        ROOM {room.code}
                                    </span>
                                    <span className="font-bold text-foreground truncate max-w-xs">{room.assessment.title}</span>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    {/* Timer Mockup Callout */}
                                    <div className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-mono font-extrabold text-xs flex items-center gap-1.5 shadow-xs animate-pulse">
                                        <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span>01:00:00 (Live Countdown Timer)</span>
                                    </div>

                                    {/* Font Scaler Mockup Callout */}
                                    <div className="flex items-center rounded-lg border border-border bg-muted p-0.5 text-xs font-bold">
                                        <span className="px-1.5 text-[10px] text-foreground font-mono">A- 100% A+ (Font Size Controls)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Mockup Question Card */}
                            <div className="p-5 rounded-2xl bg-background border border-border space-y-4 shadow-sm relative">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-black flex items-center justify-center text-xs">
                                            Q1
                                        </span>
                                        <span className="px-2.5 py-0.5 rounded bg-muted font-bold text-[10px] uppercase text-muted-foreground">
                                            Multiple Choice • 1 Point
                                        </span>
                                    </div>

                                    {/* Mark For Review Mockup Button */}
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 font-bold text-xs shadow-xs">
                                        <Bookmark className="w-3.5 h-3.5 fill-current text-amber-500" />
                                        <span>🚩 Mark for Review</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                                        Example Question: Which component manages memory and CPU scheduling?
                                    </h4>
                                </div>

                                <div className="space-y-2 text-xs pt-1">
                                    <div className="p-3.5 rounded-xl border-2 border-primary bg-primary/10 text-foreground font-bold flex items-center justify-between shadow-xs">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-md bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">A</span>
                                            <span>Operating System Kernel (Clicking an option selects it)</span>
                                        </div>
                                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                                    </div>

                                    <div className="p-3.5 rounded-xl border border-border bg-muted/40 text-muted-foreground flex items-center gap-3 opacity-80">
                                        <span className="w-6 h-6 rounded-md bg-muted font-bold text-xs flex items-center justify-center">B</span>
                                        <span>Web Browser JavaScript Engine</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Question Grid Color Legend & Navigation Instructions */}
                        <div className="p-4 rounded-2xl bg-muted/60 border border-border space-y-3 text-xs">
                            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2">
                                <LayoutGrid className="w-4 h-4 text-primary shrink-0" /> Question Navigator Grid & Color Legend
                            </h3>
                            <p className="text-muted-foreground">
                                Use the side question navigator panel to jump directly to any question. The grid buttons indicate your progress using the following color legend:
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                                <div className="p-3 rounded-xl bg-background border border-border flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground font-black flex items-center justify-center text-xs shadow-2xs">
                                        1
                                    </span>
                                    <div>
                                        <div className="font-extrabold text-foreground">Answered</div>
                                        <div className="text-[10px] text-muted-foreground">Response saved</div>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-background border border-border flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-lg bg-amber-500 text-white font-black flex items-center justify-center text-xs shadow-2xs relative">
                                        2 <span className="absolute -top-1 -right-1 text-[9px]">🚩</span>
                                    </span>
                                    <div>
                                        <div className="font-extrabold text-foreground">Marked for Review</div>
                                        <div className="text-[10px] text-muted-foreground">Flagged to check later</div>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-background border border-border flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-lg bg-muted text-muted-foreground border border-border font-bold flex items-center justify-center text-xs">
                                        3
                                    </span>
                                    <div>
                                        <div className="font-extrabold text-foreground">Unanswered</div>
                                        <div className="text-[10px] text-muted-foreground">Not yet attempted</div>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-background border-2 border-primary text-primary font-black flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-lg bg-primary/20 text-primary font-black flex items-center justify-center text-xs ring-2 ring-primary">
                                        4
                                    </span>
                                    <div>
                                        <div className="font-extrabold text-foreground">Current Active</div>
                                        <div className="text-[10px] text-muted-foreground">Active question</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step by Step Guidelines Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-2">
                                <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary shrink-0" /> 1. Live Countdown Timer
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    The topbar displays your live <strong>HH:MM:SS</strong> timer counting down continuously. If time runs out, your exam paper automatically saves and submits.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-2">
                                <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2">
                                    <Bookmark className="w-4 h-4 text-amber-500 shrink-0" /> 2. Mark Questions for Review
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Click <strong>Mark for Review 🚩</strong> on any question you are unsure about. Flagged questions display a yellow flag badge in the side navigator so you can revisit them anytime.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-2">
                                <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary shrink-0" /> 3. Adjust Text & Font Sizes
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Use the <strong>A- / A+</strong> text scale buttons or toggle <strong>Dyslexia Mode</strong> in the topbar anytime to increase font readability up to 130%.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-2">
                                <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" /> 4. Browser Fullscreen & Security
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Starting the exam enters Fullscreen mode. Avoid exiting fullscreen or switching browser tabs to prevent invigilation security alerts.
                                </p>
                            </div>
                        </div>

                        {/* CTA Start Button */}
                        <div className="pt-2">
                            <Button
                                onClick={handleStartExam}
                                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-base shadow-xl gap-2 active:scale-[0.99] rounded-2xl cursor-pointer"
                            >
                                <Maximize2 className="w-5 h-5" /> Start Live Examination & Enter Fullscreen →
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-200 ${
            highContrast ? 'bg-black text-yellow-400 font-mono' : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100'
        } ${dyslexiaMode ? 'font-serif' : ''}`}>
            <Head title={`${room.assessment.title} - Room ${room.code}`} />

            {/* Top Navigation Header */}
            <header className="sticky top-0 z-30 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 shadow-lg">
                <div className="w-full max-w-[1800px] mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs uppercase tracking-wider border border-indigo-200 dark:border-indigo-500/30">
                            ROOM {room.code}
                        </span>
                        <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate max-w-md sm:max-w-xl">
                            {room.assessment.title}
                        </h1>
                    </div>

                    {/* Controls & Participant Info */}
                    <div className="flex items-center gap-2 text-xs">
                        {liveStatus !== 'completed' && (
                            room.mode === 'student_paced' ? (
                                <div className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs flex items-center gap-1.5 shadow-xs">
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span>Student-Paced (Untimed)</span>
                                </div>
                            ) : remainingSeconds !== null ? (
                                <div className={`px-3 py-1.5 rounded-lg border font-mono font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md ${
                                    remainingSeconds < 300
                                        ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-500/50 text-rose-800 dark:text-rose-300 animate-pulse'
                                        : 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                                }`}>
                                    <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span>{formatRemainingTime(remainingSeconds)}</span>
                                </div>
                            ) : null
                        )}

                        {/* Font Size Adjuster Control */}
                        <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-bold shadow-2xs">
                            <button
                                type="button"
                                title="Decrease Font Size"
                                disabled={fontSizeLevel === 0}
                                onClick={() => setFontSizeLevel(prev => Math.max(0, prev - 1))}
                                className="px-2 py-1 rounded-md text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                            >
                                A-
                            </button>
                            <span className="px-1 text-[10px] text-muted-foreground font-mono">
                                {fontSizeLevel === 0 ? '85%' : fontSizeLevel === 1 ? '100%' : fontSizeLevel === 2 ? '115%' : '130%'}
                            </span>
                            <button
                                type="button"
                                title="Increase Font Size"
                                disabled={fontSizeLevel === 3}
                                onClick={() => setFontSizeLevel(prev => Math.min(3, prev + 1))}
                                className="px-2 py-1 rounded-md text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                            >
                                A+
                            </button>
                        </div>

                        {liveStatus !== 'completed' && !isFullscreen && (
                            <button
                                onClick={enterFullscreen}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 font-bold text-xs flex items-center gap-1.5 transition-colors animate-pulse"
                            >
                                <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
                            </button>
                        )}

                        <AppearanceToggleDropdown />

                        <button
                            onClick={() => setDyslexiaMode(!dyslexiaMode)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hidden sm:inline-block font-semibold transition-colors"
                        >
                            {dyslexiaMode ? 'Standard Font' : 'Dyslexia Mode'}
                        </button>

                        <div className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                            <span>{participant.name}</span>
                            {!isHideScore && (
                                <>
                                    <span className="text-slate-400 dark:text-slate-500">|</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-black">{score} pts</span>
                                </>
                            )}
                        </div>

                        {liveStatus !== 'completed' ? (
                            <Button
                                type="button"
                                onClick={() => setIsFinishConfirmOpen(true)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-3 gap-1.5 shadow-md"
                            >
                                <LogOut className="w-3.5 h-3.5" /> Finish Exam
                            </Button>
                        ) : (
                            <a
                                href="/join"
                                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                            >
                                <LogOut className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" /> Exit Portal
                            </a>
                        )}
                    </div>
                </div>
            </header>

            {/* Anti-Cheat Strike Warning Banners */}
            {hasStartedExam && (
                liveStatus === 'completed' ? (
                    tabSwitches >= 4 && (
                        <div className="bg-rose-600 text-white border-b border-rose-700 px-4 py-3 text-center text-xs font-black flex items-center justify-center gap-2 shadow-md">
                            <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
                            <span>SECURITY VIOLATION AUTO-SUBMITTED (4/4 Strikes): Your examination was automatically terminated & submitted due to security violations. All recorded answers have been saved.</span>
                        </div>
                    )
                ) : (
                    tabSwitches > 0 && (
                        tabSwitches >= 4 ? (
                            <div className="bg-rose-600 text-white border-b border-rose-700 px-4 py-3 text-center text-xs font-black flex items-center justify-center gap-2 shadow-md">
                                <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
                                <span>SECURITY VIOLATION AUTO-SUBMITTED (4/4 Strikes): Your examination has been automatically terminated & submitted due to repeated fullscreen / focus violations.</span>
                            </div>
                        ) : tabSwitches === 3 ? (
                            <div className="bg-rose-100 dark:bg-rose-950/90 border-b border-rose-400 dark:border-rose-500/60 px-4 py-2.5 text-center text-xs font-black text-rose-900 dark:text-rose-200 flex items-center justify-center gap-2 animate-bounce">
                                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                                <span>CRITICAL WARNING (Strike 3/4): 3 security violations recorded! Your NEXT fullscreen exit or tab switch will IMMEDIATELY auto-submit your exam paper!</span>
                                <button
                                    onClick={enterFullscreen}
                                    className="px-2.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-500 transition-colors ml-2 cursor-pointer"
                                >
                                    Re-Enter Fullscreen
                                </button>
                            </div>
                        ) : (
                            <div className="bg-amber-100 dark:bg-amber-950/80 border-b border-amber-300 dark:border-amber-500/40 px-4 py-2 text-center text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center justify-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>Security Alert (Strike {tabSwitches}/4): Fullscreen exit / window focus loss detected ({tabSwitches} times). {4 - tabSwitches} strikes remaining before automatic paper submission.</span>
                                {!isFullscreen && (
                                    <button
                                        onClick={enterFullscreen}
                                        className="px-2.5 py-0.5 rounded bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-500 transition-colors ml-2 cursor-pointer"
                                    >
                                        Re-Enter Fullscreen
                                    </button>
                                )}
                            </div>
                        )
                    )
                )
            )}

            {!isFullscreen && hasStartedExam && liveStatus === 'active' && tabSwitches < 1 && (
                <div className="bg-rose-100 dark:bg-rose-950/80 border-b border-rose-300 dark:border-rose-500/40 px-4 py-2 text-center text-xs text-rose-800 dark:text-rose-300 flex items-center justify-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>You have exited Fullscreen mode. Please re-enter fullscreen for assessment security.</span>
                    <button
                        onClick={enterFullscreen}
                        className="px-2.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-500 transition-colors cursor-pointer"
                    >
                        Re-Enter Fullscreen
                    </button>
                </div>
            )}

            {/* Main Content Area */}
            <main className="w-full max-w-[1800px] mx-auto p-4 sm:p-6 space-y-6">
                {liveStatus === 'completed' ? (
                    <div className="max-w-6xl mx-auto space-y-6">
                        {/* Executive Score & Performance Banner */}
                        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6 text-center sm:text-left">
                                <div className="space-y-2">
                                    <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/30">
                                        EXAM CONCLUDED
                                    </span>
                                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                                        {room.assessment.title}
                                    </h2>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        Candidate: <strong className="text-slate-900 dark:text-white">{participant.name}</strong> • Completed: <strong className="text-slate-700 dark:text-slate-200">{new Date().toLocaleTimeString()}</strong>
                                    </p>
                                </div>

                                {!isHideScore ? (
                                    <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center min-w-[180px] space-y-1 shadow-inner">
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Final Achieved Score</span>
                                        <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                                            {score} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ {questions.reduce((acc, q) => acc + (q.points || 1), 0)} pts</span>
                                        </div>
                                        <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-300 pt-0.5">
                                            {questions.reduce((acc, q) => acc + (q.points || 1), 0) > 0 ? Math.round((score / questions.reduce((acc, q) => acc + (q.points || 1), 0)) * 100) : 0}% Grade
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 text-center max-w-xs space-y-1 shadow-inner">
                                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">Score Status</span>
                                        <p className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200">
                                            Examination scores are configured as hidden by your instructor.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Stats Grid */}
                            <div className={`grid gap-3 text-xs ${isHideScore ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
                                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Total Questions</span>
                                    <p className="font-extrabold text-slate-900 dark:text-white text-base">{questions.length}</p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Answered</span>
                                    <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">{answeredCount}</p>
                                </div>
                                {!isHideScore && (
                                    <>
                                        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Unanswered</span>
                                            <p className="font-extrabold text-amber-600 dark:text-amber-400 text-base">{questions.length - answeredCount}</p>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Score Percentage</span>
                                            <p className="font-extrabold text-indigo-600 dark:text-indigo-300 text-base">
                                                {questions.reduce((acc, q) => acc + (q.points || 1), 0) > 0 ? Math.round((score / questions.reduce((acc, q) => acc + (q.points || 1), 0)) * 100) : 0}%
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </Card>

                        {/* Question Review Section (If Enabled for Module) */}
                        {isAllowReview ? (
                            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-2xl">
                                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <FileCheck2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Exam Question & Answer Review
                                        </h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Review your responses, correct keys, and question explanations.</p>
                                    </div>
                                    <span className="px-3 py-1 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs uppercase border border-indigo-200 dark:border-indigo-500/30">
                                        Review Enabled
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {questions.map((q, qIdx) => {
                                        const ansRecord = answers[q.id];
                                        const selectedIds = (ansRecord?.selected_option_ids || []).map((id: any) => Number(id));
                                        const isCorrect = ansRecord?.is_correct;

                                        return (
                                            <div
                                                key={q.id}
                                                className={`p-5 rounded-2xl border space-y-4 transition-all ${
                                                    !ansRecord
                                                        ? 'bg-slate-100/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                                                        : isCorrect
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/30'
                                                        : 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/30'
                                                }`}
                                            >
                                                {/* Question Header Banner */}
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
                                                        {!ansRecord ? (
                                                            <span className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px]">Unanswered</span>
                                                        ) : isCorrect ? (
                                                            <span className="px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-[11px] flex items-center gap-1">
                                                                <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{ansRecord.score_awarded ?? q.points} Pts)
                                                            </span>
                                                        ) : (
                                                            <span className="px-2.5 py-1 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 text-[11px] flex items-center gap-1">
                                                                <XCircle className="w-3.5 h-3.5" /> Incorrect (0 Pts)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Question Prompt */}
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                                                    {q.question_text}
                                                </h4>

                                                {/* Options Review or Short Answer Review */}
                                                {q.type !== 'short_answer' ? (
                                                    <div className="space-y-2 text-xs">
                                                        {q.options.map((opt, oIdx) => {
                                                            const isCandidateChoice = selectedIds.includes(Number(opt.id));
                                                            const isCorrectKey = (opt as any).is_correct;

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
                                                                            <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30">Your Choice</span>
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
                                                    <div className="space-y-2 text-xs">
                                                        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                                                            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Your Short Answer Submission:</span>
                                                            <p className="font-bold text-slate-900 dark:text-white">{ansRecord?.short_answer_text || 'No answer submitted.'}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Explanation if present */}
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
                        ) : (
                            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-center py-10 px-6 max-w-lg mx-auto space-y-3 shadow-xl">
                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center mx-auto">
                                    <Info className="w-6 h-6" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Detailed Question Review Disabled</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                    Detailed question review and answer keys are disabled for this module by your instructor.
                                </p>
                            </Card>
                        )}
                    </div>
                ) : liveStatus === 'paused' ? (
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-center py-16 px-6 max-w-md mx-auto space-y-4">
                        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                            <Clock className="w-8 h-8 animate-spin" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Activity Paused</h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400">The instructor has temporarily paused the assessment.</p>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {/* Executive 5-Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                            {/* Left 4 Columns: Main Question Card & Bottom Controls */}
                            <div className="lg:col-span-4 space-y-4">
                                {currentQuestion && (
                                    <Card className={`border shadow-2xl overflow-hidden transition-all ${
                                        highContrast ? 'bg-black border-yellow-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                    }`}>
                                        {/* Card Top Banner */}
                                        <div className="bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/80 p-4 flex flex-wrap items-center justify-between text-xs gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-black flex items-center justify-center text-xs">
                                                    Q{currentIdx + 1}
                                                </span>
                                                <span className="px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 font-extrabold text-[10px] uppercase">
                                                    {currentQuestion.type.replace('_', ' ')}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Button
                                                    type="button"
                                                    onClick={() => toggleMarkForReview(currentQuestion.id)}
                                                    className={`text-xs font-bold gap-1.5 h-8 px-3 cursor-pointer transition-all ${
                                                        flaggedQuestions[currentQuestion.id]
                                                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
                                                            : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                                                    }`}
                                                >
                                                    <Bookmark className={`w-3.5 h-3.5 ${flaggedQuestions[currentQuestion.id] ? 'fill-current text-white' : ''}`} />
                                                    {flaggedQuestions[currentQuestion.id] ? 'Marked for Review 🚩' : 'Mark for Review'}
                                                </Button>

                                                <span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">
                                                    Worth <strong className="text-indigo-600 dark:text-indigo-400">{currentQuestion.points}</strong> {currentQuestion.points === 1 ? 'Point' : 'Points'}
                                                </span>
                                            </div>
                                        </div>

                                        <CardHeader className="space-y-3 p-6 pb-3">
                                            <CardTitle className={`${getTitleFontSize()} font-bold leading-relaxed text-slate-900 dark:text-slate-100 whitespace-pre-wrap`}>
                                                {currentQuestion.question_text}
                                            </CardTitle>
                                        </CardHeader>

                                        <CardContent className="space-y-6 p-6 pt-2">
                                            {/* Question Options / Inputs */}
                                            {currentQuestion.type !== 'short_answer' ? (
                                                <div className="space-y-3">
                                                    {currentQuestion.options.map((opt, oIdx) => {
                                                        const isSelected = selectedOptions.map(Number).includes(Number(opt.id));
                                                        return (
                                                            <button
                                                                key={opt.id}
                                                                type="button"
                                                                onClick={() => handleOptionToggle(opt.id)}
                                                                className={`w-full p-4 rounded-xl text-left border font-semibold ${getOptionFontSize()} transition-all flex items-center justify-between group cursor-pointer ${
                                                                    isSelected
                                                                        ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 text-indigo-900 dark:text-white shadow-lg shadow-indigo-600/10 ring-1 ring-indigo-500'
                                                                        : 'bg-slate-100/80 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-850'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3.5">
                                                                    <span className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center font-bold transition-colors ${
                                                                        isSelected
                                                                            ? 'bg-indigo-600 text-white'
                                                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 group-hover:bg-slate-300 dark:group-hover:bg-slate-700 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                                                                    }`}>
                                                                        {String.fromCharCode(65 + oIdx)}
                                                                    </span>
                                                                    <span className="leading-snug">{opt.option_text}</span>
                                                                </div>
                                                                {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <Input
                                                        type="text"
                                                        placeholder="Type your short answer here..."
                                                        value={shortAnswer}
                                                        onChange={(e) => setShortAnswer(e.target.value)}
                                                        onBlur={() => {
                                                            if (shortAnswer.trim()) {
                                                                autoSaveAnswer(currentQuestion.id, selectedOptions, shortAnswer);
                                                            }
                                                        }}
                                                        className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-12 text-sm font-semibold"
                                                    />
                                                </div>
                                            )}

                                            {/* Instant Feedback Notice */}
                                            {feedback && (
                                                <div className={`p-4 rounded-xl border space-y-2 ${
                                                    feedback.is_correct
                                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                                                        : 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
                                                }`}>
                                                    <div className="flex items-center gap-2 font-bold text-sm">
                                                        {feedback.is_correct ? (
                                                            <>
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Correct Response!
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" /> Incorrect Response
                                                            </>
                                                        )}
                                                    </div>
                                                    {feedback.explanation && (
                                                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                                                            <strong>Explanation:</strong> {feedback.explanation}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Action Control Navigation Bar */}
                                            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80 pt-4 gap-3">
                                                <Button
                                                    type="button"
                                                    onClick={handlePrevQuestion}
                                                    disabled={currentIdx === 0}
                                                    variant="outline"
                                                    className="bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs gap-1.5 h-10 cursor-pointer"
                                                >
                                                    <ChevronLeft className="w-4 h-4" /> Previous
                                                </Button>

                                                {autoSavingQuestionId === currentQuestion.id ? (
                                                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 px-3.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/20">
                                                        <Sparkles className="w-4 h-4 animate-spin" /> Saving Selection...
                                                    </span>
                                                ) : answers[currentQuestion.id] ? (
                                                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Auto-Saved
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-500 font-medium italic">
                                                        Click any option to select & auto-save
                                                    </span>
                                                )}

                                                <Button
                                                    type="button"
                                                    onClick={handleNextQuestion}
                                                    disabled={currentIdx === questions.length - 1}
                                                    className="bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs gap-1.5 h-10 cursor-pointer"
                                                >
                                                    Next <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Right 1 Column: Question Navigator Side Grid */}
                            <div className="lg:col-span-1 space-y-4">
                                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5 space-y-4 sticky top-20 shadow-xl">
                                    <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Question Navigator
                                        </h3>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-600 dark:text-slate-400">Progress</span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{answeredCount} of {questions.length} Saved</span>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-950 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                                                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Question Numbers Grid */}
                                    <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2">
                                        {questions.map((q, idx) => {
                                            const isCurrent = idx === currentIdx;
                                            const isAnswered = !!answers[q.id];
                                            const isFlagged = !!flaggedQuestions[q.id];
                                            return (
                                                <button
                                                    key={q.id}
                                                    type="button"
                                                    onClick={() => setCurrentIdx(idx)}
                                                    className={`h-9 rounded-lg font-bold text-xs transition-all flex items-center justify-center relative cursor-pointer ${
                                                        isCurrent
                                                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900 shadow-lg'
                                                            : isFlagged
                                                            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-2 border-amber-400 dark:border-amber-500/60 font-black'
                                                            : isAnswered
                                                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                                                            : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                                                    }`}
                                                >
                                                    <span>Q{idx + 1}</span>
                                                    {isFlagged && <span className="absolute -top-1 -right-1 text-[10px]">🚩</span>}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Finish Exam Button */}
                                    <Button
                                        type="button"
                                        onClick={() => setIsFinishConfirmOpen(true)}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2 h-10 shadow-lg cursor-pointer"
                                    >
                                        <LogOut className="w-4 h-4" /> Finish & Submit Final Exam
                                    </Button>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal: Finish & Submit Final Exam Confirmation */}
            <Dialog open={isFinishConfirmOpen} onOpenChange={setIsFinishConfirmOpen}>
                <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileCheck2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Finish & Submit Final Exam?
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
                            Are you sure you want to finalize your exam submission for "{room.assessment.title}"?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-2 text-xs">
                        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
                                <span>Answered Questions</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{answeredCount} of {questions.length}</span>
                            </div>
                            {answeredCount < questions.length && (
                                <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 font-medium flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>Warning: You have {questions.length - answeredCount} unanswered questions remaining!</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsFinishConfirmOpen(false)}
                                className="w-1/2 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs h-10 cursor-pointer"
                            >
                                Return to Questions
                            </Button>
                            <Button
                                type="button"
                                disabled={isFinalSubmitting}
                                onClick={handleFinishExamFinal}
                                className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 gap-1.5 shadow-lg cursor-pointer"
                            >
                                {isFinalSubmitting ? 'Submitting...' : 'Yes, Finish Exam'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
