import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-2.5">
            <div className="flex aspect-square size-8.5 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20">
                <AppLogoIcon className="size-5 text-white" />
            </div>
            <div className="grid flex-1 text-left">
                <span className="truncate leading-none font-black text-foreground text-base tracking-tight flex items-center gap-1">
                    K<span className="text-indigo-600 dark:text-indigo-400 font-extrabold">-EMS</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-extrabold tracking-wider uppercase mt-0.5">
                    Exam Management System
                </span>
            </div>
        </div>
    );
}
