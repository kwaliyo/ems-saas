import LaunchModal from '@/components/assessments/LaunchModal';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Activity,
    Award,
    BarChart3,
    BookOpen,
    Clock,
    Eye,
    EyeOff,
    FileCheck2,
    HelpCircle,
    Layers,
    Pencil,
    Play,
    Plus,
    RotateCcw,
    Sparkles,
    Trash2,
    Upload,
    UserCheck,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface Assessment {
    id: number;
    title: string;
    questions_count?: number;
    rooms?: { id: number; code: string; status: string }[];
}

interface Module {
    id: number;
    title: string;
    code?: string;
    description?: string;
    exam_duration_minutes?: number | null;
    allow_retake: boolean;
    allow_review: boolean;
    hide_score: boolean;
    visibility: 'published' | 'draft' | 'hidden';
    order: number;
    questions_count?: number;
    assessments?: Assessment[];
}

interface Student {
    id: number;
    name: string;
    email: string;
    student_id?: string;
    created_at?: string;
}

interface Course {
    id: number;
    title: string;
    code: string;
    description?: string;
    modules: Module[];
    students: Student[];
}

interface Props {
    course: Course;
    availableAssessments: Assessment[];
}

export default function CourseShow({ course, availableAssessments }: Props) {
    const [editingModule, setEditingModule] = useState<Module | null>(null);
    const [selectedLaunchModule, setSelectedLaunchModule] = useState<Module | null>(null);
    const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
    const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [isImportStudentCsvOpen, setIsImportStudentCsvOpen] = useState(false);
    const [isRosterOpen, setIsRosterOpen] = useState(false);
    const [rosterSearch, setRosterSearch] = useState('');

    const { data: moduleData, setData: setModuleData, post: postModule, processing: moduleProcessing, reset: resetModule } = useForm({
        title: '',
        code: '',
        description: '',
        exam_duration_minutes: '' as number | string,
        allow_retake: false,
        allow_review: true,
        hide_score: false,
        visibility: 'published' as 'published' | 'draft' | 'hidden',
    });

    const { data: editModuleData, setData: setEditModuleData, put: putModule, processing: editModuleProcessing } = useForm({
        title: '',
        code: '',
        description: '',
        exam_duration_minutes: '' as number | string,
        allow_retake: false,
        allow_review: true,
        hide_score: false,
        visibility: 'published' as 'published' | 'draft' | 'hidden',
    });

    // Form for Manual Student Enrolment
    const { data: enrollData, setData: setEnrollData, post: postEnroll, processing: enrollProcessing, reset: resetEnroll, errors: enrollErrors } = useForm({
        student_number: '',
        first_name: '',
        middle_name: '',
        surname: '',
        gender: 'male',
        date_of_birth: '',
        email: '',
        password: 'password123',
    });

    // Form for Student CSV Import
    const { data: studentCsvData, setData: setStudentCsvData, post: postStudentCsv, processing: studentCsvProcessing, reset: resetStudentCsv, errors: studentCsvErrors } = useForm({
        csv_file: null as File | null,
    });

    const { delete: deleteModulePost } = useForm();

    const [toast, setToast] = useState<{ title: string; message: string; type?: 'success' | 'danger' | 'info' } | null>(null);

    const triggerToast = (title: string, message: string, type: 'success' | 'danger' | 'info' = 'success') => {
        setToast({ title, message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleAddModule = (e: React.FormEvent) => {
        e.preventDefault();
        postModule(`/courses/${course.id}/modules`, {
            onSuccess: () => {
                resetModule();
                setIsCreateModuleOpen(false);
                triggerToast('Module Created', 'New exam module added successfully.', 'success');
            },
        });
    };

    const handleOpenEditModule = (m: Module) => {
        setEditingModule(m);
        setEditModuleData({
            title: m.title,
            code: m.code || '',
            description: m.description || '',
            exam_duration_minutes: m.exam_duration_minutes || '',
            allow_retake: m.allow_retake,
            allow_review: m.allow_review,
            hide_score: m.hide_score,
            visibility: m.visibility,
        });
    };

    const handleUpdateModule = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingModule) return;
        putModule(`/courses/${course.id}/modules/${editingModule.id}`, {
            onSuccess: () => {
                setEditingModule(null);
                triggerToast('Module Updated', 'Module configuration saved.', 'success');
            },
        });
    };

    const handleDeleteModule = (moduleId: number) => {
        if (confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
            deleteModulePost(`/courses/${course.id}/modules/${moduleId}`, {
                onSuccess: () => triggerToast('Module Deleted', 'Module removed from curriculum.', 'info'),
            });
        }
    };

    const handleEnrollStudent = (e: React.FormEvent) => {
        e.preventDefault();
        postEnroll(`/courses/${course.id}/students`, {
            onSuccess: () => {
                resetEnroll();
                setIsAddStudentOpen(false);
                triggerToast('Student Enrolled', 'Student added to course roster.', 'success');
            },
        });
    };

    const handleImportStudentCsv = (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentCsvData.csv_file) return;
        postStudentCsv(`/courses/${course.id}/students/import-csv`, {
            onSuccess: () => {
                resetStudentCsv();
                setIsImportStudentCsvOpen(false);
                triggerToast('CSV Roster Imported', 'Students imported into course roster.', 'success');
            },
        });
    };

    const filteredStudents = (course.students || []).filter(
        (s) =>
            s.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
            s.email.toLowerCase().includes(rosterSearch.toLowerCase())
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Courses', href: '/courses' },
                { title: course.code ? `[${course.code}] ${course.title}` : course.title, href: `/courses/${course.id}` },
            ]}
        >
            <Head title={`${course.code ? `[${course.code}] ` : ''}${course.title} - EMS SAAS`} />

            <div className="p-4 sm:p-6 space-y-6 w-full max-w-[1800px] mx-auto">
                {/* Toast Notification */}
                {toast && (
                    <div
                        className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-xl border flex items-center justify-between gap-4 max-w-md animate-in fade-in slide-in-from-bottom-5 text-xs font-bold ${
                            toast.type === 'danger'
                                ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                                : toast.type === 'info'
                                ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                                : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        }`}
                    >
                        <div>
                            <div className="font-extrabold">{toast.title}</div>
                            <div className="text-[11px] opacity-90 font-normal">{toast.message}</div>
                        </div>
                        <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            ✕
                        </button>
                    </div>
                )}

                {/* Course Header Banner */}
                <div className="p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-card-foreground">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            {course.code && (
                                <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-black text-xs uppercase">
                                    {course.code}
                                </span>
                            )}
                            <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold border border-border">
                                {course.modules.length} {course.modules.length === 1 ? 'Module' : 'Modules'}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" /> {(course.students || []).length} Enrolled Students
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                            {course.title}
                        </h1>
                        {course.description && (
                            <p className="text-sm text-muted-foreground max-w-3xl">
                                {course.description}
                            </p>
                        )}
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <Button
                            onClick={() => setIsCreateModuleOpen(true)}
                            className="font-bold text-xs gap-1.5 shadow-xs cursor-pointer"
                        >
                            <Plus className="w-4 h-4" /> Create New Module
                        </Button>
                        <Button
                            onClick={() => setIsAddStudentOpen(true)}
                            variant="outline"
                            className="text-xs font-bold gap-1.5 cursor-pointer"
                        >
                            <UserCheck className="w-4 h-4 text-primary" /> Enroll Student
                        </Button>
                        <Button
                            onClick={() => setIsImportStudentCsvOpen(true)}
                            variant="outline"
                            className="text-xs font-bold gap-1.5 cursor-pointer"
                        >
                            <Upload className="w-4 h-4 text-primary" /> Import CSV Roster
                        </Button>
                        <Button
                            onClick={() => setIsRosterOpen(true)}
                            variant="outline"
                            className="text-xs font-bold gap-1.5 cursor-pointer"
                        >
                            <Users className="w-4 h-4 text-primary" /> View Roster ({(course.students || []).length})
                        </Button>
                    </div>
                </div>

                {/* Modules Table Section */}
                <Card className="bg-card border-border text-card-foreground shadow-xs">
                    <CardHeader className="border-b border-border pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-primary" /> Course Modules Directory
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Each module contains its question bank and settings. Launch live rooms or manage questions below.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {course.modules.length === 0 ? (
                            <p className="p-12 text-center text-sm text-muted-foreground">
                                No modules added yet. Click "+ Create New Module" above to add your first module.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-border text-muted-foreground uppercase tracking-wider font-extrabold text-[10px]">
                                            <th className="p-3 w-12 text-center">MODULE NO.</th>
                                            <th className="p-3">MODULE CODE & CURRICULUM TITLE</th>
                                            <th className="p-3 text-right">MODULE MANAGEMENT ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {course.modules.map((m, idx) => (
                                            <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="p-3 text-center">
                                                    <span className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-black text-xs inline-flex items-center justify-center">
                                                        M{idx + 1}
                                                    </span>
                                                </td>

                                                <td className="p-3 space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        {m.code && (
                                                            <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 text-[10px] font-extrabold uppercase">
                                                                {m.code}
                                                            </span>
                                                        )}
                                                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{m.title}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            m.visibility === 'published'
                                                                ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                                                                : m.visibility === 'draft'
                                                                ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                                                        }`}>
                                                            {m.visibility}
                                                        </span>
                                                    </div>

                                                    {m.description && <div className="text-[11px] text-slate-600 dark:text-slate-400">{m.description}</div>}

                                                    {/* Settings Badges */}
                                                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                                                        {/* Question Count Badge */}
                                                        <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-extrabold text-[10px] inline-flex items-center gap-1">
                                                            <HelpCircle className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                                            {m.questions_count ?? 0} {m.questions_count === 1 ? 'Question' : 'Questions'}
                                                        </span>

                                                        {m.exam_duration_minutes ? (
                                                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-indigo-700 dark:text-indigo-300 flex items-center gap-1 font-mono font-bold">
                                                                <Clock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> {
                                                                    `${String(Math.floor(m.exam_duration_minutes / 60)).padStart(2, '0')}:${String(m.exam_duration_minutes % 60).padStart(2, '0')}:00`
                                                                }
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
                                                                Untimed
                                                            </span>
                                                        )}

                                                        {m.allow_retake && (
                                                            <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center gap-1 font-semibold">
                                                                <RotateCcw className="w-3 h-3" /> Retakes Allowed
                                                            </span>
                                                        )}

                                                        {m.allow_review && (
                                                            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center gap-1 font-semibold">
                                                                <Eye className="w-3 h-3" /> Review Enabled
                                                            </span>
                                                        )}

                                                        {m.hide_score && (
                                                            <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center gap-1 font-semibold">
                                                                <EyeOff className="w-3 h-3" /> Score Hidden
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="p-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Action 0: View Result & Launch / Monitor Live Room */}
                                                        {(() => {
                                                            const isPublished = m.visibility === 'published';
                                                            const qCount = m.questions_count ?? 0;
                                                            const rooms = m.assessments?.flatMap((a) => a.rooms || []) || [];
                                                            const activeRoom = rooms.find((r) => ['waiting', 'active', 'paused'].includes(r.status));
                                                            const latestRoom = rooms.length > 0 ? rooms.reduce((prev, curr) => (curr.id > prev.id ? curr : prev)) : null;

                                                            return (
                                                                <>
                                                                    {/* View Latest Result / Report Button if any room has been launched */}
                                                                    {latestRoom && (
                                                                        <Link href={`/reports/${latestRoom.id}`}>
                                                                            <Button
                                                                                variant="outline"
                                                                                className="bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-xs font-bold px-2.5 py-1 h-8 gap-1 cursor-pointer shadow-sm"
                                                                                title="View Latest Assessment Result / Report"
                                                                            >
                                                                                <BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> View Result
                                                                            </Button>
                                                                        </Link>
                                                                    )}

                                                                    {/* Launch or Monitor Button */}
                                                                    {isPublished && qCount > 0 && (
                                                                        activeRoom ? (
                                                                            <Link href={`/rooms/${activeRoom.id}/dashboard`}>
                                                                                <Button
                                                                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 h-8 gap-1 cursor-pointer shadow-sm"
                                                                                    title={`Monitor Live Room (${activeRoom.code})`}
                                                                                >
                                                                                    <Play className="w-3.5 h-3.5 fill-current text-emerald-300" /> Monitor ({activeRoom.code})
                                                                                </Button>
                                                                            </Link>
                                                                        ) : (
                                                                            <Button
                                                                                onClick={() => {
                                                                                    setSelectedLaunchModule(m);
                                                                                    setIsLaunchModalOpen(true);
                                                                                }}
                                                                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 h-8 gap-1 cursor-pointer shadow-sm"
                                                                                title="Launch Live Assessment Room"
                                                                            >
                                                                                <Play className="w-3.5 h-3.5 fill-current" /> Launch Live Room
                                                                            </Button>
                                                                        )
                                                                    )}
                                                                </>
                                                            );
                                                        })()}

                                                        {/* Action 1: Manage Questions */}
                                                        <Link href={`/courses/${course.id}/modules/${m.id}/questions`}>
                                                            <Button
                                                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-2.5 py-1 h-8 gap-1 cursor-pointer shadow-sm"
                                                                title="Manage Questions & Exam"
                                                            >
                                                                <HelpCircle className="w-3.5 h-3.5" /> Manage Questions ({m.questions_count ?? 0})
                                                            </Button>
                                                        </Link>

                                                        {/* Edit Module */}
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleOpenEditModule(m)}
                                                            className="bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold px-2.5 py-1 h-8 gap-1 cursor-pointer"
                                                            title="Edit Module"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5 text-slate-500" /> Edit
                                                        </Button>

                                                        {/* Delete Module */}
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleDeleteModule(m.id)}
                                                            className="bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-bold px-2 py-1 h-8 cursor-pointer"
                                                            title="Delete Module"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal: Create Module */}
            <Dialog open={isCreateModuleOpen} onOpenChange={setIsCreateModuleOpen}>
                <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Add New Course Module
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Create a curriculum module for this course. Questions can be added right after.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddModule} className="space-y-4 mt-2">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1 space-y-1">
                                <Label htmlFor="code" className="text-xs font-bold">Module Code</Label>
                                <Input
                                    id="code"
                                    placeholder="e.g. M1"
                                    value={moduleData.code}
                                    onChange={(e) => setModuleData('code', e.target.value)}
                                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs"
                                />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <Label htmlFor="title" className="text-xs font-bold">Module Title *</Label>
                                <Input
                                    id="title"
                                    required
                                    placeholder="e.g. Cybersecurity Fundamentals"
                                    value={moduleData.title}
                                    onChange={(e) => setModuleData('title', e.target.value)}
                                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="description" className="text-xs font-bold">Description / Learning Objectives</Label>
                            <Input
                                id="description"
                                placeholder="Brief overview of module topics..."
                                value={moduleData.description}
                                onChange={(e) => setModuleData('description', e.target.value)}
                                className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="duration" className="text-xs font-bold">Exam Duration (Minutes)</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    min={1}
                                    max={300}
                                    placeholder="e.g. 60"
                                    value={moduleData.exam_duration_minutes}
                                    onChange={(e) => setModuleData('exam_duration_minutes', e.target.value)}
                                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="visibility" className="text-xs font-bold">Visibility Status</Label>
                                <select
                                    id="visibility"
                                    value={moduleData.visibility}
                                    onChange={(e) => setModuleData('visibility', e.target.value as any)}
                                    className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100 font-bold"
                                >
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                    <option value="hidden">Hidden</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                            <Label className="font-bold text-slate-700 dark:text-slate-300">Exam Rules & Settings</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={moduleData.allow_retake}
                                        onChange={(e) => setModuleData('allow_retake', e.target.checked)}
                                        className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>Allow Exam Retakes</span>
                                </label>

                                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={moduleData.allow_review}
                                        onChange={(e) => setModuleData('allow_review', e.target.checked)}
                                        className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>Allow Question Review</span>
                                </label>

                                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={moduleData.hide_score}
                                        onChange={(e) => setModuleData('hide_score', e.target.checked)}
                                        className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>Hide Score from Student</span>
                                </label>
                            </div>
                        </div>

                        <Button type="submit" disabled={moduleProcessing} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md">
                            {moduleProcessing ? 'Saving Module...' : 'Create Module'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Enroll Single Student */}
            <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
                <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Enroll Student
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Add a student to the roster for {course.title}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEnrollStudent} className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="s_student_number" className="text-xs font-bold">Student Number / ID</Label>
                                <Input
                                    id="s_student_number"
                                    placeholder="e.g. STU-2026-001"
                                    value={enrollData.student_number}
                                    onChange={(e) => setEnrollData('student_number', e.target.value)}
                                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs uppercase"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="s_email" className="text-xs font-bold">Student Email Address *</Label>
                                <Input
                                    id="s_email"
                                    type="email"
                                    required
                                    placeholder="e.g. jane@university.edu"
                                    value={enrollData.email}
                                    onChange={(e) => setEnrollData('email', e.target.value)}
                                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs"
                                />
                                {enrollErrors.email && <p className="text-[10px] text-rose-500">{enrollErrors.email}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="s_first_name" className="text-xs font-bold">First Name *</Label>
                                <Input
                                    id="s_first_name"
                                    required
                                    placeholder="e.g. Jane"
                                    value={enrollData.first_name}
                                    onChange={(e) => setEnrollData('first_name', e.target.value)}
                                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="s_middle_name" className="text-xs font-bold">Middle Name</Label>
                                <Input
                                    id="s_middle_name"
                                    placeholder="e.g. Mary"
                                    value={enrollData.middle_name}
                                    onChange={(e) => setEnrollData('middle_name', e.target.value)}
                                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="s_surname" className="text-xs font-bold">Surname *</Label>
                                <Input
                                    id="s_surname"
                                    required
                                    placeholder="e.g. Doe"
                                    value={enrollData.surname}
                                    onChange={(e) => setEnrollData('surname', e.target.value)}
                                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="s_gender" className="text-xs font-bold">Gender</Label>
                                <select
                                    id="s_gender"
                                    value={enrollData.gender}
                                    onChange={(e) => setEnrollData('gender', e.target.value as any)}
                                    className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100 font-bold"
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="s_dob" className="text-xs font-bold">Date of Birth</Label>
                                <Input
                                    id="s_dob"
                                    type="date"
                                    value={enrollData.date_of_birth}
                                    onChange={(e) => setEnrollData('date_of_birth', e.target.value)}
                                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs"
                                />
                            </div>
                        </div>

                        <Button type="submit" disabled={enrollProcessing} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md">
                            {enrollProcessing ? 'Enrolling Student...' : 'Enroll Student'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Import Student Roster CSV */}
            <Dialog open={isImportStudentCsvOpen} onOpenChange={setIsImportStudentCsvOpen}>
                <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Import Student Roster CSV
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Upload a CSV file containing student roster columns.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase tracking-wider">Supported CSV Column Formats:</div>
                        <code className="font-mono text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded block overflow-x-auto text-indigo-600 dark:text-indigo-400">
                            student_number, first_name, middle_name, surname, gender, date_of_birth, email, password
                        </code>
                        <div className="text-[10px] italic opacity-80">
                            Legacy CSV formats (<code className="font-mono">name, email, student_id</code>) are also automatically supported.
                        </div>
                    </div>

                    <form onSubmit={handleImportStudentCsv} className="space-y-4 mt-2">
                        <div className="space-y-1">
                            <Label htmlFor="student_csv" className="text-xs font-bold">Select CSV File *</Label>
                            <Input
                                id="student_csv"
                                type="file"
                                accept=".csv,.txt"
                                required
                                onChange={(e) => setStudentCsvData('csv_file', e.target.files ? e.target.files[0] : null)}
                                className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs cursor-pointer"
                            />
                            {studentCsvErrors.csv_file && <p className="text-[10px] text-rose-500">{studentCsvErrors.csv_file}</p>}
                        </div>

                        <Button type="submit" disabled={studentCsvProcessing} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md">
                            {studentCsvProcessing ? 'Uploading Roster...' : 'Import & Enroll Students'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: View Roster */}
            <Dialog open={isRosterOpen} onOpenChange={setIsRosterOpen}>
                <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Course Enrolled Roster
                            </span>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                                {(course.students || []).length} Students
                            </span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Enrolled students eligible to take live exams in {course.title}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 mt-2">
                        <Input
                            placeholder="Search students by name or email..."
                            value={rosterSearch}
                            onChange={(e) => setRosterSearch(e.target.value)}
                            className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs"
                        />

                        {filteredStudents.length === 0 ? (
                            <p className="p-6 text-center text-xs text-slate-500">No students found matching search.</p>
                        ) : (
                            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                                {filteredStudents.map((s) => (
                                    <div key={s.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-slate-100">{s.name}</div>
                                            <div className="text-[11px] text-slate-500">{s.email}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {s.student_id && (
                                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-mono">
                                                    ID: {s.student_id}
                                                </span>
                                            )}
                                            <Link href={`/students/${s.id}`}>
                                                <Button variant="outline" className="h-7 text-[10px] px-2 font-bold cursor-pointer">
                                                    View Profile & Courses →
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal: Edit Module */}
            {editingModule && (
                <Dialog open={!!editingModule} onOpenChange={() => setEditingModule(null)}>
                    <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                <Pencil className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Edit Module: {editingModule.title}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Update module code, title, duration, and exam rules.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleUpdateModule} className="space-y-4 mt-2">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-1 space-y-1">
                                    <Label htmlFor="e_code" className="text-xs font-bold">Module Code</Label>
                                    <Input
                                        id="e_code"
                                        placeholder="e.g. M1"
                                        value={editModuleData.code}
                                        onChange={(e) => setEditModuleData('code', e.target.value)}
                                        className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs"
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label htmlFor="e_title" className="text-xs font-bold">Module Title *</Label>
                                    <Input
                                        id="e_title"
                                        required
                                        value={editModuleData.title}
                                        onChange={(e) => setEditModuleData('title', e.target.value)}
                                        className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="e_description" className="text-xs font-bold">Description / Learning Objectives</Label>
                                <Input
                                    id="e_description"
                                    value={editModuleData.description}
                                    onChange={(e) => setEditModuleData('description', e.target.value)}
                                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="e_duration" className="text-xs font-bold">Exam Duration (Minutes)</Label>
                                    <Input
                                        id="e_duration"
                                        type="number"
                                        min={1}
                                        max={300}
                                        value={editModuleData.exam_duration_minutes}
                                        onChange={(e) => setEditModuleData('exam_duration_minutes', e.target.value)}
                                        className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="e_visibility" className="text-xs font-bold">Visibility Status</Label>
                                    <select
                                        id="e_visibility"
                                        value={editModuleData.visibility}
                                        onChange={(e) => setEditModuleData('visibility', e.target.value as any)}
                                        className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100 font-bold"
                                    >
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                        <option value="hidden">Hidden</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                                <Label className="font-bold text-slate-700 dark:text-slate-300">Exam Rules & Settings</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editModuleData.allow_retake}
                                            onChange={(e) => setEditModuleData('allow_retake', e.target.checked)}
                                            className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>Allow Exam Retakes</span>
                                    </label>

                                    <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editModuleData.allow_review}
                                            onChange={(e) => setEditModuleData('allow_review', e.target.checked)}
                                            className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>Allow Question Review</span>
                                    </label>

                                    <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editModuleData.hide_score}
                                            onChange={(e) => setEditModuleData('hide_score', e.target.checked)}
                                            className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>Hide Score from Student</span>
                                    </label>
                                </div>
                            </div>

                            <Button type="submit" disabled={editModuleProcessing} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md">
                                {editModuleProcessing ? 'Saving...' : 'Update Module & Code'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            <LaunchModal
                module={selectedLaunchModule}
                isOpen={isLaunchModalOpen}
                onClose={() => setIsLaunchModalOpen(false)}
            />
        </AppLayout>
    );
}
