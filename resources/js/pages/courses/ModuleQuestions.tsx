import LaunchModal from '@/components/assessments/LaunchModal';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Download,
    FileSpreadsheet,
    HelpCircle,
    Pencil,
    Plus,
    Play,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

interface QuestionOption {
    id?: number;
    option_text: string;
    is_correct: boolean;
    order?: number;
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
    description?: string;
    questions: Question[];
}

interface Module {
    id: number;
    title: string;
    code?: string;
    description?: string;
    exam_duration_minutes?: number | null;
}

interface Course {
    id: number;
    title: string;
    code: string;
}

interface Props {
    course: Course;
    module: Module;
    assessment: Assessment;
}

export default function ModuleQuestions({ course, module, assessment }: Props) {
    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
    const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
    const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
    const [toast, setToast] = useState<{ title: string; message: string; type?: 'success' | 'danger' | 'info' } | null>(null);

    const triggerToast = (title: string, message: string, type: 'success' | 'danger' | 'info' = 'success') => {
        setToast({ title, message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Form for Manual Question Addition
    const { data: addData, setData: setAddData, post: postAdd, processing: addProcessing, reset: resetAdd } = useForm({
        type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'short_answer' | 'multi_select',
        question_text: '',
        explanation: '',
        points: 1,
        options: [
            { option_text: '', is_correct: true },
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false },
        ] as QuestionOption[],
    });

    // Form for Inline Question Editing
    const { data: editData, setData: setEditData, put: putEdit, processing: editProcessing } = useForm({
        type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'short_answer' | 'multi_select',
        question_text: '',
        explanation: '',
        points: 1,
        options: [] as QuestionOption[],
    });

    // Form for CSV Upload
    const { data: csvData, setData: setCsvData, post: postCsv, processing: csvProcessing, reset: resetCsv, errors: csvErrors } = useForm({
        csv_file: null as File | null,
    });

    const { delete: deleteQuestionPost } = useForm();

    const handleTypeChange = (type: 'multiple_choice' | 'true_false' | 'short_answer' | 'multi_select') => {
        let options = addData.options;
        if (type === 'true_false') {
            options = [
                { option_text: 'True', is_correct: true },
                { option_text: 'False', is_correct: false },
            ];
        } else if (type === 'short_answer') {
            options = [];
        } else {
            // Default 4 options for multiple_choice and multi_select
            if (!options || options.length < 2 || options.some((o) => o.option_text === 'True' || o.option_text === 'False')) {
                options = [
                    { option_text: '', is_correct: true },
                    { option_text: '', is_correct: false },
                    { option_text: '', is_correct: false },
                    { option_text: '', is_correct: false },
                ];
            }
        }
        setAddData({ ...addData, type, options });
    };

    const handleAddOption = () => {
        if (addData.options.length >= 6) return;
        setAddData('options', [...addData.options, { option_text: '', is_correct: false }]);
    };

    const handleRemoveOption = (index: number) => {
        if (addData.options.length <= 2) return;
        setAddData('options', addData.options.filter((_, i) => i !== index));
    };

    const toggleOptionCorrectness = (index: number) => {
        if (addData.type === 'multi_select') {
            const updated = addData.options.map((opt, i) =>
                i === index ? { ...opt, is_correct: !opt.is_correct } : opt
            );
            setAddData('options', updated);
        } else {
            const updated = addData.options.map((opt, i) => ({
                ...opt,
                is_correct: i === index,
            }));
            setAddData('options', updated);
        }
    };

    const handleAddQuestion = (e: React.FormEvent) => {
        e.preventDefault();
        postAdd(`/courses/${course.id}/modules/${module.id}/questions`, {
            onSuccess: () => {
                resetAdd();
                // Ensure options reset to 4 clean options for MC
                setAddData('options', [
                    { option_text: '', is_correct: true },
                    { option_text: '', is_correct: false },
                    { option_text: '', is_correct: false },
                    { option_text: '', is_correct: false },
                ]);
                triggerToast('Question Added', 'Question saved to assessment bank.', 'success');
            },
        });
    };

    const handleStartInlineEdit = (q: Question) => {
        setEditingQuestionId(q.id);
        let opts = q.options || [];
        if ((q.type === 'multiple_choice' || q.type === 'multi_select') && opts.length < 2) {
            opts = [
                { option_text: '', is_correct: true },
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
            ];
        }
        setEditData({
            type: q.type,
            question_text: q.question_text,
            explanation: q.explanation || '',
            points: q.points || 1,
            options: opts,
        });
    };

    const handleEditAddOption = () => {
        if (editData.options.length >= 6) return;
        setEditData({
            ...editData,
            options: [...editData.options, { option_text: '', is_correct: false }],
        });
    };

    const handleEditRemoveOption = (index: number) => {
        if (editData.options.length <= 2) return;
        setEditData({
            ...editData,
            options: editData.options.filter((_, i) => i !== index),
        });
    };

    const handleUpdateQuestionInline = (e: React.FormEvent, questionId: number) => {
        e.preventDefault();
        putEdit(`/courses/${course.id}/modules/${module.id}/questions/${questionId}`, {
            onSuccess: () => {
                setEditingQuestionId(null);
                triggerToast('Question Updated', 'Inline changes saved.', 'success');
            },
        });
    };

    const handleDeleteQuestion = (questionId: number) => {
        if (confirm('Delete this question from module?')) {
            deleteQuestionPost(`/courses/${course.id}/modules/${module.id}/questions/${questionId}`, {
                onSuccess: () => triggerToast('Question Deleted', 'Question removed.', 'danger'),
            });
        }
    };

    const handleCsvUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!csvData.csv_file) return;
        postCsv(`/courses/${course.id}/modules/${module.id}/questions/import-csv`, {
            onSuccess: () => {
                resetCsv();
                setIsCsvImportOpen(false);
                triggerToast('CSV Questions Imported', 'Bulk questions imported successfully.', 'success');
            },
        });
    };

    const downloadSampleCsv = () => {
        const sampleText = `type,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation
multiple_choice,"What is the main function of an Operating System Kernel?",Memory Management,Graphic Design,Web Hosting,Database Query,A,"The kernel manages memory, CPU, and hardware resources."
true_false,"TCP is a connection-oriented reliable protocol.",True,False,,,A,"TCP uses a 3-way handshake to establish reliable connections."
short_answer,"What port number is standard for HTTPS?",443,,,,443,"Port 443 is used for secure HTTP communications."`;

        const blob = new Blob([sampleText], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sample_questions_${module.code ? module.code.toLowerCase() : 'template'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Courses', href: '/courses' },
            { title: course.code, href: `/courses/${course.id}` },
            { title: module.title, href: '#' },
        ]}>
            <Head title={`Manage Questions - ${module.title}`} />

            {/* Action Toast Notification */}
            {toast && (
                <div className="fixed top-4 right-4 z-50 p-4 rounded-xl bg-card border border-border shadow-md text-card-foreground flex items-start gap-3 animate-in slide-in-from-top-2 max-w-sm">
                    {toast.type === 'danger' ? (
                        <Trash2 className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                    ) : (
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    )}
                    <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-foreground">{toast.title}</h4>
                        <p className="text-[11px] text-muted-foreground">{toast.message}</p>
                    </div>
                </div>
            )}

            <div className="p-4 sm:p-6 space-y-8 w-full max-w-[1700px] mx-auto">
                {/* Header Control */}
                <div className="p-6 rounded-2xl bg-card border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs text-card-foreground">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Link href={`/courses/${course.id}`} className="text-xs text-primary hover:underline font-bold flex items-center gap-1">
                                <ArrowLeft className="w-3.5 h-3.5" /> Back to Course
                            </Link>
                            <span className="text-muted-foreground">•</span>
                            <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary font-extrabold text-xs uppercase border border-primary/20">
                                {module.code || course.code}
                            </span>
                        </div>
                        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
                            <HelpCircle className="w-7 h-7 text-primary" /> Manage Questions: {module.title}
                        </h1>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{assessment.questions.length} questions in exam "{assessment.title}"</span>
                            {module.exam_duration_minutes ? (
                                <span className="px-2 py-0.5 rounded bg-muted border border-border text-foreground font-mono font-bold text-[11px] inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-primary" />
                                    {`${String(Math.floor(module.exam_duration_minutes / 60)).padStart(2, '0')}:${String(module.exam_duration_minutes % 60).padStart(2, '0')}:00`}
                                </span>
                            ) : null}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setIsCsvImportOpen(true)}
                            variant="outline"
                            className="font-bold text-xs gap-2 cursor-pointer"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-primary" /> Bulk Import Questions (CSV)
                        </Button>

                        <Button
                            onClick={() => setIsLaunchModalOpen(true)}
                            className="font-bold text-xs gap-2 shadow-xs cursor-pointer"
                        >
                            <Play className="w-4 h-4 fill-current" /> Launch Live Assessment Room
                        </Button>
                    </div>
                </div>

                {/* Single Column Workspace containing Add Question Manually above Question Bank */}
                <div className="space-y-6">
                    {/* Add Question Manually Card */}
                    <Card className="bg-card border-border p-5 space-y-4 shadow-xs text-card-foreground">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                            <Plus className="w-4 h-4 text-primary" /> Add Question Manually
                        </h3>

                        <form onSubmit={handleAddQuestion} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs text-foreground font-semibold">Question Type</Label>
                                    <select
                                        value={addData.type}
                                        onChange={(e) => handleTypeChange(e.target.value as any)}
                                        className="bg-background border border-input text-foreground text-xs rounded px-3 py-2 w-full font-bold"
                                    >
                                        <option value="multiple_choice">Multiple Choice (Single Correct)</option>
                                        <option value="multi_select">Multi-Select (Multiple Correct Checkboxes)</option>
                                        <option value="true_false">True / False</option>
                                        <option value="short_answer">Short Answer</option>
                                    </select>
                                </div>

                                <div className="sm:col-span-2 space-y-1">
                                    <Label className="text-xs text-foreground font-semibold">Question Prompt</Label>
                                    <Textarea
                                        placeholder="Type full question prompt or scenario here..."
                                        rows={3}
                                        value={addData.question_text}
                                        onChange={(e) => setAddData('question_text', e.target.value)}
                                        className="bg-background border-input text-foreground text-xs font-semibold"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Options for Multiple Choice, Multi-Select, True/False */}
                            {addData.type !== 'short_answer' && (
                                <div className="space-y-2.5 pt-2 border-t border-border">
                                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                                        <span className="flex items-center gap-2">
                                            <span>
                                                {addData.type === 'multi_select'
                                                    ? 'Options (Check All Correct Answers)'
                                                    : addData.type === 'true_false'
                                                    ? 'True/False Statement Options'
                                                    : 'Options (Check 1 Correct Answer)'}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-normal">
                                                ({(addData.options || []).length} Options)
                                            </span>
                                        </span>
                                        {(addData.type === 'multiple_choice' || addData.type === 'multi_select') && (addData.options || []).length < 6 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleAddOption}
                                                className="text-xs font-bold h-7 cursor-pointer"
                                            >
                                                + Add Option
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {(addData.options || []).map((opt, oIdx) => (
                                            <div key={oIdx} className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleOptionCorrectness(oIdx)}
                                                    className={`px-2.5 py-1.5 rounded-md border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                                                        opt.is_correct
                                                            ? 'bg-primary/10 border-primary text-primary shadow-xs'
                                                            : 'bg-background border-input text-muted-foreground hover:border-foreground'
                                                    }`}
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    {opt.is_correct ? 'Correct' : 'Mark'}
                                                </button>
                                                <Input
                                                    value={opt.option_text}
                                                    onChange={(e) => {
                                                        const updated = [...addData.options];
                                                        updated[oIdx].option_text = e.target.value;
                                                        setAddData('options', updated);
                                                    }}
                                                    placeholder={`Option ${String.fromCharCode(65 + oIdx)}...`}
                                                    className="bg-background border-input text-foreground text-xs h-9 font-semibold"
                                                    required
                                                />
                                                {addData.options.length > 2 && addData.type !== 'true_false' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveOption(oIdx)}
                                                        className="text-muted-foreground hover:text-destructive p-1 cursor-pointer"
                                                        title="Remove option"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <Label className="text-xs text-foreground font-semibold">Explanation / Feedback (Optional)</Label>
                                <Input
                                    placeholder="Optional explanation shown to student during review..."
                                    value={addData.explanation}
                                    onChange={(e) => setAddData('explanation', e.target.value)}
                                    className="bg-background border-input text-foreground text-xs"
                                />
                            </div>

                            <Button type="submit" disabled={addProcessing} className="w-full font-bold text-xs cursor-pointer shadow-xs">
                                {addProcessing ? 'Adding Question...' : 'Save Question to Module'}
                            </Button>
                        </form>
                    </Card>

                    {/* Question Bank Directory */}
                    <Card className="bg-card border-border p-5 space-y-4 shadow-xs text-card-foreground">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-primary" /> Module Question Bank ({assessment.questions.length})
                            </h3>
                            <Button
                                onClick={() => setIsCsvImportOpen(true)}
                                variant="outline"
                                size="sm"
                                className="font-bold text-xs gap-1.5 cursor-pointer"
                            >
                                <Upload className="w-3.5 h-3.5" /> Bulk CSV Import
                            </Button>
                        </div>

                        {assessment.questions.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground text-xs space-y-2">
                                <HelpCircle className="w-10 h-10 mx-auto text-muted-foreground/60" />
                                <p>No questions added to this module yet.</p>
                                <p className="text-[11px] opacity-80">Use manual builder above or click "Bulk CSV Import".</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {assessment.questions.map((q, idx) => {
                                    const isEditingThis = editingQuestionId === q.id;

                                    if (isEditingThis) {
                                        return (
                                            <Card key={q.id} className="bg-muted/40 border-primary/40 p-5 space-y-4 shadow-md text-card-foreground">
                                                <div className="flex items-center justify-between border-b border-border pb-2">
                                                    <span className="text-xs font-bold text-primary flex items-center gap-2">
                                                        <Pencil className="w-4 h-4" /> Editing Question Q{idx + 1} Inline
                                                    </span>
                                                    <button
                                                        onClick={() => setEditingQuestionId(null)}
                                                        className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <form onSubmit={(e) => handleUpdateQuestionInline(e, q.id)} className="space-y-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs text-foreground font-semibold">Question Type</Label>
                                                            <select
                                                                value={editData.type}
                                                                onChange={(e) => {
                                                                    const newType = e.target.value as any;
                                                                    let newOpts = editData.options;
                                                                    if (newType === 'true_false') {
                                                                        newOpts = [
                                                                            { option_text: 'True', is_correct: true },
                                                                            { option_text: 'False', is_correct: false },
                                                                        ];
                                                                    } else if (newType === 'short_answer') {
                                                                        newOpts = [];
                                                                    } else if (!newOpts || newOpts.length < 2 || newOpts.some((o) => o.option_text === 'True' || o.option_text === 'False')) {
                                                                        newOpts = [
                                                                            { option_text: '', is_correct: true },
                                                                            { option_text: '', is_correct: false },
                                                                            { option_text: '', is_correct: false },
                                                                            { option_text: '', is_correct: false },
                                                                        ];
                                                                    }
                                                                    setEditData({ ...editData, type: newType, options: newOpts });
                                                                }}
                                                                className="bg-background border border-input text-foreground text-xs rounded px-3 py-2 w-full font-bold"
                                                            >
                                                                <option value="multiple_choice">Multiple Choice</option>
                                                                <option value="multi_select">Multi-Select</option>
                                                                <option value="true_false">True / False</option>
                                                                <option value="short_answer">Short Answer</option>
                                                            </select>
                                                        </div>

                                                        <div className="sm:col-span-2 space-y-1">
                                                            <Label className="text-xs text-foreground font-semibold">Question Prompt</Label>
                                                            <Textarea
                                                                rows={3}
                                                                value={editData.question_text}
                                                                onChange={(e) => setEditData({ ...editData, question_text: e.target.value })}
                                                                className="bg-background border-input text-foreground text-xs font-semibold"
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    {editData.type !== 'short_answer' && (
                                                        <div className="space-y-2 pt-2 border-t border-border">
                                                            <div className="flex items-center justify-between text-xs font-bold text-foreground">
                                                                <span>Options (Select Correct)</span>
                                                                {(editData.type === 'multiple_choice' || editData.type === 'multi_select') && editData.options.length < 6 && (
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={handleEditAddOption}
                                                                        className="text-xs font-bold h-7 cursor-pointer"
                                                                    >
                                                                        + Add Option
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {editData.options.map((opt, oIdx) => (
                                                                    <div key={oIdx} className="flex items-center gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const updated = editData.options.map((o, i) => ({
                                                                                    ...o,
                                                                                    is_correct: editData.type === 'multi_select'
                                                                                        ? (i === oIdx ? !o.is_correct : o.is_correct)
                                                                                        : i === oIdx,
                                                                                }));
                                                                                setEditData({ ...editData, options: updated });
                                                                            }}
                                                                            className={`px-2.5 py-1.5 rounded-md border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                                                                                opt.is_correct
                                                                                    ? 'bg-primary/10 border-primary text-primary shadow-xs'
                                                                                    : 'bg-background border-input text-muted-foreground'
                                                                            }`}
                                                                        >
                                                                            <CheckCircle2 className="w-4 h-4" />
                                                                            {opt.is_correct ? 'Correct' : 'Mark'}
                                                                        </button>
                                                                        <Input
                                                                            value={opt.option_text}
                                                                            onChange={(e) => {
                                                                                const updated = [...editData.options];
                                                                                updated[oIdx].option_text = e.target.value;
                                                                                setEditData({ ...editData, options: updated });
                                                                            }}
                                                                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}...`}
                                                                            className="bg-background border-input text-foreground text-xs h-9 font-semibold"
                                                                            required
                                                                        />
                                                                        {editData.options.length > 2 && editData.type !== 'true_false' && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleEditRemoveOption(oIdx)}
                                                                                className="text-muted-foreground hover:text-destructive p-1 cursor-pointer"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setEditingQuestionId(null)}
                                                            className="text-xs font-bold cursor-pointer"
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            type="submit"
                                                            disabled={editProcessing}
                                                            size="sm"
                                                            className="text-xs font-bold cursor-pointer shadow-xs"
                                                        >
                                                            {editProcessing ? 'Saving...' : 'Save Question Changes'}
                                                        </Button>
                                                    </div>
                                                </form>
                                            </Card>
                                        );
                                    }

                                    return (
                                        <Card key={q.id} className="bg-card border-border p-4 space-y-3 shadow-xs text-card-foreground">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase">
                                                            Q{idx + 1} • {q.type.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">({q.points} Pts)</span>
                                                    </div>
                                                    <h4 className="text-sm font-bold text-foreground leading-snug">
                                                        {q.question_text}
                                                    </h4>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleStartInlineEdit(q)}
                                                        className="text-xs font-bold h-8 cursor-pointer"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteQuestion(q.id)}
                                                        className="text-xs font-bold h-8 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Options Display */}
                                            {q.type !== 'short_answer' && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border">
                                                    {(q.options || []).map((opt, oIdx) => (
                                                        <div
                                                            key={opt.id || oIdx}
                                                            className={`p-2 rounded-md border text-xs flex items-center gap-2 font-semibold ${
                                                                opt.is_correct
                                                                    ? 'bg-primary/10 border-primary/30 text-primary'
                                                                    : 'bg-muted/40 border-border text-muted-foreground'
                                                            }`}
                                                        >
                                                            <span className="w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center font-bold text-[10px]">
                                                                {String.fromCharCode(65 + oIdx)}
                                                            </span>
                                                            <span className="truncate">{opt.option_text}</span>
                                                            {opt.is_correct && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-primary" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {q.explanation && (
                                                <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded border border-border italic">
                                                    Explanation: {q.explanation}
                                                </p>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>

                {/* CSV Import Modal */}
                <Dialog open={isCsvImportOpen} onOpenChange={setIsCsvImportOpen}>
                    <DialogContent className="max-w-lg bg-card border-border text-foreground">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                <FileSpreadsheet className="w-5 h-5 text-primary" /> Bulk CSV Question Import
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Upload a CSV file to import multiple questions directly into {module.title}.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 mt-2">
                            <div className="p-3 rounded-xl bg-muted border border-border space-y-2 text-xs text-muted-foreground">
                                <div className="font-bold text-foreground text-[11px] uppercase tracking-wider">CSV Column Format Required:</div>
                                <code className="font-mono text-[10px] bg-background border border-border p-2 rounded block overflow-x-auto text-primary">
                                    type, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation
                                </code>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={downloadSampleCsv}
                                    className="text-xs font-bold gap-1.5 cursor-pointer mt-1"
                                >
                                    <Download className="w-3.5 h-3.5" /> Download Sample CSV Template
                                </Button>
                            </div>

                            <form onSubmit={handleCsvUpload} className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold">Select CSV File *</Label>
                                    <Input
                                        type="file"
                                        accept=".csv,.txt"
                                        required
                                        onChange={(e) => setCsvData('csv_file', e.target.files ? e.target.files[0] : null)}
                                        className="bg-background border-input text-xs cursor-pointer"
                                    />
                                    {csvErrors.csv_file && <p className="text-[10px] text-destructive">{csvErrors.csv_file}</p>}
                                </div>

                                <Button type="submit" disabled={csvProcessing} className="w-full font-bold text-xs cursor-pointer shadow-xs">
                                    {csvProcessing ? 'Uploading Questions...' : 'Import CSV Questions'}
                                </Button>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Launch Modal */}
                {assessment && (
                    <LaunchModal
                        isOpen={isLaunchModalOpen}
                        onClose={() => setIsLaunchModalOpen(false)}
                        module={module}
                    />
                )}
            </div>
        </AppLayout>
    );
}
