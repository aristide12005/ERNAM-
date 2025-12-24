"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Plus,
    X,
    User,
    Users as UsersIcon,
    Paperclip,
    Search,
    Loader2,
    MessageCircle,
    Check,
    CheckCheck,
    Image as ImageIcon,
    Smile,
    MoreVertical,
    ArrowLeft
} from 'lucide-react';

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string | null;
    course_id: string | null;
    title: string;
    content: string;
    is_reply_allowed: boolean;
    parent_id: string | null;
    attachment_url: string | null;
    is_read: boolean;
    created_at: string;
    sender?: { full_name: string; role: string };
    receiver?: { full_name: string };
    course?: { title_en: string };
}

export default function MessagingSystem() {
    const { user, profile } = useAuth();
    const [conversations, setConversations] = useState<Message[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Message | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchConversations = async () => {
        if (!user) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:profiles!sender_id(full_name, role),
                receiver:profiles!receiver_id(full_name),
                course:courses(title_en)
            `)
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order('created_at', { ascending: false });

        if (!error && data) {
            console.log('Fetched messages:', data); // Debug log

            // Group by conversation partner - keep LATEST message per partner
            const grouped = data.reduce((acc: any, msg: any) => {
                // Skip course broadcasts for now (they need different handling)
                if (!msg.receiver_id) return acc;

                const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;

                // Only keep if we don't have this partner yet (since data is sorted by latest first)
                if (!acc[partnerId]) {
                    acc[partnerId] = msg;
                }
                return acc;
            }, {});

            const conversationList = Object.values(grouped) as Message[];
            console.log('Grouped conversations:', conversationList); // Debug log
            setConversations(conversationList);
        } else if (error) {
            console.error('Error fetching conversations:', error);
        }
        setLoading(false);
    };

    const fetchMessages = async (conversationMsg: Message) => {
        if (!user) return;

        const partnerId = conversationMsg.sender_id === user.id
            ? conversationMsg.receiver_id
            : conversationMsg.sender_id;

        const { data } = await supabase
            .from('messages')
            .select(`
                *,
                sender:profiles!sender_id(full_name, role),
                receiver:profiles!receiver_id(full_name)
            `)
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

        if (data) {
            setMessages(data as any);
        }
    };

    useEffect(() => {
        fetchConversations();

        // Set up real-time subscription for new messages
        if (!user) return;

        const channel = supabase
            .channel('messages-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`
                },
                (payload) => {
                    console.log('Message change detected:', payload);
                    // Refresh conversations when any message changes
                    fetchConversations();
                    // If we're viewing this conversation, refresh messages too
                    if (selectedConversation) {
                        fetchMessages(selectedConversation);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation);
        }
    }, [selectedConversation]);

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedConversation || !user) {
            console.warn('Cannot send message:', {
                hasText: !!messageText.trim(),
                hasConversation: !!selectedConversation,
                hasUser: !!user
            });
            return;
        }

        setSending(true);
        const partnerId = selectedConversation.sender_id === user.id
            ? selectedConversation.receiver_id
            : selectedConversation.sender_id;

        console.log('Sending message:', {
            from: user.id,
            to: partnerId,
            content: messageText.substring(0, 50) + '...'
        });

        const { data, error } = await supabase.from('messages').insert({
            sender_id: user.id,
            receiver_id: partnerId,
            content: messageText,
            title: 'Reply',
            is_reply_allowed: true
        }).select();

        if (!error && data) {
            console.log('Message sent successfully:', data);
            setMessageText('');
            // Wait a moment for DB to process
            setTimeout(() => {
                fetchMessages(selectedConversation);
                fetchConversations();
            }, 300);
        } else {
            console.error('Send error:', error);
            const errorMsg = error?.message || 'Unknown error';
            alert(`❌ Failed to send message\n\nError: ${errorMsg}\n\nPlease check:\n1. You have permission to send messages\n2. The recipient exists\n3. Database connection is working`);
        }
        setSending(false);
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 24) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const filteredConversations = conversations.filter(c =>
        c.sender?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.receiver?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Conversations List */}
            <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col border-r border-slate-200`}>
                {/* Header */}
                <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-900">Messages</h2>
                        <button
                            onClick={() => setIsComposeOpen(true)}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <Plus className="h-5 w-5 text-slate-600" />
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-100 border-0 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <MessageCircle className="h-12 w-12 text-slate-300 mb-3" />
                            <p className="text-sm text-slate-500">No messages yet</p>
                            <p className="text-xs text-slate-400 mt-1">Start a conversation</p>
                        </div>
                    ) : (
                        filteredConversations.map((conv) => {
                            const isFromMe = conv.sender_id === user?.id;
                            const partnerName = isFromMe ? conv.receiver?.full_name : conv.sender?.full_name;
                            const isSelected = selectedConversation?.id === conv.id;

                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv)}
                                    className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 ${isSelected ? 'bg-blue-50' : ''}`}
                                >
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                                        {partnerName?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold text-sm text-slate-900 truncate">{partnerName || 'Unknown'}</h3>
                                            <span className="text-xs text-slate-500">{formatTime(conv.created_at)}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 truncate">
                                            {isFromMe && 'You: '}{conv.content}
                                        </p>
                                    </div>
                                    {!conv.is_read && !isFromMe && (
                                        <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
                            <button
                                onClick={() => setSelectedConversation(null)}
                                className="md:hidden p-2 hover:bg-slate-100 rounded-full"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                {(selectedConversation.sender_id === user?.id
                                    ? selectedConversation.receiver?.full_name
                                    : selectedConversation.sender?.full_name)?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-sm text-slate-900">
                                    {selectedConversation.sender_id === user?.id
                                        ? selectedConversation.receiver?.full_name
                                        : selectedConversation.sender?.full_name}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {selectedConversation.sender?.role || 'User'}
                                </p>
                            </div>
                            <button className="p-2 hover:bg-slate-100 rounded-full">
                                <MoreVertical className="h-5 w-5 text-slate-600" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {messages.map((msg, idx) => {
                                const isFromMe = msg.sender_id === user?.id;
                                const showAvatar = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;

                                return (
                                    <div key={msg.id} className={`flex items-end gap-2 ${isFromMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {showAvatar && !isFromMe ? (
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                {msg.sender?.full_name?.charAt(0) || 'U'}
                                            </div>
                                        ) : (
                                            <div className="h-8 w-8 flex-shrink-0" />
                                        )}

                                        <div className={`max-w-[70%] ${isFromMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                            <div className={`rounded-2xl px-4 py-2 ${isFromMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-slate-900 rounded-bl-sm shadow-sm'}`}>
                                                <p className="text-sm">{msg.content}</p>
                                            </div>
                                            <span className="text-xs text-slate-500 mt-1 px-1">
                                                {formatTime(msg.created_at)}
                                                {isFromMe && (
                                                    <CheckCheck className="inline h-3 w-3 ml-1" />
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-slate-200 bg-white">
                            <div className="flex items-end gap-2">
                                <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <Paperclip className="h-5 w-5 text-slate-600" />
                                </button>
                                <div className="flex-1 bg-slate-100 rounded-2xl px-4 py-2 flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                        className="flex-1 bg-transparent border-0 focus:outline-none text-sm"
                                    />
                                    <button className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                                        <Smile className="h-5 w-5 text-slate-600" />
                                    </button>
                                </div>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!messageText.trim() || sending}
                                    className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-full transition-colors"
                                >
                                    {sending ? (
                                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                                    ) : (
                                        <Send className="h-5 w-5 text-white" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-slate-50">
                        <div className="text-center">
                            <MessageCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a conversation</h3>
                            <p className="text-sm text-slate-500">Choose a message from the list to start chatting</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Compose Modal */}
            <ComposeModal
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                onSuccess={() => {
                    setIsComposeOpen(false);
                    fetchConversations();
                }}
            />
        </div>
    );
}

// Compose Modal Component
function ComposeModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
    const { user, profile } = useAuth();
    const [recipients, setRecipients] = useState<any[]>([]);
    const [selectedRecipient, setSelectedRecipient] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchRecipients();
        }
    }, [isOpen]);

    const fetchRecipients = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .neq('id', user?.id || '');

        if (data) setRecipients(data);
    };

    const handleSend = async () => {
        if (!selectedRecipient || !message.trim()) {
            console.warn('Cannot send new message:', {
                hasRecipient: !!selectedRecipient,
                hasMessage: !!message.trim()
            });
            return;
        }

        setSending(true);
        console.log('Sending new message:', {
            from: user?.id,
            to: selectedRecipient,
            messageLength: message.length
        });

        const { data, error } = await supabase.from('messages').insert({
            sender_id: user?.id,
            receiver_id: selectedRecipient,
            content: message,
            title: 'New Message',
            is_reply_allowed: true
        }).select();

        if (!error && data) {
            console.log('New message sent successfully:', data);
            onSuccess();
            setMessage('');
            setSelectedRecipient('');
        } else {
            console.error('Failed to send new message:', error);
            const errorMsg = error?.message || 'Unknown error';
            alert(`❌ Failed to send message\n\nError: ${errorMsg}\n\nTroubleshooting:\n1. Check database connection\n2. Verify RLS policies allow INSERT\n3. Confirm recipient exists\n\nTechnical details:\nCode: ${error?.code}\nDetails: ${error?.details}`);
        }
        setSending(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">New Message</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">To:</label>
                        <select
                            value={selectedRecipient}
                            onChange={(e) => setSelectedRecipient(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select a person...</option>
                            {recipients.map(r => (
                                <option key={r.id} value={r.id}>{r.full_name} ({r.role})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Message:</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            placeholder="Type your message..."
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={!selectedRecipient || !message.trim() || sending}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="h-5 w-5" />
                                Send Message
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
