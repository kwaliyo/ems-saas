import LaunchModal from '@/components/assessments/LaunchModal';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Activity,
    Copy,
    FileCheck2,
    Layers,
    Play,
    Plus,
    Radio,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

interface Question {
    id: number;
}

interface Room {
    id: number;
    code: string;
    status: string;
    mode: string;
}

interface Assessment {
    id: number;
    title: string;
    description?: string;
    subject: string;
    grade_level?: string;
    questions_count: number;
    rooms_count: number;
    rooms?: Room[];
    created_at: string;
}

interface Props {
    assessments: Assessment[];
}

export default function AssessmentIndex({ assessments }: Props) {
    const [activeTab, setActiveTab] = useState<'ongoing' | 'all'>('ongoing');
    const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
    const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);

    const { post: duplicatePost } = useForm();
    const { delete: deletePost } = useForm();

    const handleOpenLaunch = (assessment: Assessment) => {
        setSelectedAssessment(assessment);
        setIsLaunchModalOpen(true);
    };

    const handleDuplicate = (id: number) => {
        duplicatePost(`/assessments/${id}/duplicate`);
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this assessment?')) {
            deletePost(`/assessments/${id}`);
        }
    };

    const ongoingAssessments = assessments.filter(
        (a) => a.rooms && a.rooms.some((r) => ['waiting', 'active', 'paused'].includes(r.status))
    );

    const displayedAssessments = activeTab === 'ongoing' ? ongoingAssessments : assessments;

    return (
        <AppLayout breadcrumbs={[{ title: 'Assessments', href: '/assessments' }]}>
            <Head title="Assessments - Real-Time Assessment Platform" />

            <div className="p-4 sm:p-6 space-y-6 w-full max-w-[1800px] mx-auto">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-5">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                            <FileCheck2 className="w-8 h-8 text-primary" /> Assessments Library
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Monitor ongoing live assessment rooms or manage assessment templates.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/assessments/create">
                            <Button className="font-bold shadow-xs gap-2 cursor-pointer">
                                <Plus className="w-4 h-4" /> Create Assessment (&lt;60s)
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 border-b border-border pb-1">
                    <button
                        onClick={() => setActiveTab('ongoing')}
                        className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer ${
                            activeTab === 'ongoing'
                                ? 'bg-primary text-primary-foreground border-b-2 border-primary'
                                : 'text-muted-foreground hover:text-foreground bg-muted/40'
                        }`}
                    >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Ongoing Live Assessments</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-background text-foreground text-[10px]">
                            {ongoingAssessments.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer ${
                            activeTab === 'all'
                                ? 'bg-primary text-primary-foreground border-b-2 border-primary'
                                : 'text-muted-foreground hover:text-foreground bg-muted/40'
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        <span>All Assessments Library</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-background text-foreground text-[10px]">
                            {assessments.length}
                        </span>
                    </button>
                </div>

                {/* Assessments Grid */}
                {displayedAssessments.length === 0 ? (
                    <Card className="bg-card text-card-foreground border-border text-center py-12 p-4 space-y-3 shadow-xs">
                        <Radio className="w-12 h-12 text-muted-foreground mx-auto" />
                        <h3 className="text-base font-bold text-foreground">
                            {activeTab === 'ongoing' ? 'No Ongoing Live Assessments' : 'No Assessments Created Yet'}
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto">
                            {activeTab === 'ongoing'
                                ? 'Launch a live room from any course module or assessment template to begin live testing.'
                                : 'Create your first assessment template with questions, instant answer keys, and automatic scoring.'}
                        </p>
                        {activeTab === 'ongoing' && (
                            <Button onClick={() => setActiveTab('all')} variant="outline" className="text-xs font-bold cursor-pointer">
                                View All Assessments Library →
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {displayedAssessments.map((a) => {
                            const activeRoom = (a.rooms || []).find((r) => ['waiting', 'active', 'paused'].includes(r.status));

                            return (
                                <Card
                                    key={a.id}
                                    className="bg-card border-border border-l-4 border-l-primary p-5 space-y-4 shadow-xs flex flex-col justify-between hover:border-primary/50 hover:shadow-md transition-all text-card-foreground rounded-2xl"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-black text-xs uppercase tracking-wider">
                                                {a.subject}
                                            </span>

                                            {activeRoom ? (
                                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-extrabold text-xs flex items-center gap-1.5 shadow-2xs">
                                                    <Radio className="w-3 h-3 animate-pulse text-emerald-500" /> Live Room ({activeRoom.code})
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-muted-foreground font-semibold bg-muted px-2 py-0.5 rounded border border-border">
                                                    {a.rooms_count || 0} Sessions
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="text-base sm:text-lg font-extrabold text-foreground leading-snug">
                                                {a.title}
                                            </h3>
                                            {a.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                    {a.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/60">
                                            <span className="font-bold text-foreground flex items-center gap-1">
                                                <FileCheck2 className="w-3.5 h-3.5 text-primary" /> {a.questions_count} Questions
                                            </span>
                                            {a.grade_level && <span>• {a.grade_level}</span>}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-3 border-t border-border space-y-2">
                                        {activeRoom ? (
                                            <Link href={`/rooms/${activeRoom.id}/dashboard`}>
                                                <Button className="w-full text-xs font-bold justify-between cursor-pointer shadow-xs bg-emerald-600 hover:bg-emerald-500 text-white">
                                                    <span className="flex items-center gap-1.5">
                                                        <Activity className="w-4 h-4" /> Monitor Live Room
                                                    </span>
                                                    <span>→</span>
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Button
                                                onClick={() => handleOpenLaunch(a)}
                                                className="w-full text-xs font-bold justify-between cursor-pointer shadow-xs"
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    <Play className="w-3.5 h-3.5 fill-current" /> Launch Live Room
                                                </span>
                                                <span>→</span>
                                            </Button>
                                        )}

                                        <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                                            <Link href={`/assessments/${a.id}/builder`} className="text-primary hover:underline font-bold">
                                                Edit Question Bank →
                                            </Link>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleDuplicate(a.id)}
                                                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-semibold cursor-pointer"
                                                    title="Duplicate Assessment"
                                                >
                                                    <Copy className="w-3.5 h-3.5" /> Duplicate
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(a.id)}
                                                    className="text-muted-foreground hover:text-destructive inline-flex items-center gap-1 font-semibold cursor-pointer"
                                                    title="Delete Assessment"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Launch Modal */}
                {selectedAssessment && (
                    <LaunchModal
                        isOpen={isLaunchModalOpen}
                        onClose={() => setIsLaunchModalOpen(false)}
                        assessment={selectedAssessment}
                    />
                )}
            </div>
        </AppLayout>
    );
}
