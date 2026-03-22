"use client";

import React, { useState, useEffect } from "react";
import SidebarPro from "@/components/SidebarPro";
import { useAuth } from '@/components/providers/AuthProvider';
import { Search, Bell } from "lucide-react";
import ImpersonationBanner from './admin/ImpersonationBanner';

export default function DashboardLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const { profile } = useAuth();
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
        const raw = profile?.role || 'trainee';
        if (raw === 'org_admin' || raw === 'ernam_admin') return 'admin';
        return raw;
    })();

    // ─── ADMIN: Full-screen, zero chrome ───────────────────────────────────────
    if (!profile || roleId === 'admin') {
        return (
            <div className="min-h-screen">
                {roleId === 'admin' && <ImpersonationBanner />}
                {children}
            </div>
        );
    }

    // ─── Non-admin roles: standard sidebar + top-bar layout ───────────────────
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
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
                {/* Global Top Bar */}
                <div className="h-[88px] px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2.5 bg-white dark:bg-[#1c1c1c] pl-1.5 pr-4 py-1.5 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-transparent dark:border-white/5 shrink-0">
                            <img src="/logos/asecna-logo.png" alt="ASECNA" className="w-8 h-8 object-contain rounded-full" />
                            <span className="text-sm font-black tracking-tight text-gray-800 dark:text-gray-100">ASECNA</span>
                        </div>
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search something..."
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#1c1c1c] border-none rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-sm outline-none focus:ring-2 focus:ring-gray-200 transition-all font-medium text-gray-600 dark:text-gray-300"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <button className="relative text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-0 right-1 w-2 h-2 bg-red-400 rounded-full border border-[#f8f9fa] dark:border-black" />
                        </button>
                        <div className="flex items-center gap-2.5 bg-white dark:bg-[#1c1c1c] pl-1.5 pr-4 py-1.5 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-transparent dark:border-white/5 cursor-pointer hover:shadow-md transition-shadow">
                            <img src="/logos/ernam-logo.png" alt="ERNAM" className="w-8 h-8 object-contain rounded-full" />
                            <span className="text-sm font-black tracking-tight text-gray-800 dark:text-gray-100">ERNAM</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-8 pt-0">
                    {children}
                </div>
            </main>
        </div>
    );
}
