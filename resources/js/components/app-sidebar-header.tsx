import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType, type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { LogOut, ShieldAlert } from 'lucide-react';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const page = usePage<SharedData>();
    const isImpersonating = Boolean(page.props.auth?.is_impersonating);
    const user = page.props.auth?.user;

    const handleStopImpersonating = () => {
        router.post('/admin/stop-impersonating');
    };

    return (
        <>
            {isImpersonating && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 px-4 py-2 text-xs font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span>Impersonating Instructor: <strong>{user?.name}</strong> ({user?.email})</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleStopImpersonating}
                        className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 font-extrabold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                    >
                        <LogOut className="w-3 h-3" /> Exit Impersonation
                    </button>
                </div>
            )}
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
                <div className="flex items-center gap-3">
                    <AppearanceToggleDropdown />
                </div>
            </header>
        </>
    );
}
