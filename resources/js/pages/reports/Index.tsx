import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link, useForm } from '@inertiajs/react';
import { BarChart3, Download, FileText, Trash2, Users } from 'lucide-react';

interface Assessment {
    id: number;
    title: string;
    subject: string;
}

interface Room {
    id: number;
    code: string;
    mode: string;
    status: string;
    participants_count: number;
    created_at: string;
    assessment: Assessment;
}

interface Props {
    rooms: Room[];
}

export default function ReportIndex({ rooms }: Props) {
    const { delete: destroyReport } = useForm();

    const handleDeleteReport = (roomId: number, code: string) => {
        if (confirm(`Are you sure you want to delete report for Room (${code})? All participant answer logs for this session will be removed.`)) {
            destroyReport(`/reports/${roomId}`);
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Reports & Analytics', href: '/reports' }]}>
            <Head title="Reports & Analytics" />

            <div className="p-4 sm:p-6 space-y-6 w-full max-w-[1800px] mx-auto">
                <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
                            <BarChart3 className="w-7 h-7 text-primary" /> Assessment Reports
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Historical analytics, student scorecards, and CSV exports for completed rooms.
                        </p>
                    </div>
                </div>

                {rooms.length === 0 ? (
                    <Card className="bg-card text-card-foreground border-border text-center py-12 p-4 shadow-xs">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <h3 className="text-base font-bold text-foreground">No Assessment Reports Yet</h3>
                        <p className="text-xs text-muted-foreground">Launch an assessment room to start gathering reports.</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rooms.map((r) => (
                            <Card key={r.id} className="bg-card border-border flex flex-col justify-between hover:border-primary/50 transition-all shadow-xs text-card-foreground">
                                <CardHeader className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary font-bold uppercase border border-primary/20">
                                            Code: {r.code}
                                        </span>
                                        <span className="capitalize text-muted-foreground font-medium">
                                            {r.status}
                                        </span>
                                    </div>
                                    <CardTitle className="text-base font-bold text-foreground truncate">
                                        {r.assessment?.title}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-4 pt-0">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                                        <span className="flex items-center gap-1 font-medium">
                                            <Users className="w-3.5 h-3.5 text-primary" /> {r.participants_count} Students
                                        </span>
                                        <span className="capitalize">{r.mode.replace('_', ' ')}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Link href={`/reports/${r.id}`} className="w-full">
                                            <Button variant="outline" className="w-full text-xs font-bold cursor-pointer">
                                                View Report Details
                                            </Button>
                                        </Link>
                                        <a href={`/reports/${r.id}/export-csv`} download title="Export CSV">
                                            <Button className="text-xs font-bold p-2.5 cursor-pointer shadow-xs">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </a>
                                        <Button
                                            variant="destructive"
                                            onClick={() => handleDeleteReport(r.id, r.code)}
                                            className="text-xs font-bold p-2.5 cursor-pointer"
                                            title="Delete Report"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
