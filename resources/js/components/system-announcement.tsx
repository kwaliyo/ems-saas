import { Link, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Info, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface SystemAnnouncementData {
    enabled?: boolean;
    id?: string;
    message?: string;
    type?: 'info' | 'warning' | 'success' | 'danger';
    link_text?: string | null;
    link_url?: string | null;
}

export function SystemAnnouncement() {
    const { props } = usePage<{ announcement?: SystemAnnouncementData }>();
    const announcement = props.announcement;

    const [isDismissed, setIsDismissed] = useState(true);

    useEffect(() => {
        if (!announcement || !announcement.enabled || !announcement.id || !announcement.message) {
            setIsDismissed(true);
            return;
        }

        const storageKey = `dismissed_announcement_${announcement.id}`;
        const dismissed = localStorage.getItem(storageKey);
        setIsDismissed(Boolean(dismissed));
    }, [announcement]);

    if (isDismissed || !announcement || !announcement.enabled || !announcement.message) {
        return null;
    }

    const handleDismiss = () => {
        if (announcement.id) {
            localStorage.setItem(`dismissed_announcement_${announcement.id}`, 'true');
        }
        setIsDismissed(true);
    };

    const type = announcement.type || 'info';

    const themeStyles = {
        info: {
            container: 'bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 border-indigo-500/30 text-indigo-100',
            icon: <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />,
            badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
            btn: 'bg-indigo-500 text-white hover:bg-indigo-600',
        },
        warning: {
            container: 'bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-amber-500/30 text-amber-100',
            icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
            badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            btn: 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400',
        },
        success: {
            container: 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-emerald-500/30 text-emerald-100',
            icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
            badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
            btn: 'bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400',
        },
        danger: {
            container: 'bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-rose-500/30 text-rose-100',
            icon: <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />,
            badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
            btn: 'bg-rose-500 text-white hover:bg-rose-600',
        },
    }[type];

    return (
        <div className={`w-full border-b py-2 px-4 shadow-md transition-all relative z-40 ${themeStyles.container}`}>
            <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="hidden sm:inline-flex">{themeStyles.icon}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border shrink-0 ${themeStyles.badge}`}>
                        Announcement
                    </span>
                    <p className="truncate font-medium opacity-95">
                        {announcement.message}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {announcement.link_text && announcement.link_url && (
                        <Link
                            href={announcement.link_url}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs ${themeStyles.btn}`}
                        >
                            {announcement.link_text} →
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Dismiss Announcement"
                        aria-label="Dismiss Announcement"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
