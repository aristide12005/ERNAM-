"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning";
    read: boolean;
    time: string;
}

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);

    // Mock Data for now
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: "1",
            title: "Welcome to ERNAM",
            message: "Your account has been approved.",
            type: "success",
            read: false,
            time: "Just now"
        },
        {
            id: "2",
            title: "System Update",
            message: "Maintenance scheduled for Sunday.",
            type: "info",
            read: false,
            time: "2 hours ago"
        }
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Notification Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-80 md:w-96 mb-4 overflow-hidden pointer-events-auto flex flex-col max-h-[500px]"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                                </p>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    No notifications
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={cn(
                                            "p-3 rounded-xl transition-colors flex gap-3 items-start",
                                            n.read ? "bg-transparent opacity-70" : "bg-blue-50/50 dark:bg-blue-900/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "mt-0.5 w-2 h-2 rounded-full shrink-0",
                                            n.read ? "bg-transparent" : "bg-blue-500"
                                        )} />

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h4 className={cn("text-sm font-medium", n.read ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-white")}>
                                                    {n.title}
                                                </h4>
                                                <span className="text-[10px] text-slate-400">{n.time}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {n.message}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Float Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto h-14 w-14 bg-white dark:bg-slate-900 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center text-slate-700 dark:text-white border border-slate-100 dark:border-slate-800 transition-all z-50 relative group"
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <Bell className="w-6 h-6 group-hover:text-blue-600 transition-colors" />
                )}

                {/* Badge */}
                {!isOpen && unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center text-[10px] font-bold text-white translate-x-1 -translate-y-1">
                        {unreadCount}
                    </span>
                )}
            </motion.button>
        </div>
    );
}
