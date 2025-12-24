'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Info, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'alert' | 'success' | 'priority';
    is_read: boolean;
    created_at: string;
    action_link?: string;
}

interface NotificationsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export default function NotificationsDialog({ isOpen, onClose, userId }: NotificationsDialogProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (data) setNotifications(data);
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen && userId) {
            fetchNotifications();

            // Set up real-time subscription for new notifications
            const channel = supabase
                .channel('notifications-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${userId}`
                    },
                    (payload) => {
                        console.log('Notification change:', payload);
                        // Refresh notifications
                        fetchNotifications();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [isOpen, userId]);

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (!error) {
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'alert': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
            case 'success': return <CheckCircle className="h-5 w-5 text-emerald-500" />;
            case 'priority': return <Bell className="h-5 w-5 text-red-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                    >
                        <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/30">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Notifications</h2>
                                <p className="text-xs text-muted-foreground mt-1">Stay updated with your activities</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center py-10">
                                    <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                                    <p className="text-muted-foreground">No notifications yet.</p>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => markAsRead(notif.id)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${notif.is_read
                                            ? 'bg-card border-border'
                                            : 'bg-primary/5 border-primary/20 ring-1 ring-primary/10'
                                            }`}
                                    >
                                        <div className="flex gap-4">
                                            <div className="mt-1">{getTypeIcon(notif.type)}</div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h3 className={`font-bold text-sm ${notif.is_read ? 'text-foreground' : 'text-primary'}`}>
                                                        {notif.title}
                                                    </h3>
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(notif.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                                    {notif.message}
                                                </p>
                                                {!notif.is_read && (
                                                    <div className="mt-2 flex justify-end">
                                                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">New</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-border bg-secondary/10 flex justify-center">
                            <button
                                onClick={() => {
                                    onClose();
                                }}
                                className="text-xs font-bold text-primary hover:underline"
                            >
                                Mark all as read
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
