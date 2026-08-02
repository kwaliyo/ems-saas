import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Calendar, Copy, Download, Globe, GraduationCap, Key, KeyRound, Mail, Pencil, Plus, Sparkles, Trash2, Upload, UserCheck, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Course {
    id: number;
    code: string;
    title: string;
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
    enrolled_courses?: Course[];
}

interface Props {
    students: Student[];
    availableCourses: Course[];
}

export default function StudentIndex({ students, availableCourses }: Props) {
    const { flash } = usePage<any>().props;
    const [toast, setToast] = useState<{ title: string; message: string; type?: 'success' | 'danger' | 'info' } | null>(null);

    const triggerToast = (title: string, message: string, type: 'success' | 'danger' | 'info' = 'success') => {
        setToast({ title, message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        if (flash?.success) {
            triggerToast('Success', flash.success, 'success');
        } else if (flash?.error) {
            triggerToast('Error', flash.error, 'danger');
        }
    }, [flash]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
    const [isExternalModalOpen, setIsExternalModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [attachStudent, setAttachStudent] = useState<Student | null>(null);

    const [selectedCourseTab, setSelectedCourseTab] = useState<string | number>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

    const isGuestStudent = (s: Student) =>
        Boolean(
            (s.student_number && (s.student_number.startsWith('EXT-') || s.student_number.startsWith('GST-'))) ||
            (s.email && s.email.endsWith('@guest.exam'))
        );

    const filteredStudents = students.filter((s) => {
        if (selectedCourseTab === 'unassigned') {
            if (isGuestStudent(s)) return false;
            if (s.enrolled_courses && s.enrolled_courses.length > 0) return false;
        } else if (selectedCourseTab === 'external') {
            if (!isGuestStudent(s)) return false;
        } else if (typeof selectedCourseTab === 'number') {
            if (isGuestStudent(s)) return false;
            const isEnrolledInCourse = (s.enrolled_courses || []).some((c) => c.id === selectedCourseTab);
            if (!isEnrolledInCourse) return false;
        }

        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            const fullName = (
                s.first_name
                    ? `${s.first_name} ${s.middle_name ? s.middle_name + ' ' : ''}${s.surname || ''}`
                    : s.name
            ).toLowerCase();
            const studentNo = (s.student_number || '').toLowerCase();
            const email = (s.email || '').toLowerCase();

            return fullName.includes(q) || studentNo.includes(q) || email.includes(q);
        }

        return true;
    });

    const activeCourse =
        typeof selectedCourseTab === 'number' ? availableCourses.find((c) => c.id === selectedCourseTab) : null;

    const { data: externalData, setData: setExternalData, post: postExternal, processing: externalProcessing, reset: resetExternal, errors: externalErrors } = useForm({
        quantity: 10,
        prefix: 'EXT',
        label: 'Guest Candidate',
        course_id: '' as string | number,
    });

    const { data: csvData, setData: setCsvData, post: postCsv, processing: csvProcessing, reset: resetCsv, errors: csvErrors } = useForm({
        csv_file: null as File | null,
        course_ids: [] as number[],
    });

    const { data: createData, setData: setCreateData, post: postStudent, processing: createProcessing, reset: resetCreate, errors: createErrors } = useForm({
        student_number: '',
        first_name: '',
        middle_name: '',
        surname: '',
        gender: 'male',
        date_of_birth: '',
        email: '',
        password: 'password123',
        course_ids: [] as number[],
    });

    const { data: editData, setData: setEditData, put: putStudent, processing: editProcessing, reset: resetEdit, errors: editErrors } = useForm({
        student_number: '',
        first_name: '',
        middle_name: '',
        surname: '',
        gender: 'male',
        date_of_birth: '',
        email: '',
        password: '',
        course_ids: [] as number[],
    });

    const { data: attachData, setData: setAttachData, post: postAttach, processing: attachProcessing, reset: resetAttach } = useForm({
        course_ids: [] as number[],
    });

    const { delete: deleteDetach } = useForm();
    const { delete: deleteStudent } = useForm();
    const { post: postGenerateIds, processing: generatingIds } = useForm();

    const handleGenerateExternalIds = (e: React.FormEvent) => {
        e.preventDefault();
        postExternal('/students/generate-external-ids', {
            onSuccess: () => {
                resetExternal();
                setIsExternalModalOpen(false);
                setSelectedCourseTab('external');
                triggerToast('Guest IDs Generated', `Generated ${externalData.quantity} guest candidate IDs.`, 'success');
            },
        });
    };

    const handleCopyGuestIds = () => {
        const guestIds = students
            .filter(isGuestStudent)
            .map((s) => s.student_number)
            .filter(Boolean)
            .join('\n');

        if (!guestIds) {
            alert('No External / Guest Student IDs found.');
            return;
        }

        navigator.clipboard.writeText(guestIds);
        triggerToast('Copied Guest IDs', `Copied ${guestIds.split('\n').length} guest student ID(s) to clipboard.`, 'info');
    };

    const handleExportGuestCsv = () => {
        const guestList = students.filter(isGuestStudent);
        if (guestList.length === 0) {
            alert('No External / Guest Student IDs to export.');
            return;
        }

        const headers = ['Student Number', 'Candidate Name', 'Default Email', 'Passcode', 'Direct Join Link'];
        const rows = guestList.map((s) => {
            const num = s.student_number || '';
            const joinUrl = `${window.location.origin}/join?student_id=${num}`;
            return [`"${num}"`, `"${s.name}"`, `"${s.email}"`, '"guest123"', `"${joinUrl}"`].join(',');
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'guest_exam_access_credentials.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        triggerToast('Exported Credentials CSV', 'Downloaded guest candidate passcodes CSV file.', 'success');
    };

    const handleGenerateIds = () => {
        postGenerateIds('/students/generate-ids', {
            onSuccess: () => {
                triggerToast('Student Numbers Generated', 'Assigned student numbers to accounts without ID.', 'success');
            },
        });
    };

    const handleCreateStudent = (e: React.FormEvent) => {
        e.preventDefault();
        postStudent('/students', {
            onSuccess: () => {
                resetCreate();
                setIsCreateModalOpen(false);
                triggerToast('Student Created', 'New student account created successfully.', 'success');
            },
        });
    };

    const handleImportCsv = (e: React.FormEvent) => {
        e.preventDefault();
        postCsv('/students/import-csv', {
            onSuccess: () => {
                resetCsv();
                setIsCsvModalOpen(false);
                triggerToast('CSV Roster Imported', 'Student roster uploaded successfully.', 'success');
            },
        });
    };

    const handleOpenEdit = (student: Student) => {
        setEditingStudent(student);
        setEditData({
            student_number: student.student_number || '',
            first_name: student.first_name || student.name.split(' ')[0] || '',
            middle_name: student.middle_name || '',
            surname: student.surname || student.name.split(' ').slice(1).join(' ') || '',
            gender: student.gender || 'male',
            date_of_birth: student.date_of_birth || '',
            email: student.email,
            password: '',
            course_ids: (student.enrolled_courses || []).map((c) => c.id),
        });
    };

    const handleUpdateStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudent) return;
        const studentName = editingStudent.name;
        putStudent(`/students/${editingStudent.id}`, {
            onSuccess: () => {
                setEditingStudent(null);
                triggerToast('Student Profile Updated', `Successfully updated profile record for ${studentName}.`, 'success');
            },
        });
    };

    const handleOpenAttach = (student: Student) => {
        setAttachStudent(student);
        setAttachData({
            course_ids: (student.enrolled_courses || []).map((c) => c.id),
        });
    };

    const handleAttachCourses = (e: React.FormEvent) => {
        e.preventDefault();
        if (!attachStudent) return;
        postAttach(`/students/${attachStudent.id}/attach-courses`, {
            onSuccess: () => {
                setAttachStudent(null);
                triggerToast('Course Enrollment Updated', 'Student course attachments updated.', 'success');
            },
        });
    };

    const handleDetachCourse = (studentId: number, courseId: number) => {
        if (confirm('Detach this course from student?')) {
            deleteDetach(`/students/${studentId}/detach-course/${courseId}`, {
                onSuccess: () => {
                    triggerToast('Course Detached', 'Course enrollment removed.', 'info');
                },
            });
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedStudentIds(filteredStudents.map((s) => s.id));
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleSelectStudent = (studentId: number, checked: boolean) => {
        if (checked) {
            setSelectedStudentIds((prev) => [...prev, studentId]);
        } else {
            setSelectedStudentIds((prev) => prev.filter((id) => id !== studentId));
        }
    };

    const handleDeleteStudent = (student: Student) => {
        if (confirm(`Are you sure you want to delete student "${student.name}" (${student.email})?\n\nThis will detach all enrolled courses and permanently remove the student record.`)) {
            deleteStudent(`/students/${student.id}`, {
                onSuccess: () => {
                    setSelectedStudentIds((prev) => prev.filter((id) => id !== student.id));
                    triggerToast('Student Deleted', `Permanently deleted record for ${student.name}.`, 'danger');
                },
            });
        }
    };

    const handleBulkDeleteStudents = () => {
        if (selectedStudentIds.length === 0) return;
        if (confirm(`Are you sure you want to delete ${selectedStudentIds.length} selected student record(s)?\n\nThis action cannot be undone.`)) {
            router.post(
                '/students/bulk-destroy',
                { student_ids: selectedStudentIds },
                {
                    onSuccess: () => {
                        const count = selectedStudentIds.length;
                        setSelectedStudentIds([]);
                        triggerToast('Students Deleted', `Successfully deleted ${count} student record(s).`, 'danger');
                    },
                }
            );
        }
    };

    const isAllSelected = filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudentIds.includes(s.id));

    const toggleCourseSelection = (courseId: number, currentIds: number[], setFn: (val: number[]) => void) => {
        if (currentIds.includes(courseId)) {
            setFn(currentIds.filter((id) => id !== courseId));
        } else {
            setFn([...currentIds, courseId]);
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Students Directory', href: '/students' }]}>
            <Head title="Students Directory" />

            <div className="p-4 sm:p-6 space-y-6 w-full max-w-[1800px] mx-auto">
                {/* Toast Notification */}
                {toast && (
                    <div
                        className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center justify-between gap-4 max-w-md animate-in fade-in slide-in-from-bottom-5 text-xs font-bold ${
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
                        <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                            ✕
                        </button>
                    </div>
                )}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2">
                            <Users className="w-8 h-8 text-primary" /> Students Directory
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Manage student profile records (Student Number, Name, Gender, DOB) and attach/detach courses.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            onClick={() => setIsExternalModalOpen(true)}
                            variant="outline"
                            className="font-bold gap-2 cursor-pointer shadow-xs border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                        >
                            <Globe className="w-4 h-4 text-amber-500" /> Guest / External IDs
                        </Button>

                        <Button
                            onClick={handleGenerateIds}
                            disabled={generatingIds}
                            variant="outline"
                            className="font-bold gap-2 cursor-pointer shadow-xs"
                        >
                            <Sparkles className="w-4 h-4 text-primary" /> Generate Student IDs
                        </Button>

                        <Button
                            onClick={() => setIsCsvModalOpen(true)}
                            variant="outline"
                            className="font-bold gap-2 cursor-pointer shadow-xs"
                        >
                            <Upload className="w-4 h-4 text-primary" /> Import CSV Roster
                        </Button>

                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="font-bold gap-2 cursor-pointer shadow-xs"
                        >
                            <Plus className="w-4 h-4" /> Add / Register Student
                        </Button>
                    </div>
                </div>

                {students.length === 0 ? (
                    <Card className="bg-card text-card-foreground border-border text-center py-12 p-4 space-y-4 shadow-xs">
                        <Users className="w-16 h-16 text-muted-foreground mx-auto" />
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-foreground">No Students Registered Yet</h3>
                            <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                Register your first student account with student number, personal bio, and attach courses.
                            </p>
                        </div>
                        <Button onClick={() => setIsCreateModalOpen(true)} className="font-bold cursor-pointer shadow-xs">
                            Register Student Account
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {/* Course Filter Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border no-scrollbar">
                            <button
                                type="button"
                                onClick={() => setSelectedCourseTab('all')}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                    selectedCourseTab === 'all'
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                            >
                                <Users className="w-4 h-4" />
                                <span>All Courses</span>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                        selectedCourseTab === 'all'
                                            ? 'bg-primary-foreground/20 text-primary-foreground'
                                            : 'bg-background text-foreground'
                                    }`}
                                >
                                    {students.length}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedCourseTab('external')}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                    selectedCourseTab === 'external'
                                        ? 'bg-amber-500 text-amber-950 shadow-xs'
                                        : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                            >
                                <Globe className="w-4 h-4 text-amber-500" />
                                <span>External & Guests</span>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                        selectedCourseTab === 'external'
                                            ? 'bg-amber-950/20 text-amber-950'
                                            : 'bg-background text-foreground'
                                    }`}
                                >
                                    {students.filter(isGuestStudent).length}
                                </span>
                            </button>

                            {availableCourses.map((course) => {
                                const count = students.filter((s) =>
                                    !isGuestStudent(s) && (s.enrolled_courses || []).some((c) => c.id === course.id)
                                ).length;
                                const isSelected = selectedCourseTab === course.id;

                                return (
                                    <button
                                        key={course.id}
                                        type="button"
                                        onClick={() => setSelectedCourseTab(course.id)}
                                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                            isSelected
                                                ? 'bg-primary text-primary-foreground shadow-xs'
                                                : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                                        }`}
                                    >
                                        <GraduationCap className="w-4 h-4" />
                                        <span>[{course.code}] {course.title}</span>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                                isSelected
                                                    ? 'bg-primary-foreground/20 text-primary-foreground'
                                                    : 'bg-background text-foreground'
                                            }`}
                                        >
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}

                            {students.some((s) => !s.enrolled_courses || s.enrolled_courses.length === 0) && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedCourseTab('unassigned')}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                        selectedCourseTab === 'unassigned'
                                            ? 'bg-primary text-primary-foreground shadow-xs'
                                            : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                                >
                                    <UserCheck className="w-4 h-4" />
                                    <span>Unassigned Students</span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                            selectedCourseTab === 'unassigned'
                                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                                : 'bg-background text-foreground'
                                        }`}
                                    >
                                        {students.filter((s) => !s.enrolled_courses || s.enrolled_courses.length === 0).length}
                                    </span>
                                </button>
                            )}
                        </div>

                        <Card className="bg-card text-card-foreground border-border p-5 space-y-4 shadow-xs">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    {activeCourse ? (
                                        <span>
                                            Roster for{' '}
                                            <span className="text-primary font-extrabold">
                                                [{activeCourse.code}] {activeCourse.title}
                                            </span>
                                        </span>
                                    ) : selectedCourseTab === 'external' ? (
                                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                            <Globe className="w-4 h-4 text-amber-500" /> External Candidate Access Roster
                                        </span>
                                    ) : selectedCourseTab === 'unassigned' ? (
                                        <span>Unassigned Students Directory</span>
                                    ) : (
                                        <span>All Enrolled Students List</span>
                                    )}
                                    <span className="text-xs text-muted-foreground font-semibold">
                                        ({filteredStudents.length})
                                    </span>
                                </h3>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    {selectedStudentIds.length > 0 && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleBulkDeleteStudents}
                                            className="text-xs font-bold h-8 gap-1.5 cursor-pointer shadow-xs"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedStudentIds.length})
                                        </Button>
                                    )}

                                    <div className="w-full sm:w-72">
                                        <Input
                                            type="text"
                                            placeholder="Search student by name, ID, or email..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="text-xs h-8 bg-background"
                                        />
                                    </div>
                                </div>
                            </div>

                            {selectedCourseTab === 'external' && (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs">
                                    <div className="flex items-center gap-2 font-bold">
                                        <Globe className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span>External Guest Candidates ({filteredStudents.length})</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCopyGuestIds}
                                            className="text-xs font-bold gap-1.5 h-7 cursor-pointer border-amber-500/30 bg-background text-amber-700 dark:text-amber-300"
                                        >
                                            <Copy className="w-3.5 h-3.5" /> Copy All Guest IDs
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleExportGuestCsv}
                                            className="text-xs font-bold gap-1.5 h-7 cursor-pointer border-amber-500/30 bg-background text-amber-700 dark:text-amber-300"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Export Passcodes CSV
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {filteredStudents.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground space-y-1">
                                    <Users className="w-8 h-8 mx-auto opacity-50" />
                                    <p className="text-xs font-semibold">
                                        No students found matching the selected course tab or search criteria.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-border text-muted-foreground uppercase tracking-wider font-extrabold text-[10px]">
                                                <th className="p-3 w-10 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isAllSelected}
                                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                                        className="rounded border-input text-primary focus:ring-ring cursor-pointer"
                                                        title="Select All Students"
                                                    />
                                                </th>
                                                <th className="p-3 w-12 text-center">NO.</th>
                                                <th className="p-3">STUDENT NO. & FULL NAME</th>
                                                <th className="p-3">GENDER & DOB</th>
                                                <th className="p-3">OFFICIAL EMAIL</th>
                                                <th className="p-3">ATTACHED COURSES</th>
                                                <th className="p-3 text-right">ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredStudents.map((s, idx) => {
                                                const fullName = s.first_name
                                                    ? `${s.first_name} ${s.middle_name ? s.middle_name + ' ' : ''}${s.surname || ''}`
                                                    : s.name;
                                                const isGuest = isGuestStudent(s);

                                                return (
                                                    <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                                                        <td className="p-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedStudentIds.includes(s.id)}
                                                                onChange={(e) => handleSelectStudent(s.id, e.target.checked)}
                                                                className="rounded border-input text-primary focus:ring-ring cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="p-3 text-center font-bold text-muted-foreground text-xs">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="p-3 space-y-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                {s.student_number && (
                                                                    <span
                                                                        className={`px-2 py-0.5 rounded font-mono font-extrabold text-[10px] border ${
                                                                            isGuest
                                                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                                                                : 'bg-muted text-muted-foreground border-border'
                                                                        }`}
                                                                    >
                                                                        {s.student_number}
                                                                    </span>
                                                                )}
                                                                {isGuest && (
                                                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black text-[9px] uppercase tracking-wider">
                                                                        GUEST / EXT
                                                                    </span>
                                                                )}
                                                                <Link
                                                                    href={`/students/${s.id}`}
                                                                    className="font-bold text-primary hover:underline text-sm flex items-center gap-1.5"
                                                                >
                                                                    <span>{fullName}</span>
                                                                </Link>
                                                            </div>
                                                        </td>

                                                        <td className="p-3 space-y-0.5 text-[11px] text-muted-foreground">
                                                            {s.gender && <span className="capitalize font-semibold">{s.gender}</span>}
                                                            {s.gender && s.date_of_birth && <span> • </span>}
                                                            {s.date_of_birth && <span>DOB: {s.date_of_birth}</span>}
                                                            {!s.gender && !s.date_of_birth && <span className="italic opacity-70">Unspecified</span>}
                                                        </td>

                                                        <td className="p-3 text-foreground font-mono text-xs">{s.email}</td>

                                                        <td className="p-3">
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                {(s.enrolled_courses || []).length === 0 ? (
                                                                    <button
                                                                        onClick={() => handleOpenAttach(s)}
                                                                        className="text-xs text-primary font-bold hover:underline cursor-pointer"
                                                                    >
                                                                        + Attach Course
                                                                    </button>
                                                                ) : (
                                                                    (s.enrolled_courses || []).map((c) => (
                                                                        <div
                                                                            key={c.id}
                                                                            className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase inline-flex items-center gap-1"
                                                                        >
                                                                            <span>{c.code}</span>
                                                                            <button
                                                                                onClick={() => handleDetachCourse(s.id, c.id)}
                                                                                className="hover:text-destructive cursor-pointer ml-1"
                                                                                title="Detach course"
                                                                            >
                                                                                <X className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="p-3 text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleOpenAttach(s)}
                                                                    className="text-xs font-bold h-7 cursor-pointer"
                                                                    title="Attach / Detach Courses"
                                                                >
                                                                    + Attach Courses
                                                                </Button>

                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleOpenEdit(s)}
                                                                    className="text-xs font-bold h-7 cursor-pointer px-2"
                                                                    title="Edit Profile"
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </Button>

                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteStudent(s)}
                                                                    className="text-xs font-bold h-7 cursor-pointer px-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/60"
                                                                    title="Delete Student"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>

                                                                <Link href={`/students/${s.id}`}>
                                                                    <Button size="sm" className="text-xs font-bold h-7 cursor-pointer shadow-xs">
                                                                        Profile →
                                                                    </Button>
                                                                </Link>
                                                            </div>
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
                )}

                {/* Modal: Create Student */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent className="max-w-xl bg-card border-border text-foreground">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                <Plus className="w-5 h-5 text-primary" /> Register New Student Account
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Enter student details (Student Number, Names, Gender, DOB, Password) and assign courses.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateStudent} className="space-y-4 mt-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="student_number" className="text-xs font-bold">Student Number / ID</Label>
                                    <Input
                                        id="student_number"
                                        placeholder="e.g. STU-2026-001"
                                        value={createData.student_number}
                                        onChange={(e) => setCreateData('student_number', e.target.value)}
                                        className="bg-background border-input text-xs uppercase"
                                    />
                                    {createErrors.student_number && <p className="text-[10px] text-destructive">{createErrors.student_number}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="email" className="text-xs font-bold">Email Address *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        placeholder="e.g. student@university.edu"
                                        value={createData.email}
                                        onChange={(e) => setCreateData('email', e.target.value)}
                                        className="bg-background border-input text-xs"
                                    />
                                    {createErrors.email && <p className="text-[10px] text-destructive">{createErrors.email}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="first_name" className="text-xs font-bold">First Name *</Label>
                                    <Input
                                        id="first_name"
                                        required
                                        placeholder="e.g. Jane"
                                        value={createData.first_name}
                                        onChange={(e) => setCreateData('first_name', e.target.value)}
                                        className="bg-background border-input text-xs"
                                    />
                                    {createErrors.first_name && <p className="text-[10px] text-destructive">{createErrors.first_name}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="middle_name" className="text-xs font-bold">Middle Name</Label>
                                    <Input
                                        id="middle_name"
                                        placeholder="e.g. Mary"
                                        value={createData.middle_name}
                                        onChange={(e) => setCreateData('middle_name', e.target.value)}
                                        className="bg-background border-input text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="surname" className="text-xs font-bold">Surname / Last Name *</Label>
                                    <Input
                                        id="surname"
                                        required
                                        placeholder="e.g. Doe"
                                        value={createData.surname}
                                        onChange={(e) => setCreateData('surname', e.target.value)}
                                        className="bg-background border-input text-xs"
                                    />
                                    {createErrors.surname && <p className="text-[10px] text-destructive">{createErrors.surname}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="gender" className="text-xs font-bold">Gender</Label>
                                    <select
                                        id="gender"
                                        value={createData.gender}
                                        onChange={(e) => setCreateData('gender', e.target.value as any)}
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground font-bold"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="date_of_birth" className="text-xs font-bold">Date of Birth</Label>
                                    <Input
                                        id="date_of_birth"
                                        type="date"
                                        value={createData.date_of_birth}
                                        onChange={(e) => setCreateData('date_of_birth', e.target.value)}
                                        className="bg-background border-input text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="password" className="text-xs font-bold">Login Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Default: password123"
                                        value={createData.password}
                                        onChange={(e) => setCreateData('password', e.target.value)}
                                        className="bg-background border-input text-xs"
                                    />
                                </div>
                            </div>

                            {/* Attach Courses Checkboxes */}
                            <div className="space-y-2 pt-2 border-t border-border text-xs">
                                <Label className="font-bold text-primary uppercase tracking-wider text-[11px]">
                                    Attach / Enroll Courses
                                </Label>
                                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 rounded bg-muted border border-border">
                                    {availableCourses.map((c) => (
                                        <label key={c.id} className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                                            <input
                                                type="checkbox"
                                                checked={createData.course_ids.includes(c.id)}
                                                onChange={() => toggleCourseSelection(c.id, createData.course_ids, (ids) => setCreateData('course_ids', ids))}
                                                className="rounded border-input text-primary focus:ring-ring"
                                            />
                                            <span>{c.code} - {c.title}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <Button type="submit" disabled={createProcessing} className="w-full font-bold text-xs cursor-pointer shadow-xs">
                                {createProcessing ? 'Creating Account...' : 'Register Student & Attach Courses'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Modal: Edit Student */}
                {editingStudent && (
                    <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
                        <DialogContent className="max-w-4xl sm:max-w-4xl bg-card border-border text-foreground p-6 sm:p-8 space-y-6">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black flex items-center gap-2">
                                    <Pencil className="w-6 h-6 text-primary" /> Edit Student Profile ({editingStudent.name})
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Update bio information, student numbers, login credentials, and course attachments.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleUpdateStudent} className="space-y-6">
                                <div className="space-y-3">
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-border pb-1">
                                        Personal & Bio Details
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="e_student_number" className="text-xs font-bold">Student Number / ID</Label>
                                            <Input
                                                id="e_student_number"
                                                placeholder="e.g. STU-2026-001"
                                                value={editData.student_number}
                                                onChange={(e) => setEditData('student_number', e.target.value)}
                                                className="bg-background border-input text-xs uppercase"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="e_email" className="text-xs font-bold">Email Address *</Label>
                                            <Input
                                                id="e_email"
                                                type="email"
                                                required
                                                value={editData.email}
                                                onChange={(e) => setEditData('email', e.target.value)}
                                                className="bg-background border-input text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="e_first_name" className="text-xs font-bold">First Name *</Label>
                                            <Input
                                                id="e_first_name"
                                                required
                                                value={editData.first_name}
                                                onChange={(e) => setEditData('first_name', e.target.value)}
                                                className="bg-background border-input text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="e_middle_name" className="text-xs font-bold">Middle Name</Label>
                                            <Input
                                                id="e_middle_name"
                                                value={editData.middle_name}
                                                onChange={(e) => setEditData('middle_name', e.target.value)}
                                                className="bg-background border-input text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="e_surname" className="text-xs font-bold">Surname / Last Name *</Label>
                                            <Input
                                                id="e_surname"
                                                required
                                                value={editData.surname}
                                                onChange={(e) => setEditData('surname', e.target.value)}
                                                className="bg-background border-input text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="e_gender" className="text-xs font-bold">Gender</Label>
                                            <select
                                                id="e_gender"
                                                value={editData.gender}
                                                onChange={(e) => setEditData('gender', e.target.value as any)}
                                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground font-bold"
                                            >
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="e_date_of_birth" className="text-xs font-bold">Date of Birth</Label>
                                            <Input
                                                id="e_date_of_birth"
                                                type="date"
                                                value={editData.date_of_birth}
                                                onChange={(e) => setEditData('date_of_birth', e.target.value)}
                                                className="bg-background border-input text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="e_password" className="text-xs font-bold">Reset Password (Optional)</Label>
                                            <Input
                                                id="e_password"
                                                type="password"
                                                placeholder="Leave blank to keep current"
                                                value={editData.password}
                                                onChange={(e) => setEditData('password', e.target.value)}
                                                className="bg-background border-input text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Enrolled Courses Checkbox Grid */}
                                <div className="space-y-2 pt-2 border-t border-border">
                                    <Label className="font-extrabold text-primary uppercase tracking-wider text-xs flex items-center justify-between">
                                        <span>Enrolled / Attached Courses</span>
                                        <span className="text-[11px] text-muted-foreground font-normal normal-case">
                                            ({editData.course_ids.length} of {availableCourses.length} selected)
                                        </span>
                                    </Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-3 rounded-xl bg-muted/50 border border-border">
                                        {availableCourses.map((c) => (
                                            <label key={c.id} className="flex items-center gap-2 cursor-pointer text-xs font-semibold p-2 rounded-lg bg-background/80 hover:bg-background border border-border/40 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={editData.course_ids.includes(c.id)}
                                                    onChange={() => toggleCourseSelection(c.id, editData.course_ids, (ids) => setEditData('course_ids', ids))}
                                                    className="rounded border-input text-primary focus:ring-ring cursor-pointer"
                                                />
                                                <span className="truncate">[{c.code}] {c.title}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditingStudent(null)}
                                        className="font-bold text-xs cursor-pointer"
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={editProcessing} className="font-bold text-xs cursor-pointer shadow-xs min-w-[160px]">
                                        {editProcessing ? 'Saving Profile...' : 'Update Student Record'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Modal: Quick Attach Courses */}
                {attachStudent && (
                    <Dialog open={!!attachStudent} onOpenChange={() => setAttachStudent(null)}>
                        <DialogContent className="max-w-md bg-card border-border text-foreground">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5 text-primary" /> Attach Courses to {attachStudent.name}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Select courses to attach to this student's account.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleAttachCourses} className="space-y-4 mt-2">
                                <div className="space-y-2 max-h-60 overflow-y-auto p-3 rounded-xl bg-muted border border-border">
                                    {availableCourses.map((c) => (
                                        <label key={c.id} className="flex items-center gap-2 cursor-pointer text-xs font-semibold p-1 hover:bg-background/80 rounded">
                                            <input
                                                type="checkbox"
                                                checked={attachData.course_ids.includes(c.id)}
                                                onChange={() => toggleCourseSelection(c.id, attachData.course_ids, (ids) => setAttachData('course_ids', ids))}
                                                className="rounded border-input text-primary focus:ring-ring"
                                            />
                                            <span>{c.code} - {c.title}</span>
                                        </label>
                                    ))}
                                </div>

                                <Button type="submit" disabled={attachProcessing} className="w-full font-bold text-xs cursor-pointer shadow-xs">
                                    {attachProcessing ? 'Attaching...' : 'Save Attached Courses'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Modal: Import Student Roster CSV */}
                <Dialog open={isCsvModalOpen} onOpenChange={setIsCsvModalOpen}>
                    <DialogContent className="max-w-lg bg-card border-border text-foreground">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                <Upload className="w-5 h-5 text-primary" /> Import Student Roster CSV
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Upload a CSV file containing student accounts and optionally attach them to courses.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="p-3 rounded-xl bg-muted border border-border space-y-1.5 text-xs text-muted-foreground">
                            <div className="font-bold text-foreground text-[11px] uppercase tracking-wider">Supported CSV Column Formats:</div>
                            <code className="font-mono text-[10px] bg-background border border-border p-2 rounded block overflow-x-auto text-primary">
                                student_number, first_name, middle_name, surname, gender, date_of_birth, email, password
                            </code>
                            <div className="text-[10px] italic opacity-80">
                                Legacy CSV formats (<code className="font-mono">name, email, student_id</code>) are also automatically supported.
                            </div>
                        </div>

                        <form onSubmit={handleImportCsv} className="space-y-4 mt-2">
                            <div className="space-y-1">
                                <Label htmlFor="csv_file_input" className="text-xs font-bold">Select CSV File *</Label>
                                <Input
                                    id="csv_file_input"
                                    type="file"
                                    accept=".csv,.txt"
                                    required
                                    onChange={(e) => setCsvData('csv_file', e.target.files ? e.target.files[0] : null)}
                                    className="bg-background border-input text-xs cursor-pointer"
                                />
                                {csvErrors.csv_file && <p className="text-[10px] text-destructive">{csvErrors.csv_file}</p>}
                            </div>

                            {/* Attach Courses Checkboxes */}
                            <div className="space-y-2 pt-2 border-t border-border text-xs">
                                <Label className="font-bold text-primary uppercase tracking-wider text-[11px]">
                                    Attach Imported Students to Courses (Optional)
                                </Label>
                                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 rounded bg-muted border border-border">
                                    {availableCourses.map((c) => (
                                        <label key={c.id} className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                                            <input
                                                type="checkbox"
                                                checked={csvData.course_ids.includes(c.id)}
                                                onChange={() => toggleCourseSelection(c.id, csvData.course_ids, (ids) => setCsvData('course_ids', ids))}
                                                className="rounded border-input text-primary focus:ring-ring"
                                            />
                                            <span>{c.code} - {c.title}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <Button type="submit" disabled={csvProcessing} className="w-full font-bold text-xs cursor-pointer shadow-xs">
                                {csvProcessing ? 'Importing Roster...' : 'Import Students & Attach Courses'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Modal: Generate External / Guest Student IDs */}
                <Dialog open={isExternalModalOpen} onOpenChange={setIsExternalModalOpen}>
                    <DialogContent className="max-w-md bg-card border-border text-foreground">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                <Globe className="w-5 h-5 text-amber-500" /> Generate Guest / External Exam IDs
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Create batch Student IDs for external candidates or guests taking an assessment.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleGenerateExternalIds} className="space-y-4 mt-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="ext_quantity" className="text-xs font-bold">Quantity (IDs to Generate) *</Label>
                                    <Input
                                        id="ext_quantity"
                                        type="number"
                                        min="1"
                                        max="100"
                                        required
                                        value={externalData.quantity}
                                        onChange={(e) => setExternalData('quantity', parseInt(e.target.value) || 1)}
                                        className="bg-background border-input text-xs font-bold"
                                    />
                                    {externalErrors.quantity && <p className="text-[10px] text-destructive">{externalErrors.quantity}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="ext_prefix" className="text-xs font-bold">ID Prefix *</Label>
                                    <Input
                                        id="ext_prefix"
                                        placeholder="e.g. EXT or GST"
                                        required
                                        value={externalData.prefix}
                                        onChange={(e) => setExternalData('prefix', e.target.value.toUpperCase())}
                                        className="bg-background border-input text-xs font-mono font-bold uppercase"
                                    />
                                    {externalErrors.prefix && <p className="text-[10px] text-destructive">{externalErrors.prefix}</p>}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="ext_label" className="text-xs font-bold">Candidate Label / Name Prefix</Label>
                                <Input
                                    id="ext_label"
                                    placeholder="e.g. Guest Candidate, Walk-in Applicant"
                                    value={externalData.label}
                                    onChange={(e) => setExternalData('label', e.target.value)}
                                    className="bg-background border-input text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="ext_course" className="text-xs font-bold">Attach to Course (Optional)</Label>
                                <select
                                    id="ext_course"
                                    value={externalData.course_id}
                                    onChange={(e) => setExternalData('course_id', e.target.value)}
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground font-bold"
                                >
                                    <option value="">-- No Course (Unassigned Guest IDs) --</option>
                                    {availableCourses.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            [{c.code}] {c.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="p-3 rounded-lg bg-muted border border-border text-[11px] text-muted-foreground space-y-1">
                                <p className="font-bold text-foreground">💡 How Guests Join:</p>
                                <p>Generated IDs (e.g. <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{externalData.prefix || 'EXT'}-2026-0001</span>) can be sent to candidates to enter on <span className="font-bold text-foreground">/join</span>.</p>
                                <p>Default candidate passcode: <span className="font-mono text-foreground font-bold">guest123</span></p>
                            </div>

                            <Button
                                type="submit"
                                disabled={externalProcessing}
                                className="w-full font-bold text-xs cursor-pointer shadow-xs bg-amber-500 hover:bg-amber-600 text-amber-950"
                            >
                                {externalProcessing ? 'Generating IDs...' : `Generate ${externalData.quantity} Guest ID(s)`}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
