import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { AppFooter } from '@/components/app-footer';
import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, KeyRound, Sparkles, UserCheck, Users, Zap } from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    initialCode?: string;
    initialStudentId?: string;
    errors?: Record<string, string>;
}

export default function JoinRoom({ initialCode = '', initialStudentId = '', errors }: Props) {
    const [highContrast, setHighContrast] = useState(false);
    const [codeConfirmed, setCodeConfirmed] = useState(Boolean(initialCode && initialCode.trim().length >= 3));

    const { data, setData, post, processing, errors: formErrors } = useForm({
        code: initialCode,
        student_id_code: initialStudentId,
    });

    const combinedErrors = { ...errors, ...formErrors };

    const handleCodeNext = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (data.code && data.code.trim().length >= 3) {
            setCodeConfirmed(true);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/join');
    };

    return (
        <div
            className={`min-h-screen flex flex-col items-center justify-between p-4 transition-colors duration-200 ${
                highContrast
                    ? 'bg-black text-yellow-400 font-mono'
                    : 'bg-background text-foreground'
            }`}
        >
            <Head title="Join Assessment Room - K-EMS" />

            {/* Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

            <div className="w-full max-w-md relative z-10 space-y-6 my-auto">
                {/* Header Logo */}
                <div className="text-center space-y-3 flex flex-col items-center">
                    <Link href="/">
                        <AppLogo />
                    </Link>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider shadow-xs">
                        <Zap className="w-3.5 h-3.5" /> Instant Candidate Join Portal
                    </div>
                    <p className="text-xs text-muted-foreground">
                        No account required. Enter room code & student number to join live.
                    </p>
                </div>

                <Card
                    className={`border shadow-xl backdrop-blur-md ${
                        highContrast
                            ? 'bg-black border-yellow-400 text-yellow-400'
                            : 'bg-card text-card-foreground border-border'
                    }`}
                >
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl font-bold flex items-center justify-between">
                            <span>Room Access</span>
                            <div className="flex items-center gap-2">
                                <AppearanceToggleDropdown />
                                <button
                                    type="button"
                                    onClick={() => setHighContrast(!highContrast)}
                                    className="text-[11px] px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer font-bold"
                                >
                                    {highContrast ? 'Standard' : 'Contrast'}
                                </button>
                            </div>
                        </CardTitle>
                        <CardDescription className={highContrast ? 'text-yellow-300' : 'text-muted-foreground text-xs'}>
                            {!codeConfirmed
                                ? "Enter your instructor's room code to begin."
                                : 'Enter your Student Number or ID to access your exam paper.'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {!codeConfirmed ? (
                            /* STEP 1: Enter Room Code */
                            <form onSubmit={handleCodeNext} className="space-y-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="code"
                                        className="text-xs font-extrabold uppercase tracking-wider text-primary flex items-center gap-1.5"
                                    >
                                        <KeyRound className="w-3.5 h-3.5" /> Room Code
                                    </Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        placeholder="e.g. ALPHA7"
                                        value={data.code}
                                        maxLength={8}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        className={`text-center text-2xl font-black tracking-widest uppercase h-14 ${
                                            highContrast
                                                ? 'bg-black border-2 border-yellow-400 text-yellow-400 placeholder:text-yellow-700'
                                                : 'bg-background border-input text-primary font-mono placeholder:text-muted-foreground focus:border-primary'
                                        }`}
                                        required
                                        autoFocus
                                    />
                                    {combinedErrors.code && (
                                        <p className="text-xs font-medium text-destructive mt-1">
                                            {combinedErrors.code}
                                        </p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={!data.code.trim()}
                                    className="w-full h-11 font-extrabold text-xs shadow-xs gap-2 cursor-pointer"
                                >
                                    Next: Enter Student ID →
                                </Button>
                            </form>
                        ) : (
                            /* STEP 2: Room Code Confirmed - ONLY Show Student Number / ID Input */
                            <form onSubmit={submit} className="space-y-4">
                                {/* Room Code Confirmation Badge */}
                                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-primary" />
                                        <span className="text-xs text-muted-foreground font-medium">Room Code:</span>
                                        <span className="font-mono font-black text-sm text-primary uppercase">
                                            {data.code}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setCodeConfirmed(false)}
                                        className="text-[11px] text-muted-foreground hover:text-foreground underline font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                        <ArrowLeft className="w-3 h-3" /> Change
                                    </button>
                                </div>

                                {/* ONLY STUDENT NUMBER / ID INPUT */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="student_id_code"
                                        className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5"
                                    >
                                        <UserCheck className="w-3.5 h-3.5 text-primary" /> Student Number / ID *
                                    </Label>
                                    <Input
                                        id="student_id_code"
                                        type="text"
                                        placeholder="e.g. 2026/001 or STU-9021"
                                        value={data.student_id_code}
                                        onChange={(e) => setData('student_id_code', e.target.value)}
                                        className={`h-12 text-sm font-bold ${
                                            highContrast
                                                ? 'bg-black border border-yellow-400 text-yellow-400'
                                                : 'bg-background border-input text-foreground font-mono'
                                        }`}
                                        required
                                        autoFocus
                                    />
                                    {combinedErrors.student_id_code && (
                                        <p className="text-xs font-medium text-destructive mt-1">
                                            {combinedErrors.student_id_code}
                                        </p>
                                    )}
                                    {combinedErrors.code && (
                                        <p className="text-xs font-medium text-destructive mt-1">
                                            {combinedErrors.code}
                                        </p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={processing || !data.student_id_code.trim()}
                                    className="w-full h-12 font-extrabold text-xs shadow-xs gap-2 cursor-pointer"
                                >
                                    {processing ? (
                                        <Sparkles className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Users className="w-4 h-4" /> Enter Live Exam Room
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="w-full mt-8">
                <AppFooter />
            </div>
        </div>
    );
}
