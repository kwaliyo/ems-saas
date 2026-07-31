import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Award,
    BookOpen,
    CheckCircle2,
    Clock,
    FileCheck2,
    FileText,
    GraduationCap,
    Layers,
    Mail,
    Pencil,
    Play,
    Plus,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface Assessment {
    id: number;
    title: string;
}

interface Module {
    id: number;
    title: string;
    code?: string;
    exam_duration_minutes?: number | null;
    assessments?: Assessment[];
}

interface Course {
    id: number;
    code: string;
    title: string;
    description?: string;
    modules?: Module[];
}

interface Room {
    id: number;
    code: string;
    mode: string;
    status: string;
    assessment_title?: string;
    assessment_subject?: string;
    assessment?: {
        title: string;
        subject: string;
    };
}

interface ParticipantRecord {
    id: number;
    name: string;
    score: number;
    completed_at?: string;
    created_at: string;
    room: Room;
    answers?: any[];
}

interface Student {
    id: number;
    student_number?: string | null;
    first_name?: string | null;
    middle_name?: string | null;
    surname?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
    name: string;
    email: string;
    created_at?: string;
    enrolled_courses?: Course[];
}

interface Props {
    student: Student;
    participantRecords: ParticipantRecord[];
    availableCourses: Course[];
}

export default function StudentShow({ student, participantRecords = [], availableCourses = [] }: Props) {
    const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);

    const { data: attachData, setData: setAttachData, post: postAttach, processing: attachProcessing } = useForm({
        course_ids: (student.enrolled_courses || []).map((c) => c.id),
    });

    const { delete: deleteDetach } = useForm();

    const courses = student.enrolled_courses || [];
    const totalAttempted = participantRecords.length;
    const completedExams = participantRecords.filter((p) => p.completed_at !== null);

    const totalScoreAchieved = participantRecords.reduce((acc, p) => acc + (p.score || 0), 0);
    const avgScore = totalAttempted > 0 ? (totalScoreAchieved / totalAttempted).toFixed(1) : '0';

    const fullName = student.first_name
        ? `${student.first_name} ${student.middle_name ? student.middle_name + ' ' : ''}${student.surname || ''}`
        : student.name;

    const handleAttachCourses = (e: React.FormEvent) => {
        e.preventDefault();
        postAttach(`/students/${student.id}/attach-courses`, {
            onSuccess: () => setIsAttachModalOpen(false),
        });
    };

    const handleDetachCourse = (courseId: number) => {
        if (confirm('Detach this course from student?')) {
            deleteDetach(`/students/${student.id}/detach-course/${courseId}`);
        }
    };

    const toggleCourseSelection = (courseId: number) => {
        if (attachData.course_ids.includes(courseId)) {
            setAttachData('course_ids', attachData.course_ids.filter((id) => id !== courseId));
        } else {
            setAttachData('course_ids', [...attachData.course_ids, courseId]);
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Students Directory', href: '/students' },
                { title: `Student: ${fullName}`, href: '#' },
            ]}
        >
            <Head title={`Student Profile - ${fullName}`} />

            <div className="p-4 sm:p-6 space-y-6 w-full max-w-[1800px] mx-auto">
                {/* Back Link & Action Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <Link
                        href="/students"
                        className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Students Directory
                    </Link>

                    <Button
                        onClick={() => setIsAttachModalOpen(true)}
                        className="text-xs font-bold gap-2 shadow-xs cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> Attach / Manage Courses
                    </Button>
                </div>

                {/* Profile Overview Card */}
                <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-6 text-card-foreground">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground font-black text-2xl flex items-center justify-center shadow-md uppercase">
                                {student.first_name ? student.first_name.charAt(0) : student.name.charAt(0)}
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {student.student_number && (
                                        <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-extrabold text-xs uppercase border border-primary/20">
                                            {student.student_number}
                                        </span>
                                    )}
                                    <span className="px-2.5 py-0.5 rounded bg-muted text-muted-foreground font-bold text-xs">
                                        Active Student
                                    </span>
                                </div>
                                <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                                    {fullName}
                                </h1>
                                <p className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-primary" /> {student.email}
                                </p>
                            </div>
                        </div>

                        {/* Quick Personal Bio Details */}
                        <div className="flex flex-wrap items-center gap-4 text-xs border-l border-border pl-4 py-1">
                            <div>
                                <div className="text-[10px] text-muted-foreground uppercase font-bold">First Name</div>
                                <div className="font-bold text-foreground">{student.first_name || 'N/A'}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-muted-foreground uppercase font-bold">Middle Name</div>
                                <div className="font-bold text-foreground">{student.middle_name || '—'}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-muted-foreground uppercase font-bold">Surname</div>
                                <div className="font-bold text-foreground">{student.surname || 'N/A'}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-muted-foreground uppercase font-bold">Gender</div>
                                <div className="font-bold text-foreground capitalize">{student.gender || 'N/A'}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-muted-foreground uppercase font-bold">Date of Birth</div>
                                <div className="font-bold text-foreground">{student.date_of_birth || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Performance Stat Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                        <Card className="bg-muted/50 p-4 border-border space-y-1">
                            <div className="text-xs text-muted-foreground font-medium">Enrolled Courses</div>
                            <div className="text-2xl font-black text-primary">{courses.length}</div>
                        </Card>

                        <Card className="bg-muted/50 p-4 border-border space-y-1">
                            <div className="text-xs text-muted-foreground font-medium">Exams Attempted</div>
                            <div className="text-2xl font-black text-foreground">{totalAttempted}</div>
                        </Card>

                        <Card className="bg-muted/50 p-4 border-border space-y-1">
                            <div className="text-xs text-muted-foreground font-medium">Completed Exams</div>
                            <div className="text-2xl font-black text-foreground">{completedExams.length}</div>
                        </Card>

                        <Card className="bg-muted/50 p-4 border-border space-y-1">
                            <div className="text-xs text-muted-foreground font-medium">Avg Score Achieved</div>
                            <div className="text-2xl font-black text-primary">{avgScore} Pts</div>
                        </Card>
                    </div>
                </div>

                {/* Section 1: Attached / Enrolled Courses */}
                <Card className="bg-card border-border text-card-foreground shadow-xs p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" /> Attached / Enrolled Courses ({courses.length})
                        </h3>
                        <Button
                            onClick={() => setIsAttachModalOpen(true)}
                            variant="outline"
                            size="sm"
                            className="text-xs font-bold cursor-pointer"
                        >
                            + Attach / Manage Courses
                        </Button>
                    </div>

                    {courses.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic p-4 text-center">
                            No courses attached to this student account yet. Click "+ Attach / Manage Courses" above to attach courses.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {courses.map((c) => (
                                <Card key={c.id} className="bg-muted/40 border-border p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary font-black text-xs uppercase border border-primary/20">
                                                {c.code}
                                            </span>
                                            <Link href={`/courses/${c.id}`} className="font-bold text-foreground hover:underline text-sm">
                                                {c.title}
                                            </Link>
                                        </div>

                                        <button
                                            onClick={() => handleDetachCourse(c.id)}
                                            className="text-muted-foreground hover:text-destructive text-xs font-bold flex items-center gap-1 cursor-pointer"
                                            title="Detach course from student"
                                        >
                                            <X className="w-3.5 h-3.5" /> Detach
                                        </button>
                                    </div>

                                    {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}

                                    {/* Course Exam Modules List */}
                                    <div className="space-y-2 pt-2 border-t border-border">
                                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Available Modules ({(c.modules || []).length})
                                        </div>
                                        {(c.modules || []).length === 0 ? (
                                            <span className="text-xs text-muted-foreground italic">No modules added yet</span>
                                        ) : (
                                            (c.modules || []).map((m) => (
                                                <div key={m.id} className="flex items-center justify-between p-2 rounded bg-background border border-border text-xs">
                                                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                                                        <Layers className="w-3.5 h-3.5 text-primary" /> {m.title}
                                                    </span>
                                                    {m.exam_duration_minutes ? (
                                                        <span className="text-[10px] text-muted-foreground font-mono">
                                                            {m.exam_duration_minutes} mins
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground opacity-80">Untimed</span>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Section 2: Exam Participation & Scorecard History */}
                <Card className="bg-card border-border text-card-foreground shadow-xs p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                            <Award className="w-5 h-5 text-primary" /> Exam Participation & Scorecard History ({totalAttempted})
                        </h3>
                    </div>

                    {totalAttempted === 0 ? (
                        <p className="text-xs text-muted-foreground italic p-6 text-center">
                            No live exam room participation history recorded for this student yet.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-border text-muted-foreground uppercase tracking-wider font-extrabold text-[10px]">
                                        <th className="p-3 w-12 text-center">NO.</th>
                                        <th className="p-3">ASSESSMENT & SUBJECT TITLE</th>
                                        <th className="p-3">EXAM ROOM CODE</th>
                                        <th className="p-3">COMPLETION STATUS</th>
                                        <th className="p-3">SCORE ACHIEVED</th>
                                        <th className="p-3 text-right">EXAM REPORT</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {participantRecords.map((p, idx) => (
                                        <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="p-3 text-center font-bold text-muted-foreground text-xs">{idx + 1}</td>
                                            <td className="p-3 space-y-0.5">
                                                <div className="font-bold text-foreground text-sm">
                                                    {p.room?.assessment_title || p.room?.assessment?.title || 'Assessment Exam'}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground">{p.room?.assessment_subject || 'General'}</div>
                                            </td>
                                            <td className="p-3">
                                                <span className="px-2 py-0.5 rounded bg-muted border border-border text-foreground font-mono font-bold text-xs uppercase">
                                                    {p.room?.code}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                {p.completed_at ? (
                                                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-bold inline-flex items-center gap-1 border border-primary/20">
                                                        <CheckCircle2 className="w-3 h-3" /> Completed ({p.completed_at})
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[11px] font-bold inline-flex items-center gap-1 border border-border">
                                                        <Clock className="w-3 h-3" /> In Progress
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 font-extrabold text-foreground text-sm">
                                                {p.score} Pts
                                            </td>
                                            <td className="p-3 text-right">
                                                {p.room && (
                                                    <Link href={`/reports/${p.room.id}/participant/${p.id}`}>
                                                        <Button variant="outline" size="sm" className="text-xs font-bold h-8 px-2.5 cursor-pointer">
                                                            View Scorecard →
                                                        </Button>
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* Modal: Attach / Manage Courses */}
                <Dialog open={isAttachModalOpen} onOpenChange={setIsAttachModalOpen}>
                    <DialogContent className="max-w-md bg-card border-border text-foreground">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-primary" /> Attach Courses to {fullName}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Check or uncheck courses to attach or detach them from this student account.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleAttachCourses} className="space-y-4 mt-2">
                            <div className="space-y-2 max-h-60 overflow-y-auto p-3 rounded-xl bg-muted border border-border">
                                {availableCourses.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic p-2">No courses created yet.</p>
                                ) : (
                                    availableCourses.map((c) => (
                                        <label key={c.id} className="flex items-center gap-2 cursor-pointer text-xs font-semibold p-1 hover:bg-background/80 rounded">
                                            <input
                                                type="checkbox"
                                                checked={attachData.course_ids.includes(c.id)}
                                                onChange={() => toggleCourseSelection(c.id)}
                                                className="rounded border-input text-primary focus:ring-ring"
                                            />
                                            <span>{c.code} - {c.title}</span>
                                        </label>
                                    ))
                                )}
                            </div>

                            <Button type="submit" disabled={attachProcessing} className="w-full font-bold text-xs cursor-pointer shadow-xs">
                                {attachProcessing ? 'Saving Courses...' : 'Update Attached Courses'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
