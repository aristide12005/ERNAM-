'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Info, AlertTriangle, CheckCircle, Clock, UserCheck, UserX, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface NotificationMetadata {
    enrollment_id?: string;
    user_id?: string;
    course_id?: string;
    student_name?: string;
    course_name?: string;
}

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'alert' | 'success' | 'priority' | 'enrollment_request' | 'enrollment_approved' | 'enrollment_rejected';
    is_read: boolean;
    created_at: string;
    action_link?: string;
    metadata?: NotificationMetadata;
}

interface NotificationsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export default function NotificationsDialog({ isOpen, onClose, userId }: NotificationsDialogProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [processingAction, setProcessingAction] = useState<string | null>(null);

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
                        event: 'INSERT', // Only listen for new notifications, not updates
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${userId}`
                    },
                    (payload) => {
                        console.log('New notification received:', payload);
                        // Add the new notification to the list instead of refetching all
                        if (payload.new) {
                            setNotifications(prev => [payload.new as Notification, ...prev]);
                        }
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

    const handleEnrollmentAction = async (notificationId: string, metadata: NotificationMetadata, action: 'active' | 'failed') => {
        console.log('=== ENROLLMENT ACTION DEBUG ===');
        console.log('Notification ID:', notificationId);
        console.log('Metadata:', metadata);
        console.log('Action:', action);

        if (!metadata.user_id || !metadata.course_id) {
            console.error('Missing enrollment metadata:', metadata);
            alert('Error: Missing enrollment information. Please refresh the page.');
            return;
        }

        setProcessingAction(notificationId);

        try {
            // Update enrollment status
            console.log('Updating enrollment with:', {
                user_id: metadata.user_id,
                course_id: metadata.course_id,
                status: action
            });

            const { data, error } = await supabase
                .from('enrollments')
                .update({ status: action })
                .eq('user_id', metadata.user_id)
                .eq('course_id', metadata.course_id)
                .select();

            console.log('Update result:', { data, error });

            if (!error) {
                console.log('✅ Enrollment updated successfully');
                // Mark notification as read
                await markAsRead(notificationId);
                // Collapse the notification
                setExpandedId(null);
                // Refresh notifications to show updated state
                await fetchNotifications();
            } else {
                console.error('❌ Error updating enrollment:', error);
                alert(`Failed to update enrollment: ${error.message}\n\nDetails: ${error.hint || 'Check console for more info'}`);
            }
        } catch (err) {
            console.error('❌ Exception during enrollment update:', err);
            alert('An unexpected error occurred. Please check the console.');
        }

        setProcessingAction(null);
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'alert': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
            case 'success':
            case 'enrollment_approved': return <CheckCircle className="h-5 w-5 text-emerald-500" />;
            case 'priority': return <Bell className="h-5 w-5 text-red-500" />;
            case 'enrollment_request': return <UserCheck className="h-5 w-5 text-blue-500" />;
            case 'enrollment_rejected': return <UserX className="h-5 w-5 text-red-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const canShowActions = (notif: Notification) => {
        return notif.type === 'enrollment_request' && !notif.is_read && notif.metadata?.user_id && notif.metadata?.course_id;
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

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                                notifications.map((notif) => {
                                    const isExpanded = expandedId === notif.id;
                                    const showActions = canShowActions(notif);

                                    return (
                                        <motion.div
                                            key={notif.id}
                                            layout
                                            initial={false}
                                            animate={{
                                                scale: isExpanded ? 1.02 : 1,
                                            }}
                                            transition={{
                                                duration: 0.3,
                                                type: "spring",
                                                stiffness: 300,
                                                damping: 25
                                            }}
                                            className={`rounded-lg border transition-all ${notif.is_read
                                                ? 'bg-card border-border'
                                                : 'bg-primary/5 border-primary/20 ring-1 ring-primary/10'
                                                } ${isExpanded ? 'shadow-md' : 'hover:shadow-sm'}`}
                                        >
                                            <div
                                                onClick={() => {
                                                    if (showActions) {
                                                        toggleExpand(notif.id);
                                                    } else {
                                                        markAsRead(notif.id);
                                                    }
                                                }}
                                                className="p-4 cursor-pointer"
                                            >
                                                <div className="flex gap-4">
                                                    <div className="mt-1">{getTypeIcon(notif.type)}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <h3 className={`font-bold text-sm ${notif.is_read ? 'text-foreground' : 'text-primary'}`}>
                                                                {notif.title}
                                                            </h3>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {new Date(notif.created_at).toLocaleDateString()}
                                                                </span>
                                                                {showActions && (
                                                                    <div className="text-muted-foreground">
                                                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                                            {notif.message}
                                                        </p>
                                                        {!notif.is_read && !isExpanded && (
                                                            <div className="mt-2 flex justify-end">
                                                                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">New</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded Actions Section */}
                                            <AnimatePresence>
                                                {isExpanded && showActions && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden border-t border-border/50"
                                                    >
                                                        <div className="p-4 bg-secondary/20 space-y-3">
                                                            {notif.metadata?.student_name && (
                                                                <div className="text-xs space-y-1">
                                                                    <p className="text-muted-foreground">
                                                                        <span className="font-semibold text-foreground">Student:</span> {notif.metadata.student_name}
                                                                    </p>
                                                                    <p className="text-muted-foreground">
                                                                        <span className="font-semibold text-foreground">Course:</span> {notif.metadata.course_name}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            <div className="flex gap-2 pt-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEnrollmentAction(notif.id, notif.metadata!, 'active');
                                                                    }}
                                                                    disabled={processingAction === notif.id}
                                                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white text-sm font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                                                                >
                                                                    {processingAction === notif.id ? (
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                                    ) : (
                                                                        <>
                                                                            <UserCheck className="h-4 w-4" />
                                                                            Accept
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEnrollmentAction(notif.id, notif.metadata!, 'failed');
                                                                    }}
                                                                    disabled={processingAction === notif.id}
                                                                    className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white text-sm font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                                                                >
                                                                    {processingAction === notif.id ? (
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                                    ) : (
                                                                        <>
                                                                            <UserX className="h-4 w-4" />
                                                                            Reject
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        <div className="p-4 border-t border-border bg-secondary/10 flex justify-center">
                            <button
                                onClick={async () => {
                                    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
                                    if (unreadIds.length > 0) {
                                        await supabase
                                            .from('notifications')
                                            .update({ is_read: true })
                                            .in('id', unreadIds);
                                        fetchNotifications();
                                    }
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
