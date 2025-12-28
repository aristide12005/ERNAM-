"use client";

import { useRef, useEffect, useMemo, useState } from 'react';
import MessageBubble from './MessageBubble';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { Loader2, ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import InputArea from './InputArea';
import { supabase } from '@/lib/supabaseClient';

// Helper for date headers
const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
};

interface ChatWindowProps {
    conversationId: string | null; // PartnerID for DMs
    partnerName: string;
    partnerRole: string;
    messages: any[]; // We'll type this properly
    loading: boolean;
    onSendMessage: (text: string, file?: File) => Promise<void>;
    onBack?: () => void;
    currentUserId: string;
    onCall: (isVideo: boolean) => void;
    disableCalls?: boolean;
}

export default function ChatWindow({
    conversationId,
    partnerName,
    partnerRole,
    messages,
    loading,
    onSendMessage,
    onBack,
    currentUserId,
    onCall,
    disableCalls = false
}: ChatWindowProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isTyping, setIsTyping] = useState(false); // Mock for now, can be real-time later

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Group messages by date
    const groupedMessages = useMemo(() => {
        const groups: { date: string; msgs: any[] }[] = [];
        let currentDate = '';

        messages.forEach((msg) => {
            const date = new Date(msg.created_at);
            const dateLabel = getDateLabel(date);

            if (dateLabel !== currentDate) {
                currentDate = dateLabel;
                groups.push({ date: dateLabel, msgs: [] });
            }
            groups[groups.length - 1].msgs.push(msg);
        });

        return groups;
    }, [messages]);

    if (!conversationId) {
        return (
            <div className="hidden md:flex flex-1 items-center justify-center bg-slate-50 flex-col gap-4 text-center p-8">
                <div className="bg-white p-6 rounded-full shadow-sm mb-2">
                    <img
                        src="/placeholder-chat.svg" // Just a placeholder, fallback to icon
                        alt=""
                        className="w-24 h-24 opacity-20"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="text-6xl">💬</div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Your Messages</h3>
                    <p className="text-slate-500 mt-2 max-w-sm">
                        Select a conversation from the list to start chatting or broadcasting to your courses.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="md:hidden p-2 -ml-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </button>

                    <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                            {partnerName.charAt(0)}
                        </div>
                        {/* Status Indicator (Mock - assume online for demo feel) */}
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">{partnerName}</h3>
                        <p className="text-xs text-slate-500 font-medium">{partnerRole}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onCall(false)}
                        disabled={disableCalls}
                        className={`p-2 rounded-full transition-colors ${disableCalls ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'}`}
                    >
                        <Phone className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => onCall(true)}
                        disabled={disableCalls}
                        className={`p-2 rounded-full transition-colors ${disableCalls ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'}`}
                    >
                        <Video className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                        <MoreVertical className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {groupedMessages.map((group, groupIdx) => (
                            <div key={group.date} className="space-y-4">
                                {/* Date Divider */}
                                <div className="flex justify-center sticky top-2 z-10 opacity-90 hover:opacity-100 transition-opacity">
                                    <span className="bg-slate-200/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-wide shadow-sm border border-white/50">
                                        {group.date}
                                    </span>
                                </div>

                                {group.msgs.map((msg, idx) => {
                                    const isFromMe = msg.sender_id === currentUserId;
                                    const nextMsg = group.msgs[idx + 1];
                                    const prevMsg = group.msgs[idx - 1];

                                    // Logic for avatars and spacing
                                    // Show avatar if it's the LAST message in a sequence from this person
                                    const showAvatar = !isFromMe && (!nextMsg || nextMsg.sender_id !== msg.sender_id);

                                    let isRead = false;
                                    // If I sent it, isRead logic based on message_read_status check or is_read field we pass down?
                                    // For now, let's assume if it has is_read property from our RPC
                                    isRead = msg.is_read || false;

                                    return (
                                        <MessageBubble
                                            key={msg.id}
                                            content={msg.content}
                                            createdAt={msg.created_at}
                                            isFromMe={isFromMe}
                                            isRead={isRead}
                                            senderName={msg.sender?.full_name} // Need to ensure we pass this
                                            showAvatar={showAvatar}
                                        />
                                    );
                                })}
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex items-center gap-2 ml-4 mb-4">
                                <div className="h-8 w-8 rounded-full bg-slate-200 flex-shrink-0" />
                                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-slate-100">
                                    <div className="flex gap-1">
                                        <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-px" />
                    </>
                )}
            </div>

            {/* Input Area */}
            <InputArea
                onSendMessage={onSendMessage}
                disabled={loading}
            />
        </div>
    );
}
