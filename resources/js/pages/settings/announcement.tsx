import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SettingsLayout from '@/layouts/settings/layout';
import { Head, useForm } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Info, Lock, Radio, Sparkles } from 'lucide-react';
import React from 'react';

interface AnnouncementData {
    id?: number;
    enabled: boolean;
    announcement_id?: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'danger';
    link_text?: string | null;
    link_url?: string | null;
}

interface Props {
    announcement: AnnouncementData;
}

export default function AnnouncementSettings({ announcement }: Props) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        enabled: announcement?.enabled ?? true,
        message: announcement?.message || '📢 System Notice: All exam sessions and real-time candidate syncing are operating at 100% capacity.',
        type: announcement?.type || 'info',
        link_text: announcement?.link_text || '',
        link_url: announcement?.link_url || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/settings/announcement');
    };

    return (
        <SettingsLayout>
            <Head title="System Announcement Settings" />

            <div className="space-y-6 max-w-4xl">
                <HeadingSmall
                    title="System-Wide Announcement Broadcast"
                    description="Broadcast platform notices, maintenance alerts, and system announcements to all users across the portal and landing page."
                />

                {/* Live Preview Section */}
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-primary animate-pulse" /> Live Broadcast Preview
                    </Label>

                    {data.enabled ? (
                        <div
                            className={`w-full border rounded-xl py-3 px-4 shadow-md transition-all ${
                                data.type === 'warning'
                                    ? 'bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-amber-500/30 text-amber-100'
                                    : data.type === 'success'
                                    ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-emerald-500/30 text-emerald-100'
                                    : data.type === 'danger'
                                    ? 'bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-rose-500/30 text-rose-100'
                                    : 'bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 border-indigo-500/30 text-indigo-100'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-primary/20 text-primary border-primary/30 shrink-0">
                                        Announcement
                                    </span>
                                    <p className="truncate font-medium opacity-95">
                                        {data.message || 'Enter your announcement message below...'}
                                    </p>
                                </div>

                                {data.link_text && (
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary text-primary-foreground shrink-0">
                                        {data.link_text} →
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-xl bg-muted/40 border border-border text-center text-xs text-muted-foreground italic">
                            Announcement banner is currently disabled. No banner will be displayed to users.
                        </div>
                    )}
                </div>

                <Card className="bg-card border-border p-6 shadow-xs text-card-foreground">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Enable Switch */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
                            <div className="space-y-0.5">
                                <Label htmlFor="enabled" className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                                    <Lock className="w-4 h-4 text-primary" /> Enable System Announcement Banner
                                </Label>
                                <p className="text-[11px] text-muted-foreground">
                                    When enabled, the announcement banner displays at the top of the portal for all logged in and guest users.
                                </p>
                            </div>
                            <input
                                id="enabled"
                                type="checkbox"
                                checked={data.enabled}
                                onChange={(e) => setData('enabled', e.target.checked)}
                                className="w-5 h-5 rounded border-input text-primary focus:ring-primary cursor-pointer shrink-0"
                            />
                        </div>

                        {/* Announcement Message */}
                        <div className="space-y-2">
                            <Label htmlFor="message" className="text-xs font-bold text-foreground">
                                Broadcast Message <span className="text-rose-500">*</span>
                            </Label>
                            <Textarea
                                id="message"
                                rows={3}
                                value={data.message}
                                onChange={(e) => setData('message', e.target.value)}
                                placeholder="Enter announcement text to broadcast..."
                                className="bg-background border-input text-foreground font-medium text-xs"
                                maxLength={500}
                                required
                            />
                            {errors.message && <p className="text-xs text-rose-500 font-semibold">{errors.message}</p>}
                            <div className="text-[10px] text-muted-foreground text-right">{data.message.length} / 500 characters</div>
                        </div>

                        {/* Announcement Style / Theme Variant */}
                        <div className="space-y-3">
                            <Label className="text-xs font-bold text-foreground">
                                Select Theme Style
                            </Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { key: 'info', label: 'Info (Indigo)', icon: <Info className="w-4 h-4 text-indigo-400" /> },
                                    { key: 'warning', label: 'Warning (Amber)', icon: <AlertTriangle className="w-4 h-4 text-amber-400" /> },
                                    { key: 'success', label: 'Success (Emerald)', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
                                    { key: 'danger', label: 'Critical (Rose)', icon: <AlertTriangle className="w-4 h-4 text-rose-400" /> },
                                ].map((variant) => (
                                    <button
                                        key={variant.key}
                                        type="button"
                                        onClick={() => setData('type', variant.key as any)}
                                        className={`p-3 rounded-xl border text-left space-y-1 transition-all cursor-pointer ${
                                            data.type === variant.key
                                                ? 'bg-primary/10 border-primary text-primary ring-1 ring-primary font-bold shadow-xs'
                                                : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 text-xs font-bold">
                                            {variant.icon}
                                            <span>{variant.label}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Optional Action Button Link */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="link_text" className="text-xs font-bold text-foreground">
                                    Action Button Text (Optional)
                                </Label>
                                <Input
                                    id="link_text"
                                    type="text"
                                    value={data.link_text}
                                    onChange={(e) => setData('link_text', e.target.value)}
                                    placeholder="e.g. View Upgrade Details"
                                    className="bg-background border-input text-foreground text-xs"
                                />
                                {errors.link_text && <p className="text-xs text-rose-500 font-semibold">{errors.link_text}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="link_url" className="text-xs font-bold text-foreground">
                                    Action Button URL / Path (Optional)
                                </Label>
                                <Input
                                    id="link_url"
                                    type="text"
                                    value={data.link_url}
                                    onChange={(e) => setData('link_url', e.target.value)}
                                    placeholder="e.g. /settings/billing or /#pricing"
                                    className="bg-background border-input text-foreground text-xs"
                                />
                                {errors.link_url && <p className="text-xs text-rose-500 font-semibold">{errors.link_url}</p>}
                            </div>
                        </div>

                        {/* Submit Action */}
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                            {recentlySuccessful ? (
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4" /> Announcement Broadcast Updated!
                                </span>
                            ) : (
                                <span className="text-[11px] text-muted-foreground">
                                    Updating the broadcast generates a new announcement ID so all users receive the update.
                                </span>
                            )}

                            <Button
                                type="submit"
                                disabled={processing}
                                className="font-bold gap-2 cursor-pointer shadow-md"
                            >
                                <Sparkles className="w-4 h-4" /> Broadcast Announcement
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </SettingsLayout>
    );
}
