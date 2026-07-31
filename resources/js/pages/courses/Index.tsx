import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    BookOpen,
    FileCheck2,
    GraduationCap,
    Layers,
    Plus,
    Play,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';

interface Assessment {
    id: number;
    title: string;
    rooms?: { id: number; code: string; status: string }[];
}

interface Module {
    id: number;
    title: string;
    description?: string;
    order: number;
    assessments?: Assessment[];
}

interface Course {
    id: number;
    title: string;
    code: string;
    description?: string;
    modules_count?: number;
    students_count?: number;
    modules?: Module[];
}

interface Props {
    taughtCourses: Course[];
    enrolledCourses: Course[];
}

export default function CourseIndex({ taughtCourses, enrolledCourses }: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data, setData, post, processing, reset } = useForm({
        title: '',
        code: '',
        description: '',
        modules: [
            { title: 'Module 1: Foundations & Fundamentals', description: 'Core introductory concepts' },
            { title: 'Module 2: Advanced Practice & Evaluation', description: 'Deep dive topics and assessments' },
        ],
    });

    const handleCreateCourse = (e: React.FormEvent) => {
        e.preventDefault();
        post('/courses', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Courses & Modules', href: '/courses' }]}>
            <Head title="Courses & Exam Modules" />

            <div className="p-4 sm:p-6 space-y-8 w-full max-w-[1800px] mx-auto">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-5">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                            <GraduationCap className="w-8 h-8 text-primary" /> Courses & Exam Modules
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Organize assessments into course modules for enrolled students.
                        </p>
                    </div>

                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="font-bold shadow-xs gap-2 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> Create Course
                    </Button>
                </div>

                {/* Create Course Form Card */}
                {isCreateModalOpen && (
                    <Card className="bg-card border-border p-6 space-y-4 max-w-xl mx-auto shadow-md text-card-foreground">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Plus className="w-5 h-5 text-primary" /> Create New Course
                            </h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-muted-foreground hover:text-foreground text-xs font-bold">
                                ✕ Cancel
                            </button>
                        </div>

                        <form onSubmit={handleCreateCourse} className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-1 space-y-1">
                                    <Label className="text-xs font-bold">Course Code *</Label>
                                    <Input
                                        required
                                        placeholder="e.g. BCC 14/26"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        className="bg-background border-input text-xs font-mono uppercase"
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs font-bold">Course Title *</Label>
                                    <Input
                                        required
                                        placeholder="e.g. Basic Cybersecurity Course"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        className="bg-background border-input text-xs"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Course Description</Label>
                                <Input
                                    placeholder="Brief course overview..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="bg-background border-input text-xs"
                                />
                            </div>

                            <Button type="submit" disabled={processing} className="w-full font-bold text-xs cursor-pointer shadow-xs">
                                {processing ? 'Creating Course...' : 'Create Course & Initial Modules'}
                            </Button>
                        </form>
                    </Card>
                )}

                {/* Section: Courses Taught by Instructor */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                        <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" /> My Created Courses ({taughtCourses.length})
                        </h2>
                    </div>

                    {taughtCourses.length === 0 ? (
                        <Card className="bg-card border-border text-center py-12 p-4 space-y-3 shadow-xs">
                            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto" />
                            <h3 className="text-base font-bold text-foreground">No Courses Created Yet</h3>
                            <p className="text-xs text-muted-foreground">
                                Click "Create Course" above to organize your modules and assessments.
                            </p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {taughtCourses.map((c) => (
                                <Card key={c.id} className="bg-card border-border p-5 space-y-4 shadow-xs flex flex-col justify-between text-card-foreground">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-black text-xs uppercase">
                                                {c.code}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5 text-primary" /> {c.students_count || 0} Students
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-foreground leading-snug">
                                                {c.title}
                                            </h3>
                                            {c.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {c.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Modules List Preview */}
                                        <div className="space-y-1.5 pt-2 border-t border-border">
                                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                                <span>Course Modules</span>
                                                <span>{(c.modules || []).length} Total</span>
                                            </div>
                                            <div className="space-y-1">
                                                {(c.modules || []).slice(0, 3).map((m) => (
                                                    <div key={m.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50 border border-border">
                                                        <span className="font-semibold text-foreground flex items-center gap-1.5 truncate max-w-[200px]">
                                                            <Layers className="w-3 h-3 text-primary shrink-0" /> {m.title}
                                                        </span>
                                                    </div>
                                                ))}
                                                {(c.modules || []).length > 3 && (
                                                    <p className="text-[10px] text-muted-foreground italic text-center pt-1">
                                                        +{(c.modules || []).length - 3} more modules...
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-border">
                                        <Link href={`/courses/${c.id}`}>
                                            <Button className="w-full text-xs font-bold justify-between cursor-pointer shadow-xs">
                                                <span>Manage Modules & Questions</span>
                                                <span>→</span>
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Section: Courses Enrolled As Student */}
                {enrolledCourses.length > 0 && (
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                            <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-primary" /> Enrolled Student Courses ({enrolledCourses.length})
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {enrolledCourses.map((c) => (
                                <Card key={c.id} className="bg-card border-border p-5 space-y-4 shadow-xs text-card-foreground">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-black text-xs uppercase">
                                            {c.code}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-semibold">Enrolled Student</span>
                                    </div>

                                    <div>
                                        <h3 className="text-base font-bold text-foreground">{c.title}</h3>
                                        <p className="text-xs text-muted-foreground">{c.description}</p>
                                    </div>

                                    <Link href={`/courses/${c.id}`}>
                                        <Button variant="outline" className="w-full text-xs font-bold cursor-pointer">
                                            View Course Modules →
                                        </Button>
                                    </Link>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
