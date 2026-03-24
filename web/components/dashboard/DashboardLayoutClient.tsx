"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import SidebarPro from "@/components/SidebarPro";
import { useAuth } from '@/components/providers/AuthProvider';
import { Search, Bell } from "lucide-react";
import ImpersonationBanner from './admin/ImpersonationBanner';
import { cn } from "@/lib/utils";

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

    // ─── BEFORE HYDRATION: render nothing except children to avoid SSR flash ───
    // This prevents the sidebar from rendering during SSR where we have no role info.
    if (!mounted) {
        return <div className="min-h-screen">{children}</div>;
    }

    // Normalize role to match how the rest of the app resolves admins
    const roleId = (() => {
        const raw = profile?.role || 'participant';
        if (raw === 'org_admin' || raw === 'ernam_admin' || raw === 'admin') return 'admin';
        if (raw === 'instructor' || raw === 'trainer') return 'instructor';
        return 'participant';
    })();

    // ─── ADMIN & PARTICIPANT: Full-screen, zero chrome ─────────────────────────
    // This premium chromeless view is reserved for admins and redesigned trainee views.
    if (roleId === 'admin' || roleId === 'participant') {
        const isImpersonating = !!impersonator;
        return (
            <div className={cn("min-h-screen", isImpersonating && "pt-[56px]")}>
                <ImpersonationBanner />
                {children}
            </div>
        );
    }

    // ─── Non-admin roles: standard sidebar + top-bar layout ───────────────────
    const isImpersonating = !!impersonator;

    return (
        <div className={cn(
            "min-h-screen bg-surface-mid transition-colors duration-300",
            isImpersonating && "pt-[56px]"
        )}>
            <ImpersonationBanner />
            <SidebarPro
                isCollapsed={isCollapsed}
                toggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />
            <main
                className={`min-h-screen transition-all duration-300 ease-in-out flex flex-col ${
                    isCollapsed ? 'ml-[80px]' : 'ml-[260px]'
                }`}
            >
                {/* Premium Top Bar */}
                <div className="h-[80px] px-8 flex items-center justify-between shrink-0 bg-surface-mid border-b border-slate-100/80">
                    <div className="flex items-center gap-4">
                        {/* Brand pill */}
                        <div className="flex items-center gap-2.5 bg-white pl-2 pr-4 py-2 rounded-2xl shadow-sm border border-slate-100 shrink-0">
                            <img src="/logos/asecna-logo.png" alt="ASECNA" className="w-7 h-7 object-contain rounded-xl" />
                            <span className="text-sm font-black tracking-tight text-slate-800">ASECNA</span>
                        </div>
                        {/* Search */}
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search anything…"
                                className="w-full pl-11 pr-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-transparent transition-all font-medium text-slate-700 placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                    {/* Right side */}
                    <div className="flex items-center gap-4">
                        <button className="relative text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-xl hover:bg-slate-100">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                        </button>
                        <div
                            onClick={() => router.push('/dashboard?view=profile')}
                            className="flex items-center gap-2.5 bg-white pl-2 pr-4 py-2 rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all"
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
                </div>

                <div className="flex-1 p-8 pt-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
