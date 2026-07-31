import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Head, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    Plus,
    Save,
    Sparkles,
    Trash2,
    Wand2,
} from 'lucide-react';
import React, { useState } from 'react';

interface OptionData {
    option_text: string;
    is_correct: boolean;
}

interface QuestionData {
    type: 'multiple_choice' | 'true_false' | 'short_answer' | 'multi_select';
    question_text: string;
    explanation: string;
    points: number;
    options: OptionData[];
}

interface AssessmentData {
    id?: number;
    title: string;
    subject: string;
    grade_level: string;
    description: string;
    questions: QuestionData[];
}

interface Props {
    assessment: AssessmentData | null;
}

export default function AssessmentBuilder({ assessment }: Props) {
    const isEdit = !!assessment;

    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiCount, setAiCount] = useState(5);
    const [isAiGenerating, setIsAiGenerating] = useState(false);

    const { data, setData, post, put, processing } = useForm<AssessmentData>({
        title: assessment?.title || '',
        subject: assessment?.subject || 'General Science',
        grade_level: assessment?.grade_level || 'High School',
        description: assessment?.description || '',
        questions: assessment?.questions || [
            {
                type: 'multiple_choice',
                question_text: 'What is the primary function of chlorophyll in plant cells?',
                explanation: 'Chlorophyll absorbs sunlight energy to fuel photosynthesis.',
                points: 1,
                options: [
                    { option_text: 'Absorb sunlight for photosynthesis', is_correct: true },
                    { option_text: 'Store genetic information', is_correct: false },
                    { option_text: 'Synthesize proteins', is_correct: false },
                    { option_text: 'Transport water from roots', is_correct: false },
                ],
            },
        ],
    });

    const addQuestion = (type: QuestionData['type'] = 'multiple_choice') => {
        const defaultOptions: OptionData[] =
            type === 'true_false'
                ? [
                      { option_text: 'True', is_correct: true },
                      { option_text: 'False', is_correct: false },
                  ]
                : type === 'short_answer'
                ? [{ option_text: 'Sample Answer', is_correct: true }]
                : [
                      { option_text: 'Option 1', is_correct: true },
                      { option_text: 'Option 2', is_correct: false },
                      { option_text: 'Option 3', is_correct: false },
                  ];

        setData('questions', [
            ...data.questions,
            {
                type,
                question_text: '',
                explanation: '',
                points: 1,
                options: defaultOptions,
            },
        ]);
    };

    const removeQuestion = (index: number) => {
        if (data.questions.length <= 1) return;
        setData(
            'questions',
            data.questions.filter((_, i) => i !== index)
        );
    };

    const updateQuestion = (index: number, field: keyof QuestionData, value: any) => {
        const updated = [...data.questions];
        updated[index] = { ...updated[index], [field]: value };
        setData('questions', updated);
    };

    const updateOption = (qIndex: number, oIndex: number, field: keyof OptionData, value: any) => {
        const updatedQuestions = [...data.questions];
        const updatedOptions = [...updatedQuestions[qIndex].options];

        if (field === 'is_correct' && updatedQuestions[qIndex].type !== 'multi_select') {
            updatedOptions.forEach((opt, i) => {
                opt.is_correct = i === oIndex ? (value as boolean) : false;
            });
        } else {
            updatedOptions[oIndex] = { ...updatedOptions[oIndex], [field]: value };
        }

        updatedQuestions[qIndex].options = updatedOptions;
        setData('questions', updatedQuestions);
    };

    const addOption = (qIndex: number) => {
        const updatedQuestions = [...data.questions];
        if (updatedQuestions[qIndex].options.length >= 6) return;
        updatedQuestions[qIndex].options.push({
            option_text: `Option ${updatedQuestions[qIndex].options.length + 1}`,
            is_correct: false,
        });
        setData('questions', updatedQuestions);
    };

    const removeOption = (qIndex: number, oIndex: number) => {
        const updatedQuestions = [...data.questions];
        if (updatedQuestions[qIndex].options.length <= 2) return;
        updatedQuestions[qIndex].options = updatedQuestions[qIndex].options.filter((_, i) => i !== oIndex);
        setData('questions', updatedQuestions);
    };

    const handleAiGenerate = async () => {
        if (!aiTopic.trim()) return;
        setIsAiGenerating(true);
        try {
            const res = await fetch('/api/ai/generate-quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    topic: aiTopic,
                    count: aiCount,
                    subject: data.subject,
                }),
            });

            if (res.ok) {
                const generated = await res.json();
                if (generated.questions && Array.isArray(generated.questions)) {
                    setData((prev) => ({
                        ...prev,
                        title: prev.title || generated.title || `${aiTopic} Quiz`,
                        questions: [...prev.questions, ...generated.questions],
                    }));
                    setAiModalOpen(false);
                    setAiTopic('');
                }
            }
        } catch (e) {
            console.error('AI Generation Failed:', e);
        } finally {
            setIsAiGenerating(false);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit && assessment?.id) {
            put(`/assessments/${assessment.id}`);
        } else {
            post('/assessments');
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Assessments', href: '/assessments' },
                { title: isEdit ? 'Edit Assessment' : 'Quiz Builder', href: '#' },
            ]}
        >
            <Head title={isEdit ? `Edit ${data.title}` : 'Quiz Builder - AI Assisted'} />

            <div className="p-4 sm:p-6 space-y-6 w-full max-w-[1800px] mx-auto">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-500" />
                            {isEdit ? 'Edit Assessment' : 'Rapid Quiz Builder'}
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Build custom assessments manually or use AI Assist for automated question generation.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            onClick={() => setAiModalOpen(!aiModalOpen)}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs gap-2 shadow-lg cursor-pointer"
                        >
                            <Wand2 className="w-4 h-4" /> AI Generator Assist
                        </Button>
                        <Button
                            type="submit"
                            onClick={submit}
                            disabled={processing}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2 shadow-lg cursor-pointer"
                        >
                            <Save className="w-4 h-4" /> {processing ? 'Saving...' : 'Save Assessment'}
                        </Button>
                    </div>
                </div>

                {/* AI Generator Card */}
                {aiModalOpen && (
                    <Card className="bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-500/30 p-5 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                                <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400" /> AI Quiz Generator
                            </h3>
                            <span className="text-xs text-purple-700 dark:text-purple-300 font-semibold">Generates multiple-choice items</span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <Input
                                placeholder="Enter topic or upload prompt... (e.g.Photosynthesis and Cellular Respiration)"
                                value={aiTopic}
                                onChange={(e) => setAiTopic(e.target.value)}
                                className="bg-white dark:bg-slate-900 border-purple-300 dark:border-purple-500/40 text-slate-900 dark:text-slate-100 text-xs font-semibold"
                            />
                            <Button
                                type="button"
                                onClick={handleAiGenerate}
                                disabled={isAiGenerating || !aiTopic.trim()}
                                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs whitespace-nowrap cursor-pointer shadow-md"
                            >
                                {isAiGenerating ? 'Generating...' : 'Generate 5 Questions'}
                            </Button>
                        </div>
                    </Card>
                )}

                <form onSubmit={submit} className="space-y-6">
                    {/* Basic Meta Details */}
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-xl">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2 space-y-1.5">
                                <Label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Assessment Title</Label>
                                <Input
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Biology Midterm Quiz 2026"
                                    className="bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold text-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Subject Category</Label>
                                <Input
                                    value={data.subject}
                                    onChange={(e) => setData('subject', e.target.value)}
                                    placeholder="e.g. Science / Math / Corporate"
                                    className="bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Questions Builder list */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                Questions ({data.questions.length})
                            </h2>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    onClick={() => addQuestion('multiple_choice')}
                                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs h-8 border border-slate-300 dark:border-slate-700 cursor-pointer"
                                >
                                    + Multiple Choice
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => addQuestion('true_false')}
                                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs h-8 border border-slate-300 dark:border-slate-700 cursor-pointer"
                                >
                                    + True / False
                                </Button>
                            </div>
                        </div>

                        {data.questions.map((q, qIndex) => (
                            <Card key={qIndex} className="bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 p-4 space-y-4 relative shadow-xl">
                                <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                        <span className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-extrabold">
                                            Q{qIndex + 1}
                                        </span>
                                        <select
                                            value={q.type}
                                            onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                                            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 rounded px-2 py-1 text-xs font-bold"
                                        >
                                            <option value="multiple_choice">Multiple Choice</option>
                                            <option value="true_false">True / False</option>
                                            <option value="short_answer">Short Answer</option>
                                            <option value="multi_select">Multi-Select</option>
                                        </select>
                                    </div>

                                    {data.questions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(qIndex)}
                                            className="text-slate-400 hover:text-rose-500 text-xs p-1 cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <Textarea
                                        placeholder="Enter question text or prompt here..."
                                        rows={3}
                                        value={q.question_text}
                                        onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                                        className="bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold text-xs"
                                        required
                                    />

                                    {/* Question Options */}
                                    {q.type !== 'short_answer' && (
                                        <div className="space-y-2 pl-2">
                                            <Label className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Options (Select Correct)</Label>
                                            {q.options.map((opt, oIndex) => (
                                                <div key={oIndex} className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateOption(qIndex, oIndex, 'is_correct', !opt.is_correct)}
                                                        className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                                                            opt.is_correct
                                                                ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500 text-emerald-800 dark:text-emerald-400'
                                                                : 'bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-400'
                                                        }`}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 fill-current" />
                                                    </button>

                                                    <Input
                                                        value={opt.option_text}
                                                        onChange={(e) => updateOption(qIndex, oIndex, 'option_text', e.target.value)}
                                                        placeholder={`Option ${oIndex + 1}`}
                                                        className="bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 text-xs h-9"
                                                        required
                                                    />

                                                    {q.options.length > 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeOption(qIndex, oIndex)}
                                                            className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}

                                            {q.type === 'multiple_choice' && q.options.length < 6 && (
                                                <button
                                                    type="button"
                                                    onClick={() => addOption(qIndex)}
                                                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold pt-1 cursor-pointer"
                                                >
                                                    + Add Option
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Explanation */}
                                    <Input
                                        placeholder="Explanation / Feedback for students (Optional)..."
                                        value={q.explanation || ''}
                                        onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                        className="bg-slate-50 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs italic h-8"
                                    />
                                </div>
                            </Card>
                        ))}
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
