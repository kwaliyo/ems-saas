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
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    BookOpen,
    CreditCard,
    FileCheck2,
    FileSpreadsheet,
    GraduationCap,
    LayoutDashboard,
    LogIn,
    Radio,
    Shield,
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

const adminNavItems: NavItem[] = [
    {
        title: 'Super Admin Control',
        href: '#',
        icon: Shield,
        items: [
            {
                title: 'Platform Dashboard',
                href: '/admin/dashboard',
                icon: Activity,
            },
            {
                title: 'Instructors Directory',
                href: '/admin/users',
                icon: Users,
            },
            {
                title: 'Global Live Rooms',
                href: '/admin/rooms',
                icon: Radio,
            },
            {
                title: 'Subscriptions & MRR',
                href: '/admin/subscriptions',
                icon: CreditCard,
            },
        ],
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const page = usePage<SharedData>();
    const isSuperAdmin = page.props.auth?.user?.role === 'super_admin';

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
                {isSuperAdmin && (
                    <NavMain items={adminNavItems} label="Platform Super Admin" />
                )}
            </SidebarContent>

            <SidebarFooter>
                {footerNavItems.length > 0 && <NavFooter items={footerNavItems} className="mt-auto" />}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
