import { useAppearance } from '@/hooks/use-appearance';
import { Monitor, Moon, Sun } from 'lucide-react';
import { HTMLAttributes } from 'react';

export default function AppearanceToggleDropdown({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <div
            className={`flex items-center gap-1 p-1 rounded-xl bg-muted/80 border border-border/80 shadow-xs ${className}`}
            {...props}
        >
            <button
                type="button"
                onClick={() => updateAppearance('light')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    appearance === 'light'
                        ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-emerald-500/30'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Light Mode"
            >
                <Sun className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Light</span>
            </button>

            <button
                type="button"
                onClick={() => updateAppearance('dark')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    appearance === 'dark'
                        ? 'bg-emerald-950/80 text-emerald-400 shadow-xs ring-1 ring-emerald-500/40 border border-emerald-500/30'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Dark Mode"
            >
                <Moon className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Dark</span>
            </button>

            <button
                type="button"
                onClick={() => updateAppearance('system')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    appearance === 'system'
                        ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-emerald-500/30'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
                title="System Mode"
            >
                <Monitor className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">System</span>
            </button>
        </div>
    );
}
