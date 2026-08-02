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
            className={`flex items-center gap-0.5 p-1 rounded-xl bg-muted/80 border border-border/80 shadow-xs shrink-0 ${className}`}
            {...props}
        >
            <button
                type="button"
                onClick={() => updateAppearance('light')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    appearance === 'light'
                        ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-emerald-500/30'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Light Mode"
            >
                <Sun className="h-4 w-4" />
            </button>

            <button
                type="button"
                onClick={() => updateAppearance('dark')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    appearance === 'dark'
                        ? 'bg-emerald-950/80 text-emerald-400 shadow-xs ring-1 ring-emerald-500/40 border border-emerald-500/30'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Dark Mode"
            >
                <Moon className="h-4 w-4 text-emerald-400" />
            </button>

            <button
                type="button"
                onClick={() => updateAppearance('system')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    appearance === 'system'
                        ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-emerald-500/30'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
                title="System Mode"
            >
                <Monitor className="h-4 w-4" />
            </button>
        </div>
    );
}
