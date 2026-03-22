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
    BookOpen,
    ClipboardCheck,
    Building2,
    History,
    FileBadge,
    UserCircle,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    MoreHorizontal
} from "lucide-react";
import { useTranslations } from 'next-intl';

type MenuItem = {
    label: string;
    icon: React.ElementType;
    view: string;
};

type MenuSection = {
    title?: string;
    items: MenuItem[];
};

interface SidebarProProps {
    isCollapsed?: boolean;
    toggleCollapse?: () => void;
}

export default function SidebarPro({ isCollapsed = false, toggleCollapse }: SidebarProProps) {
    const { user, profile } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations('Sidebar');

    const currentView = searchParams.get('view') || 'dashboard';
    const roleId = profile?.role || 'participant';

    const MENUS: Record<string, MenuSection[]> = {
        instructor: [
            {
                items: [
                    { label: t('items.dashboard'), icon: LayoutDashboard, view: "dashboard" },
                    { label: t('items.trainees'), icon: Users, view: "participants" },
                    { label: t('items.notes'), icon: MessageSquare, view: "notes" },
                    { label: t('items.attendance'), icon: ClipboardCheck, view: "attendance" },
                    { label: t('items.grades'), icon: Shield, view: "results_scores" },
                    { label: t('items.documents'), icon: FileText, view: "documents" }
                ]
            }
        ],
        // Default fallback mapping for other roles to prevent catastrophic failure
        participant: [
            {
                items: [
                    { label: t('items.dashboard'), icon: LayoutDashboard, view: "dashboard" },
                    { label: t('items.my_trainings'), icon: GraduationCap, view: "my-trainings" }
                ]
            }
        ],
        org_admin: [
            {
                items: [
                    { label: t('items.overview'), icon: LayoutDashboard, view: "dashboard" },
                    { label: t('items.participants'), icon: Users, view: "participants" }
                ]
            }
        ],
        ernam_admin: [
            {
                items: [
                    { label: t('items.dashboard'), icon: LayoutDashboard, view: "dashboard" },
                    { label: t('items.users_roles'), icon: Shield, view: "users" }
                ]
            }
        ]
    };

    let menuSections = MENUS[roleId] || MENUS['participant'];

    const handleNavigation = (view: string) => {
        router.push(`/dashboard?view=${view}`);
    };

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-full bg-[#f8f9fa] dark:bg-card border-r border-transparent flex flex-col z-[40] transition-all duration-300 ease-in-out font-sans",
                isCollapsed ? "w-[80px]" : "w-[260px]"
            )}
        >
            {/* Collapse Toggle */}
            {toggleCollapse && (
                <button
                    onClick={toggleCollapse}
                    className="absolute -right-3 top-24 bg-white dark:bg-card border border-gray-200 rounded-full p-1 text-gray-500 hover:text-black shadow-sm z-50 hidden lg:flex"
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            )}

            {/* HEADER: User Profile Avatar based on the new aesthetic */}
            <div className={cn(
                "py-8 flex items-center transition-all duration-300",
                isCollapsed ? "justify-center px-0" : "px-6"
            )}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-gray-200 flex items-center justify-center relative shadow-sm border-2 border-white">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Profile" className="w-full h-full object-cover" />
                        )}
                    </div>

                    <div className={cn(
                        "transition-all duration-300 overflow-hidden whitespace-nowrap",
                        isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                    )}>
                        <h1 className="text-gray-900 dark:text-gray-100 font-bold text-sm tracking-tight leading-none mb-1 cursor-pointer">
                            {profile?.full_name || 'Justinus Lhaksana'}
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium cursor-pointer">
                            {profile?.email || 'justinusi@mail.com'}
                        </p>
                    </div>
                </div>
            </div>

            {/* NAV LINKS */}
            <div className="flex-1 overflow-y-auto px-4 space-y-2 mt-2">
                {menuSections.map((section, idx) => (
                    <div key={idx}>
                        <div className="space-y-1.5 flex flex-col">
                            {section.items.map((item) => {
                                const isActive = currentView === item.view;
                                const Icon = item.icon;

                                return (
                                    <button
                                        key={item.view}
                                        onClick={() => handleNavigation(item.view)}
                                        className={cn(
                                            "w-full group relative flex items-center rounded-2xl text-sm font-semibold transition-all duration-200 outline-none",
                                            isCollapsed ? "justify-center px-0 py-3" : "gap-4 px-4 py-3",
                                            isActive
                                                ? "bg-gray-200/60 dark:bg-white/10 text-gray-900 dark:text-white" // Active
                                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white bg-transparent" // Inactive
                                        )}
                                    >
                                        <Icon className={cn(
                                            "w-5 h-5 transition-colors shrink-0",
                                            isActive ? "text-gray-900 dark:text-white" : "text-gray-400 group-hover:text-gray-900"
                                        )} />
                                        <span className={cn(
                                            "transition-all duration-300 overflow-hidden whitespace-nowrap tracking-wide",
                                            isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                                        )}>
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* BOTTOM: Settings Link */}
            <div className="p-4 mb-4">
                <button
                    onClick={() => router.push(`/dashboard?view=settings`)}
                    className={cn(
                        "w-full flex items-center rounded-2xl text-sm font-semibold transition-all duration-200 text-gray-500 hover:text-gray-900 dark:hover:text-white",
                        isCollapsed ? "justify-center p-3" : "gap-4 px-4 py-3"
                    )}
                >
                    <Settings className="w-5 h-5 opacity-70" />
                    <div className={cn(
                        "text-left overflow-hidden transition-all duration-300",
                        isCollapsed ? "w-0 opacity-0 hidden" : "w-full opacity-100"
                    )}>
                        <p className="tracking-wide">Settings</p>
                    </div>
                </button>
            </div>
        </aside>
    );
}
