import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    BarChart3,
    BookOpen,
    FileCheck2,
    FileSpreadsheet,
    GraduationCap,
    LayoutDashboard,
    LogIn,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Academic Roster',
        href: '#',
        icon: GraduationCap,
        items: [
            {
                title: 'Courses & Modules',
                href: '/courses',
                icon: BookOpen,
            },
            {
                title: 'Students Directory',
                href: '/students',
                icon: Users,
            },
        ],
    },
    {
        title: 'Examinations',
        href: '#',
        icon: FileCheck2,
        items: [
            {
                title: 'Assessments Bank',
                href: '/assessments',
                icon: FileCheck2,
            },
            {
                title: 'Student Join Portal',
                href: '/join',
                icon: LogIn,
            },
        ],
    },
    {
        title: 'Reports & Analytics',
        href: '#',
        icon: BarChart3,
        items: [
            {
                title: 'Exam Session Reports',
                href: '/reports',
                icon: FileSpreadsheet,
            },
            {
                title: 'Analytics & Insights',
                href: '/analytics',
                icon: BarChart3,
            },
        ],
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} label="Main Portal Navigation" />
            </SidebarContent>

            <SidebarFooter>
                {footerNavItems.length > 0 && <NavFooter items={footerNavItems} className="mt-auto" />}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
