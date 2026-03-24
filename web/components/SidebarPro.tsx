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
                "fixed left-0 bg-white border-r border-slate-100 flex flex-col z-[40] transition-all duration-300 ease-in-out font-sans",
                isCollapsed ? "w-[80px]" : "w-[260px]",
                isImpersonating ? "top-[56px] h-[calc(100vh-56px)]" : "top-0 h-full"
            )}
        >
            {/* Collapse Toggle */}
            {toggleCollapse && (
                <button
                    onClick={toggleCollapse}
                    className="absolute -right-3 top-24 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-slate-700 hover:border-slate-300 shadow-md z-50 hidden lg:flex transition-all"
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            )}

            {/* HEADER: Logo */}
            <div className={cn(
                "py-8 flex items-center transition-all duration-300",
                isCollapsed ? "justify-center px-0" : "px-6"
            )}>
                <div className={cn(
                    "flex items-center gap-3 shrink-0 transition-all",
                )}>
                    <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
                        <img src="/logos/ernam-logo.png" alt="ERNAM" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <span className="text-sm font-black tracking-tight text-slate-900 uppercase leading-tight">Ernam</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Portal</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Separator */}
            {!isCollapsed && <div className="mx-6 h-px bg-slate-100 mb-4" />}

            {/* NAV LINKS */}
            <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
                {!isCollapsed && (
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 pb-2">Navigation</p>
                )}
                {menuSections.map((section, idx) => (
                    <div key={idx}>
                        <div className="space-y-0.5 flex flex-col">
                            {section.items.map((item) => {
                                const isActive = currentView === item.view;
                                const Icon = item.icon;

                                return (
                                    <button
                                        key={item.view}
                                        onClick={() => handleNavigation(item.view)}
                                        className={cn(
                                            "w-full group relative flex items-center rounded-2xl text-sm font-bold transition-all duration-200 border-none cursor-pointer",
                                            isCollapsed ? "justify-center px-0 py-3.5" : "gap-3.5 px-4 py-3",
                                            isActive
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                        )}
                                    >
                                        <Icon className={cn(
                                            "w-[18px] h-[18px] transition-colors shrink-0",
                                            isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                                        )} />
                                        <span className={cn(
                                            "transition-all duration-300 overflow-hidden whitespace-nowrap tracking-tight leading-none",
                                            isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                                        )}>
                                            {item.label}
                                        </span>
                                        {isActive && !isCollapsed && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* BOTTOM: Settings */}
            <div className="p-3 pt-0 mb-4">
                <div className="h-px bg-slate-100 mb-3" />
                <button
                    onClick={() => router.push(`/dashboard?view=settings`)}
                    className={cn(
                        "w-full flex items-center rounded-2xl text-sm font-bold transition-all text-slate-400 hover:text-slate-700 hover:bg-slate-50",
                        isCollapsed ? "justify-center p-3.5" : "gap-3.5 px-4 py-3"
                    )}
                >
                    <Settings className="w-[18px] h-[18px]" />
                    {!isCollapsed && <span className="tracking-tight">Settings</span>}
                </button>
            </div>
        </aside>
    );
}
