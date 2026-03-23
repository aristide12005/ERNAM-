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
    Clock,
    ChevronRight,
    MessageSquare,
    MoreHorizontal
} from "lucide-react";


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
    const { user, profile, impersonator } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentView = searchParams.get('view') || 'dashboard';
    const roleId = (() => {
        const raw = profile?.role || 'trainee';
        if (raw === 'instructor') return 'trainer';
        if (raw === 'participant') return 'trainee';
        if (raw === 'org_admin' || raw === 'ernam_admin' || raw === 'admin') return 'admin';
        return raw;
    })();

    // Admin users have their own full-screen UI — never show this sidebar for them
    if (roleId === 'admin') return null;

    const MENUS: Record<string, MenuSection[]> = {
        trainer: [
            {
                items: [
                    { label: "Home", icon: LayoutDashboard, view: "dashboard" },
                    { label: "Courses", icon: GraduationCap, view: "courses" },
                    { label: "Trainees", icon: Users, view: "trainees" },
                    { label: "Notes", icon: MessageSquare, view: "notes" },
                    { label: "Attendance", icon: ClipboardCheck, view: "attendance" },
                    { label: "Results & Scores", icon: Shield, view: "results_scores" },
                    { label: "Documents", icon: FileText, view: "documents" }
                ]
            }
        ],
        // Default fallback mapping for other roles to prevent catastrophic failure
        trainee: [
            {
                items: [
                    { label: "Home", icon: LayoutDashboard, view: "dashboard" },
                    { label: "Courses", icon: GraduationCap, view: "courses" },
                    { label: "Documents", icon: FileText, view: "documents" },
                    { label: "My Schedule", icon: Clock, view: "schedule" }
                ]
            }
        ],
        admin: [
            {
                items: [
                    { label: "Home", icon: LayoutDashboard, view: "dashboard" },
                    { label: "Trainers", icon: ClipboardCheck, view: "trainers" },
                    { label: "Trainees", icon: Users, view: "trainees" },
                    { label: "Users & Roles", icon: Shield, view: "users" }
                ]
            }
        ]
    };

    let menuSections = MENUS[roleId] || MENUS['trainee'];

    const handleNavigation = (view: string) => {
        router.push(`/dashboard?view=${view}`);
    };

    const isImpersonating = !!impersonator;

    return (
        <aside
            className={cn(
                "fixed left-0 bg-[#F5F6F7] dark:bg-card border-r border-transparent flex flex-col z-[40] transition-all duration-300 ease-in-out font-sans",
                isCollapsed ? "w-[80px]" : "w-[260px]",
                isImpersonating ? "top-[56px] h-[calc(100vh-56px)]" : "top-0 h-full"
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

            {/* HEADER: Logo Area as in Mockup (Simplified initials or small icon) */}
            <div className={cn(
                "py-10 flex items-center transition-all duration-300",
                isCollapsed ? "justify-center px-0" : "px-8"
            )}>
                <div className={cn(
                    "flex items-center gap-2.5 bg-white pl-1.5 py-1.5 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 shrink-0 transition-all",
                    isCollapsed ? "pr-1.5" : "pr-4"
                )}>
                    <img src="/logos/ernam-logo.png" alt="ERNAM" className="w-8 h-8 object-contain rounded-full" />
                    {!isCollapsed && (
                        <span className="text-sm font-black tracking-tight text-gray-800 uppercase">Ernam</span>
                    )}
                </div>
            </div>

            {/* NAV LINKS */}
            <div className="flex-1 overflow-y-auto px-4 space-y-2 mt-4">
                {menuSections.map((section, idx) => (
                    <div key={idx}>
                        <div className="space-y-1 flex flex-col">
                            {section.items.map((item) => {
                                const isActive = currentView === item.view;
                                const Icon = item.icon;

                                return (
                                    <button
                                        key={item.view}
                                        onClick={() => handleNavigation(item.view)}
                                        className={cn(
                                            "w-full group relative flex items-center rounded-2xl text-sm font-bold transition-all duration-200 border-none",
                                            isCollapsed ? "justify-center px-0 py-3.5" : "gap-4 px-6 py-3.5",
                                            isActive
                                                ? "bg-black text-white shadow-lg" // Dark Pill for Active
                                                : "text-[#8E9296] hover:text-black bg-transparent" // Inactive
                                        )}
                                    >
                                        <Icon className={cn(
                                            "w-5 h-5 transition-colors shrink-0",
                                            isActive ? "text-white" : "text-[#8E9296] group-hover:text-black"
                                        )} />
                                        <span className={cn(
                                            "transition-all duration-300 overflow-hidden whitespace-nowrap tracking-tight",
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
            <div className="p-4 mb-6">
                <button
                    onClick={() => router.push(`/dashboard?view=settings`)}
                    className={cn(
                        "w-full flex items-center rounded-2xl text-sm font-bold transition-all duration-200 text-[#8E9296] hover:text-black",
                        isCollapsed ? "justify-center p-3.5" : "gap-4 px-6 py-3.5"
                    )}
                >
                    <Settings className="w-5 h-5 opacity-70" />
                    {!isCollapsed && <span className="tracking-tight">Settings</span>}
                </button>
            </div>
        </aside>
    );
}
