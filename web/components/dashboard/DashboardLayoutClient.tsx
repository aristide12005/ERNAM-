"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import SidebarPro from "@/components/SidebarPro";
import { useAuth } from '@/components/providers/AuthProvider';
import { Search, Bell } from "lucide-react";
import ImpersonationBanner from './admin/ImpersonationBanner';
import { cn } from "@/lib/utils";

const TOPBAR_H = 72; // px — single source of truth

export default function DashboardLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const { profile, impersonator } = useAuth();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (window.innerWidth < 1024) {
            setIsCollapsed(true);
        }
        const onResize = () => {
            if (window.innerWidth < 1024) setIsCollapsed(true);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    if (!mounted) {
        return <div className="min-h-screen">{children}</div>;
    }

    const roleId = (() => {
        const raw = profile?.role || 'participant';
        if (raw === 'org_admin' || raw === 'ernam_admin' || raw === 'admin') return 'admin';
        if (raw === 'instructor' || raw === 'trainer') return 'instructor';
        return 'participant';
    })();

    // Admin & participant: full-screen, zero chrome
    if (roleId === 'admin' || roleId === 'participant') {
        const isImpersonating = !!impersonator;
        return (
            <div className={cn("min-h-screen", isImpersonating && "pt-[56px]")}>
                <ImpersonationBanner />
                {children}
            </div>
        );
    }

    const isImpersonating = !!impersonator;
    const sidebarW = isCollapsed ? 80 : 260;

    return (
        <div className={cn("min-h-screen bg-slate-50", isImpersonating && "pt-[56px]")}>
            <ImpersonationBanner />

            {/* ═══════════════════════════════════════════════════════
                FULL-WIDTH TOPBAR — fixed, spans the entire viewport
                width so brand logos stay visible at all times,
                independent of sidebar collapsed/expanded state.
            ════════════════════════════════════════════════════════ */}
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100",
                    "flex items-center gap-4 px-6",
                    isImpersonating ? "top-[56px]" : "top-0"
                )}
                style={{ height: TOPBAR_H }}
            >
                {/* ── Brand Pill ───────────────────────────── */}
                <div className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200 rounded-full pr-4 pl-1.5 py-1.5 shadow-sm cursor-pointer group shrink-0">
                    <div className="flex items-center -space-x-2 shrink-0">
                        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center p-0.5 border-2 border-[#12388D] relative z-10 group-hover:-translate-x-1 transition-transform duration-200">
                            <img src="/logos/asecna-logo.png" alt="ASECNA" className="w-full h-full object-contain rounded-full" />
                        </div>
                        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center p-0.5 border-2 border-[#12388D] relative z-20 shadow-sm group-hover:translate-x-1 transition-transform duration-200">
                            <img src="/logos/ernam-logo.png" alt="ERNAM" className="w-full h-full object-contain rounded-full" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-900 font-black text-sm leading-tight tracking-wide">ASECNA · ERNAM</span>
                        <span className="text-blue-600 font-bold text-[10px] leading-tight flex items-center gap-1.5 uppercase tracking-widest">
                            Digital Twin <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        </span>
                    </div>
                </div>

                {/* ── Search ──────────────────────────────── */}
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search anything…"
                        className="w-full pl-11 pr-5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-transparent transition-all font-medium text-slate-700 placeholder:text-slate-400"
                    />
                </div>

                {/* ── Spacer ─────────────────────────────── */}
                <div className="flex-1" />

                {/* ── Right controls ─────────────────────── */}
                <div className="flex items-center gap-3 shrink-0">
                    <button className="relative text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-xl hover:bg-slate-100">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                    </button>
                    <div
                        onClick={() => router.push('/dashboard?view=profile')}
                        className="flex items-center gap-2.5 bg-slate-50 pl-2 pr-4 py-2 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white hover:shadow-sm transition-all"
                    >
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="w-7 h-7 object-cover rounded-xl" />
                        ) : (
                            <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center text-white text-[10px] font-black uppercase">
                                {profile?.full_name?.charAt(0) || 'U'}
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-sm font-black tracking-tight text-slate-900 leading-tight">
                                {profile?.full_name || 'My Profile'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                                {profile?.role || 'User'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════
                SIDEBAR — starts below the topbar at top-[72px]
            ════════════════════════════════════════════════════════ */}
            <SidebarPro
                isCollapsed={isCollapsed}
                toggleCollapse={() => setIsCollapsed(!isCollapsed)}
                topOffset={isImpersonating ? TOPBAR_H + 56 : TOPBAR_H}
            />

            {/* ═══════════════════════════════════════════════════════
                MAIN CONTENT — offset by topbar height + sidebar width
            ════════════════════════════════════════════════════════ */}
            <main
                style={{
                    paddingTop: TOPBAR_H,
                    marginLeft: sidebarW,
                }}
                className="min-h-screen transition-all duration-300 ease-in-out"
            >
                <div className="p-8 pt-7">
                    {children}
                </div>
            </main>
        </div>
    );
}
