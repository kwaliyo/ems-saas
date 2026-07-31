import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { resolveUrl } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

function NavGroupItem({ item }: { item: NavItem }) {
    const page = usePage();
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    // Check if any sub-item is currently active
    const isChildActive = (item.items || []).some(
        (sub) => sub.href && sub.href !== '#' && page.url.startsWith(resolveUrl(sub.href))
    );

    const [isOpen, setIsOpen] = useState<boolean>(isChildActive || true);

    // COLLAPSED SIDEBAR MODE (Icon Only)
    if (isCollapsed) {
        // Group Item with Sub-Items in Collapsed Sidebar
        if (item.items && item.items.length > 0) {
            return (
                <SidebarMenuItem className="flex justify-center">
                    <DropdownMenu>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className={`size-10 flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
                                            isChildActive
                                                ? 'border-primary/40 bg-primary/15 text-primary shadow-xs'
                                                : 'border-border/80 bg-card hover:bg-muted text-foreground'
                                        }`}
                                    >
                                        {item.icon && <item.icon className="w-5 h-5 shrink-0" />}
                                    </button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="right" align="center">
                                {item.title}
                            </TooltipContent>
                        </Tooltip>

                        <DropdownMenuContent side="right" align="start" className="w-52 p-1.5 rounded-xl border border-border/80 shadow-lg">
                            <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
                                {item.title}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {item.items.map((sub) => {
                                if (!sub.href) return null;
                                const isActive = sub.href !== '#' && page.url.startsWith(resolveUrl(sub.href));

                                return (
                                    <DropdownMenuItem key={sub.title} asChild className="rounded-lg cursor-pointer">
                                        <Link
                                            href={sub.href}
                                            prefetch
                                            className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-semibold ${
                                                isActive
                                                    ? 'bg-primary/15 text-primary font-extrabold'
                                                    : 'text-foreground hover:bg-primary/10 hover:text-primary'
                                            }`}
                                        >
                                            {sub.icon && <sub.icon className="w-4 h-4 shrink-0" />}
                                            <span>{sub.title}</span>
                                        </Link>
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            );
        }

        // Single Item in Collapsed Sidebar
        const isSingleActive = item.href && item.href !== '#' ? page.url.startsWith(resolveUrl(item.href)) : false;

        return (
            <SidebarMenuItem className="flex justify-center">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link
                            href={item.href || '#'}
                            prefetch
                            className={`size-10 flex items-center justify-center rounded-xl border transition-all ${
                                isSingleActive
                                    ? 'border-primary/40 bg-primary/15 text-primary font-extrabold shadow-xs'
                                    : 'border-transparent text-foreground hover:bg-primary/10 hover:text-primary'
                            }`}
                        >
                            {item.icon && <item.icon className="w-5 h-5 shrink-0" />}
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center">
                        {item.title}
                    </TooltipContent>
                </Tooltip>
            </SidebarMenuItem>
        );
    }

    // EXPANDED SIDEBAR MODE
    // Group Item with Sub-Items & Emerald Line
    if (item.items && item.items.length > 0) {
        return (
            <SidebarMenuItem className="space-y-1">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        isChildActive
                            ? 'border-primary/40 bg-primary/10 text-primary shadow-xs'
                            : 'border-border/80 bg-card hover:bg-muted/60 text-foreground'
                    }`}
                >
                    <div className="flex items-center gap-2.5">
                        {item.icon && (
                            <item.icon className={`w-4 h-4 shrink-0 ${isChildActive ? 'text-primary' : 'text-primary/80'}`} />
                        )}
                        <span>{item.title}</span>
                    </div>
                    {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200" />
                    )}
                </button>

                {isOpen && (
                    <div className="ml-3.5 pl-3 border-l-2 border-primary space-y-1 py-1 transition-all duration-200">
                        {item.items.map((sub) => {
                            if (!sub.href) return null;
                            const isActive = sub.href !== '#' && page.url.startsWith(resolveUrl(sub.href));

                            return (
                                <Link
                                    key={sub.title}
                                    href={sub.href}
                                    prefetch
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        isActive
                                            ? 'bg-primary/15 text-primary font-extrabold shadow-2xs'
                                            : 'text-foreground/80 hover:text-primary hover:bg-primary/10'
                                    }`}
                                >
                                    {sub.icon && <sub.icon className="w-3.5 h-3.5 shrink-0" />}
                                    <span>{sub.title}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </SidebarMenuItem>
        );
    }

    // Single Item in Expanded Sidebar
    const isSingleActive = item.href && item.href !== '#' ? page.url.startsWith(resolveUrl(item.href)) : false;

    return (
        <SidebarMenuItem>
            <Link
                href={item.href || '#'}
                prefetch
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                    isSingleActive
                        ? 'border-primary/40 bg-primary/15 text-primary font-extrabold shadow-xs'
                        : 'border-transparent text-foreground hover:bg-primary/10 hover:text-primary'
                }`}
            >
                {item.icon && (
                    <item.icon className={`w-4 h-4 shrink-0 ${isSingleActive ? 'text-primary' : 'text-primary/80'}`} />
                )}
                <span>{item.title}</span>
            </Link>
        </SidebarMenuItem>
    );
}

export function NavMain({
    items = [],
    label = 'Platform',
}: {
    items: NavItem[];
    label?: string;
}) {
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    return (
        <SidebarGroup className={isCollapsed ? 'px-1 py-1' : 'px-2 py-1'}>
            {!isCollapsed && (
                <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    {label}
                </SidebarGroupLabel>
            )}
            <SidebarMenu className={isCollapsed ? 'space-y-2 items-center' : 'space-y-1.5'}>
                {items.map((item) => (
                    <NavGroupItem key={item.title} item={item} />
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
