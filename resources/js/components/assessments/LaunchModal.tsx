import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { CheckCircle2, Clock, Layers, Play, Rocket, Sparkles, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Assessment {
    id: number;
    title: string;
    questions_count?: number;
    module?: {
        exam_duration_minutes?: number | null;
    };
}

interface ModuleItem {
    id: number;
    title: string;
    code?: string;
    exam_duration_minutes?: number | null;
    questions_count?: number;
}

interface Props {
    assessment?: Assessment | null;
    module?: ModuleItem | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function LaunchModal({ assessment, module, isOpen, onClose }: Props) {
    const [selectedMode, setSelectedMode] = useState<'time_based' | 'student_paced' | 'teacher_paced' | 'space_race' | 'exit_ticket'>('time_based');

    const duration = module?.exam_duration_minutes || assessment?.module?.exam_duration_minutes || 60;
    const title = module ? `${module.code ? `[${module.code}] ` : ''}${module.title} Exam` : assessment?.title || 'Assessment';

    const { data, setData, post, processing } = useForm({
        mode: 'time_based',
        duration_minutes: duration,
        shuffle_questions: false,
        shuffle_answers: false,
        show_feedback: false,
    });

    useEffect(() => {
        if (isOpen) {
            const targetDuration = module?.exam_duration_minutes ?? assessment?.module?.exam_duration_minutes ?? 60;
            setData('duration_minutes', targetDuration);
        }
    }, [isOpen, module, assessment]);

    if (!assessment && !module) return null;

    const handleLaunch = (e: React.FormEvent) => {
        e.preventDefault();
        if (module) {
            post(`/modules/${module.id}/launch`, {
                onSuccess: () => onClose(),
            });
        } else if (assessment) {
            post(`/assessments/${assessment.id}/launch`, {
                onSuccess: () => onClose(),
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg bg-card border-border text-card-foreground p-6 shadow-xl">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <Play className="w-5 h-5 text-primary fill-current" /> Launch Assessment Room
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Launching "{title}". Configure delivery mode and timer settings.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleLaunch} className="space-y-5 mt-4">
                    {/* Activity Mode Selection */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider text-primary">
                            Select Delivery Mode
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Time-Based Mode */}
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedMode('time_based');
                                    setData('mode', 'time_based');
                                }}
                                className={`p-3.5 rounded-xl border text-left space-y-1 transition-all cursor-pointer relative ${
                                    selectedMode === 'time_based'
                                        ? 'bg-primary/10 border-primary text-primary ring-1 ring-primary font-bold shadow-xs'
                                        : 'bg-muted/50 border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <Clock className="w-5 h-5 text-primary" />
                                    {selectedMode === 'time_based' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                                </div>
                                <div className="font-bold text-xs text-foreground">Time-Based Exam</div>
                                <div className="text-[10px] text-muted-foreground">Live countdown timer. Auto-submits when time expires.</div>
                            </button>

                            {/* Student-Paced Mode */}
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedMode('student_paced');
                                    setData('mode', 'student_paced');
                                }}
                                className={`p-3.5 rounded-xl border text-left space-y-1 transition-all cursor-pointer relative ${
                                    selectedMode === 'student_paced'
                                        ? 'bg-primary/10 border-primary text-primary ring-1 ring-primary font-bold shadow-xs'
                                        : 'bg-muted/50 border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    {selectedMode === 'student_paced' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                                </div>
                                <div className="font-bold text-xs text-foreground">Student-Paced</div>
                                <div className="text-[10px] text-muted-foreground">Untimed exam. Students answer at their own speed.</div>
                            </button>

                            {/* Teacher-Paced Mode */}
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedMode('teacher_paced');
                                    setData('mode', 'teacher_paced');
                                }}
                                className={`p-3.5 rounded-xl border text-left space-y-1 transition-all cursor-pointer relative ${
                                    selectedMode === 'teacher_paced'
                                        ? 'bg-primary/10 border-primary text-primary ring-1 ring-primary font-bold shadow-xs'
                                        : 'bg-muted/50 border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    {selectedMode === 'teacher_paced' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                                </div>
                                <div className="font-bold text-xs text-foreground">Teacher-Paced</div>
                                <div className="text-[10px] text-muted-foreground">Instructor controls question progression.</div>
                            </button>

                            {/* Space Race Mode */}
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedMode('space_race');
                                    setData('mode', 'space_race');
                                }}
                                className={`p-3.5 rounded-xl border text-left space-y-1 transition-all cursor-pointer relative ${
                                    selectedMode === 'space_race'
                                        ? 'bg-primary/10 border-primary text-primary ring-1 ring-primary font-bold shadow-xs'
                                        : 'bg-muted/50 border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <Rocket className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                                    {selectedMode === 'space_race' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                                </div>
                                <div className="font-bold text-xs text-foreground">Space Race</div>
                                <div className="text-[10px] text-muted-foreground">Gamified competitive team race mode.</div>
                            </button>
                        </div>
                    </div>

                    {/* Timer Duration Input if Time-Based Mode */}
                    {selectedMode === 'time_based' ? (
                        <div className="space-y-2 p-4 rounded-xl bg-muted/60 border border-border">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="duration_minutes" className="text-xs font-bold flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-primary" /> Exam Time Limit (Minutes)
                                </Label>
                                <span className="text-[11px] font-bold text-primary">
                                    Default: {duration} mins
                                </span>
                            </div>
                            <Input
                                id="duration_minutes"
                                type="number"
                                min={1}
                                max={300}
                                value={data.duration_minutes}
                                onChange={(e) => setData('duration_minutes', parseInt(e.target.value) || 60)}
                                className="bg-background border-input text-foreground font-bold text-xs"
                            />
                        </div>
                    ) : selectedMode === 'student_paced' ? (
                        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
                            <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div>
                                <span className="font-bold">Untimed Student-Paced Mode:</span> No countdown timer will be displayed to candidates during this exam.
                            </div>
                        </div>
                    ) : null}

                    {/* Action Controls */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="text-xs font-bold cursor-pointer"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold gap-2 cursor-pointer shadow-md"
                        >
                            {processing ? (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 animate-spin" /> Launching Room...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Play className="w-4 h-4 fill-current" /> Start Live Assessment Room
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
