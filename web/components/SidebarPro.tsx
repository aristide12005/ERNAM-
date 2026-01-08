"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    GraduationCap,
    Users,
    FileText,
    Settings,
    Shield,
    LogOut,
    BookOpen,
    ClipboardCheck,
    Building2,
    History,
    FileBadge,
    UserCircle,
    ChevronLeft,
    ChevronRight,
    MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useTranslations } from 'next-intl';

// --- Types ---
type MenuItem = {
    label: string;
    icon: React.ElementType;
    view: string; // The query param value, e.g., 'dashboard', 'training'
};

type MenuSection = {
    title?: string; // Optional section header
    items: MenuItem[];
};

interface SidebarProProps {
    isCollapsed?: boolean;
    toggleCollapse?: () => void;
}

export default function SidebarPro({ isCollapsed = false, toggleCollapse }: SidebarProProps) {
    const { user, profile, signOut } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations('Sidebar'); // Hook into 'Sidebar' namespace

    // Default to 'dashboard' if no view param
    const currentView = searchParams.get('view') || 'dashboard';

    // Fallback menu if role is missing or loading
    const roleId = profile?.role || 'participant';

    // Dynamic Menu Definition inside Component allows access to `t`
    const MENUS: Record<string, MenuSection[]> = {
        ernam_admin: [
            {
                title: t('sections.overview'),
                items: [
                    { label: t('items.dashboard'), icon: LayoutDashboard, view: "dashboard" }
                ]
            },
            {
                title: t('sections.training_operations'),
                items: [
                    { label: t('items.standards'), icon: BookOpen, view: "standards" },
                    { label: t('items.sessions'), icon: GraduationCap, view: "sessions" },
                    { label: t('items.training_requests'), icon: MessageSquare, view: "training_requests" },
                    { label: t('items.instructors'), icon: Users, view: "instructors" },
                    { label: t('items.participants'), icon: UserCircle, view: "participants" },
                ]
            },
            {
                title: t('sections.certification'),
                items: [
                    { label: t('items.certificates'), icon: FileBadge, view: "certificates" },
                    { label: t('items.validity_tracking'), icon: History, view: "validity" },
                ]
            },
            {
                title: t('sections.administration'),
                items: [
                    { label: t('items.organizations'), icon: Building2, view: "organizations" },
                    { label: t('items.users_roles'), icon: Shield, view: "users" },
                    { label: t('items.system_logs'), icon: FileText, view: "logs" },
                    { label: t('items.settings'), icon: Settings, view: "settings" },
                ]
            }
        ],
        instructor: [
            {
                title: t('sections.overview'),
                items: [
                    { label: t('items.overview'), icon: LayoutDashboard, view: "dashboard" }
                ]
            },
            {
                title: t('sections.teaching'),
                items: [
                    { label: t('items.my_sessions'), icon: GraduationCap, view: "sessions" },
                    { label: t('items.participants'), icon: Users, view: "participants" },
                    { label: t('items.assessments'), icon: ClipboardCheck, view: "assessments" },
                    { label: t('items.documents'), icon: FileText, view: "documents" },
                    { label: t('items.messages'), icon: UserCircle, view: "messages" },
                ]
            },
            {
                title: t('sections.account'),
                items: [
                    { label: t('items.profile_settings'), icon: Settings, view: "settings" }
                ]
            }
        ],
        participant: [
            {
                title: t('sections.overview'),
                items: [
                    { label: t('items.dashboard'), icon: LayoutDashboard, view: "dashboard" }
                ]
            },
            {
                title: t('sections.learning'),
                items: [
                    { label: t('items.my_trainings'), icon: GraduationCap, view: "my-trainings" },
                    { label: t('items.session_details'), icon: BookOpen, view: "session-details" }, // Maybe conditional
                    { label: t('items.my_schedule'), icon: History, view: "schedule" },
                    { label: t('items.documents'), icon: FileText, view: "documents" },
                    { label: t('items.assessments'), icon: ClipboardCheck, view: "assessments" },
                ]
            },
            {
                title: t('sections.records'),
                items: [
                    { label: t('items.certificates'), icon: FileBadge, view: "certificates" }
                ]
            },
            {
                title: t('sections.account'),
                items: [
                    { label: t('items.profile_settings'), icon: Settings, view: "settings" }
                ]
            }
        ],
        org_admin: [
            {
                title: t('sections.overview'),
                items: [
                    { label: t('items.overview'), icon: LayoutDashboard, view: "dashboard" }
                ]
            },
            {
                title: t('sections.management'),
                items: [
                    { label: t('items.participants'), icon: Users, view: "participants" },
                    { label: t('items.instructors'), icon: GraduationCap, view: "instructors" }, // Nominations
                    { label: t('items.training_requests'), icon: BookOpen, view: "training-requests" },
                ]
            },
            {
                title: t('sections.monitoring'),
                items: [
                    { label: t('items.sessions'), icon: LayoutDashboard, view: "sessions" }, // Monitoring
                    { label: t('items.certificates'), icon: FileBadge, view: "certificates" },
                ]
            },
            {
                title: t('sections.organization'),
                items: [
                    { label: t('items.org_profile'), icon: Building2, view: "organization" },
                    { label: t('items.settings'), icon: Settings, view: "settings" },
                ]
            }
        ]
    };

    const [hasActiveEnrollment, setHasActiveEnrollment] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        const checkEnrollment = async () => {
            if (roleId === 'participant' && user?.id) {
                // Check for any enrollment in planned or active sessions
                try {
                    // We need to import supabase here or use a helper
                    // Since SidebarPro is a component, we can import @/lib/supabaseClient
                    const { supabase } = await import('@/lib/supabaseClient');
                    const { count } = await supabase
                        .from('session_participants')
                        .select('*', { count: 'exact', head: true })
                        .eq('participant_id', user.id)
                        .in('attendance_status', ['enrolled', 'attended', 'certified']); // broadly check for any valid activity

                    setHasActiveEnrollment((count || 0) > 0);
                } catch (e) {
                    console.error("Error checking enrollment", e);
                    setHasActiveEnrollment(false);
                }
            } else {
                setHasActiveEnrollment(true); // Non-participants always have full access (or handled by their own roles)
            }
        };
        checkEnrollment();
    }, [roleId, user?.id]);

    // Definition of Restricted Menu for Dormant Participants
    const RESTRICTED_PARTICIPANT_MENU: MenuSection[] = [
        {
            items: [
                { label: t('items.profile'), icon: UserCircle, view: "profile" }, // Was Settings, user asked for Profile/Notifs. Profile usually maps to settings or profile view.
                { label: t('items.settings'), icon: Settings, view: "settings" },
            ]
        }
    ];

    let menuSections = MENUS[roleId] || MENUS['participant'];

    // Apply Restriction
    if (roleId === 'participant' && hasActiveEnrollment === false) {
        menuSections = RESTRICTED_PARTICIPANT_MENU;
    }

    const handleNavigation = (view: string) => {
        router.push(`/dashboard?view=${view}`);
    };

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-full bg-card border-r border-border flex flex-col z-[40] shadow-[1px_0_20px_rgba(0,0,0,0.02)] print:hidden transition-all duration-300 ease-in-out",
                isCollapsed ? "w-[80px]" : "w-[270px]"
            )}
        >
            {/* Collapse Toggle Button (Floating) */}
            {toggleCollapse && (
                <button
                    onClick={toggleCollapse}
                    className="absolute -right-3 top-24 bg-card border border-border rounded-full p-1 text-muted-foreground hover:text-primary hover:border-primary transition-all shadow-sm z-50 hidden lg:flex"
                >
                    {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>
            )}

            {/* 1. Header (Logo + Role) */}
            <div className={cn(
                "h-20 flex items-center border-b border-border/50 transition-all duration-300",
                isCollapsed ? "justify-center px-0" : "px-6"
            )}>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-600/20 shrink-0">
                        E
                    </div>

                    <div className={cn(
                        "transition-all duration-300 overflow-hidden whitespace-nowrap",
                        isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                    )}>
                        <h1 className="text-foreground font-bold text-sm tracking-tight leading-none mb-1">
                            ERNAM
                        </h1>
                        <p className="text-[10px] text-muted-foreground font-bold text-opacity-80 uppercase tracking-widest pl-0.5">
                            {/* Direct Translation for Role Badge */}
                            {t(`role.${roleId}`)}
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Navigation List */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {menuSections.map((section, idx) => (
                    <div key={idx} className="space-y-2">
                        {section.title && !isCollapsed && (
                            <h3 className="px-3 text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-3 transition-opacity duration-300">
                                {section.title}
                            </h3>
                        )}
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = currentView === item.view;
                                const Icon = item.icon;

                                return (
                                    <button
                                        key={item.view}
                                        onClick={() => handleNavigation(item.view)}
                                        title={isCollapsed ? item.label : undefined}
                                        className={cn(
                                            "w-full group relative flex items-center rounded-lg text-sm font-medium transition-all duration-200 outline-none",
                                            isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5",
                                            isActive
                                                ? "bg-primary/10 text-primary" // Active
                                                : "text-muted-foreground hover:bg-accent hover:text-foreground" // Inactive
                                        )}
                                    >
                                        {isActive && (
                                            <div
                                                className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                                            />
                                        )}

                                        <Icon className={cn(
                                            "w-5 h-5 transition-colors shrink-0",
                                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                        )} />

                                        <span className={cn(
                                            "transition-all duration-300 overflow-hidden whitespace-nowrap",
                                            isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                                        )}>
                                            {item.label}
                                        </span>

                                        {/* Chevron for active state visual balance (Full mode only) */}
                                        {isActive && !isCollapsed && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. Footer (User Profile Summary) */}
            <div className="p-4 border-t border-border">
                <button
                    onClick={() => router.push(`/dashboard?view=profile`)}
                    className={cn(
                        "w-full flex items-center rounded-xl border border-border bg-card shadow-sm hover:border-primary/30 transition-all group",
                        isCollapsed ? "justify-center p-2" : "gap-3 p-2"
                    )}
                >
                    <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground shrink-0">
                        {profile?.full_name?.charAt(0) || 'U'}
                    </div>

                    <div className={cn(
                        "text-left overflow-hidden transition-all duration-300",
                        isCollapsed ? "w-0 opacity-0 hidden" : "w-full opacity-100"
                    )}>
                        <p className="text-xs font-bold text-foreground truncate">
                            {profile?.full_name || 'User'}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                            {t('view_profile')}
                        </p>
                    </div>
                </button>
            </div>
        </aside>
    );
}
