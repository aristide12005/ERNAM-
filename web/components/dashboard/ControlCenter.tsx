"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Moon, Sun, Globe, Clock,
    LogOut, Settings, User,
    Monitor, Check
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

interface ControlCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ControlCenter({ isOpen, onClose }: ControlCenterProps) {
    const { theme, setTheme } = useTheme();
    const { signOut, profile } = useAuth();
    const [time, setTime] = useState(new Date());
    const router = useRouter();
    const pathname = usePathname();

    // Clock Logic
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Format Helpers
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    const formatDate = (date: Date) => {
        return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    };

    // Locale Switcher Logic
    const switchLocale = (newLocale: string) => {
        // Simple regex replace for /en/ or /fr/ in path
        const currentPath = pathname || '/';
        const segments = currentPath.split('/');
        // segments[1] is usually the locale
        if (['en', 'fr'].includes(segments[1])) {
            segments[1] = newLocale;
            const newPath = segments.join('/');
            router.push(newPath);
        } else {
            router.push(`/${newLocale}${currentPath}`);
        }
    };

    const currentLocale = pathname?.split('/')[1] === 'fr' ? 'fr' : 'en';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[49] bg-transparent" // Invisible backdrop to close on click outside
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed top-20 right-8 z-[50] w-[350px] bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700 shadow-2xl rounded-3xl overflow-hidden"
                    >
                        <div className="p-6 space-y-6">

                            {/* 1. Smart Clock Section */}
                            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Clock className="w-20 h-20" />
                                </div>
                                <h2 className="text-5xl font-bold tracking-tight font-mono">
                                    {formatTime(time)}
                                </h2>
                                <p className="text-blue-100 font-medium mt-1 text-sm">
                                    {formatDate(time)}
                                </p>
                            </div>

                            {/* 2. Quick Actions Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Theme Toggle */}
                                <button
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 border ${theme === 'dark'
                                        ? 'bg-slate-800 border-slate-700 text-blue-400'
                                        : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {theme === 'dark' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                                    <span className="text-xs font-semibold">
                                        {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                    </span>
                                </button>

                                {/* System Settings */}
                                <button
                                    onClick={() => {
                                        onClose();
                                        // Preserve locale if handled by pathname, append/replace view
                                        const basePath = pathname?.split('?')[0] || '/dashboard';
                                        router.push(`${basePath}?view=settings`);
                                    }}
                                    className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl flex flex-col items-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                                >
                                    <Settings className="w-6 h-6" />
                                    <span className="text-xs font-semibold">Settings</span>
                                </button>
                            </div>

                            {/* 3. Language Slider */}
                            <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex relative">
                                {/* Sliding Background */}
                                <motion.div
                                    className="absolute top-1.5 bottom-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm w-[calc(50%-6px)]"
                                    animate={{
                                        left: currentLocale === 'en' ? '6px' : 'calc(50% + 3px)'
                                    }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />

                                <button
                                    onClick={() => switchLocale('en')}
                                    className={`flex-1 relative z-10 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${currentLocale === 'en' ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                                        }`}
                                >
                                    <span className="text-lg">🇬🇧</span> English
                                </button>
                                <button
                                    onClick={() => switchLocale('fr')}
                                    className={`flex-1 relative z-10 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${currentLocale === 'fr' ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                                        }`}
                                >
                                    <span className="text-lg">🇫🇷</span> Français
                                </button>
                            </div>

                            {/* 4. Mini Profile & Logout */}
                            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold border-2 border-white dark:border-slate-700 shadow-sm">
                                    {profile?.full_name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                        {profile?.full_name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase">
                                        {profile?.role?.replace('_', ' ')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => signOut()}
                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
