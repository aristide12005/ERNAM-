"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import ConversationList from './messaging/ConversationList';
import ChatWindow from './messaging/ChatWindow';
import CallModal from './messaging/CallModal';
import NewChatModal from './messaging/NewChatModal';
import { useWebRTC } from '@/hooks/useWebRTC';
import { AnimatePresence, motion } from 'framer-motion';

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string | null;
    course_id: string | null;
    content: string;
    created_at: string;
    sender?: { full_name: string; role: string };
    is_read?: boolean;
}

export default function MessagingSystem() {
    const { user } = useAuth();

    // State
    const [messages, setMessages] = useState<Message[]>([]); 
    const [pendingMessages, setPendingMessages] = useState<Message[]>([]); 
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
    const [selectedPartnerName, setSelectedPartnerName] = useState('');
    const [selectedPartnerRole, setSelectedPartnerRole] = useState('');

    // Loading States
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Detect mobile & Fix Hydration
    useEffect(() => {
        setMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Call Hook
    const {
        callState,
        callerName,
        localStream,
        remoteStream,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        callType
    } = useWebRTC(user?.id || null);

    // Search
    const [searchTerm, setSearchTerm] = useState('');

    const fetchConversations = async () => {
        if (!user) return;
        setLoadingConversations(true);

        const { data, error } = await supabase.rpc('get_my_conversations');

        if (!error && data) {
            const partnerIds = data.map((d: any) => d.partner_id);
            if (partnerIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, role')
                    .in('id', partnerIds);

                const enriched = data.map((conv: any) => {
                    const profile = profiles?.find(p => p.id === conv.partner_id);
                    return {
                        ...conv,
                        partner_name: profile?.full_name || 'Unknown',
                        partner_role: profile?.role || 'User'
                    };
                });
                setConversations(enriched);
            } else {
                setConversations([]);
            }
        } else {
            console.error('Error fetching inbox:', error);
        }
        setLoadingConversations(false);
    };

    const fetchMessages = async (partnerId: string) => {
        if (!user) return;
        setLoadingMessages(true);

        const { data, error } = await supabase.rpc('get_direct_messages', {
            current_user_id: user.id,
            partner_id: partnerId
        });

        let fetchedMessages = [];

        if (!error && data) {
            fetchedMessages = data.map((m: any) => ({
                id: m.id,
                sender_id: m.sender_id,
                receiver_id: m.receiver_id,
                course_id: m.course_id,
                content: m.content,
                created_at: m.created_at,
                is_read: m.is_read,
                sender: { full_name: m.sender_full_name, role: m.sender_role }
            }));
        } else {
            const { data: sentData } = await supabase
                .from('messages')
                .select(`*, sender:profiles(full_name, role)`)
                .eq('sender_id', user.id)
                .eq('receiver_id', partnerId);

            const { data: receivedData } = await supabase
                .from('messages')
                .select(`*, sender:profiles(full_name, role)`)
                .eq('sender_id', partnerId)
                .eq('receiver_id', user.id);

            const combined = [...(sentData || []), ...(receivedData || [])];
            fetchedMessages = combined.sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                const safeA = isNaN(dateA) ? 0 : dateA;
                const safeB = isNaN(dateB) ? 0 : dateB;
                return safeA - safeB;
            });
        }

        setMessages(fetchedMessages);
        setLoadingMessages(false);

        const unreadIds = fetchedMessages
            .filter((m: any) => m.sender_id === partnerId && !m.is_read)
            .map((m: any) => m.id);

        if (unreadIds.length > 0) {
            supabase.from('messages')
                .update({ is_read: true })
                .in('id', unreadIds)
                .then(({ error }) => {
                    if (error) console.error("Failed to mark read", error);
                });
        }
    };

    useEffect(() => {
        fetchConversations();

        if (!user) return;
        const channel = supabase
            .channel('inbox-updates')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    if (
                        (newMsg.sender_id === user.id) ||
                        (newMsg.receiver_id === user.id)
                    ) {
                        fetchConversations();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    useEffect(() => {
        if (!selectedPartnerId || !user) return;

        const chatChannel = supabase
            .channel(`chat:${selectedPartnerId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `or(sender_id.eq.${selectedPartnerId},receiver_id.eq.${selectedPartnerId})`
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    const isRelevant =
                        (newMsg.sender_id === user.id && newMsg.receiver_id === selectedPartnerId) ||
                        (newMsg.sender_id === selectedPartnerId && newMsg.receiver_id === user.id);

                    if (isRelevant) {
                        setMessages(prev => {
                            if (prev.some(m => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg];
                        });

                        if (newMsg.sender_id === user.id) {
                            setPendingMessages(prev => prev.filter(m => m.content !== newMsg.content));
                        }
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(chatChannel); };
    }, [selectedPartnerId, user]);

    const handleSelectConversation = (id: string, name: string, role: string) => {
        setSelectedPartnerId(id);
        setSelectedPartnerName(name);
        setSelectedPartnerRole(role);
        fetchMessages(id);
    };

    const handleSendMessage = async (text: string, file?: File) => {
        if (!user || !selectedPartnerId) return;

        let content = text;

        if (file) {
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('chat-attachments')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error('File upload error:', uploadError);
                    alert("File upload failed. Please try again.");
                    return;
                }

                const { data } = supabase.storage
                    .from('chat-attachments')
                    .getPublicUrl(filePath);

                if (data) {
                    const fileLink = `\n\n[FILE: ${file.name}](${data.publicUrl})`;
                    content = content ? content + fileLink : `[FILE: ${file.name}](${data.publicUrl})`;
                }
            } catch (error) {
                console.error('Upload exception:', error);
                alert("File upload failed. Please try again.");
                return;
            }
        }

        if (!content.trim()) return;

        const tempId = `temp-${Date.now()}`;
        const tempMsg: Message = {
            id: tempId,
            sender_id: user.id,
            receiver_id: selectedPartnerId,
            course_id: null,
            content: content,
            created_at: new Date().toISOString(),
            is_read: false,
            sender: { full_name: 'You', role: 'user' }
        };

        setPendingMessages(prev => [...prev, tempMsg]);

        const { error } = await supabase.from('messages').insert({
            sender_id: user.id,
            receiver_id: selectedPartnerId,
            course_id: null,
            content: content,
            is_read: false
        });

        if (error) {
            setPendingMessages(prev => prev.filter(m => m.id !== tempId));
            console.error("Send failed:", error);
            alert("Message could not be sent. Check your connection.");
        }
    };

    const filteredConversations = conversations.filter(c =>
        c.partner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleStartNewChat = (partnerId: string, partnerName: string, partnerRole: string) => {
        handleSelectConversation(partnerId, partnerName, partnerRole);
        setShowNewChatModal(false);
    };

    if (!mounted) return null;

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm relative">
            {!isMobile && (
                <>
                    <div className="w-80 lg:w-96 h-full border-r border-slate-200">
                        <ConversationList
                            conversations={filteredConversations}
                            selectedId={selectedPartnerId}
                            onSelect={handleSelectConversation}
                            onNewMessage={() => setShowNewChatModal(true)}
                            loading={loadingConversations}
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            currentUserId={user?.id || ''}
                        />
                    </div>
                    <div className="flex-1 h-full">
                        <ChatWindow
                            conversationId={selectedPartnerId}
                            partnerName={selectedPartnerName}
                            partnerRole={selectedPartnerRole}
                            messages={[...messages, ...pendingMessages]}
                            loading={loadingMessages}
                            onSendMessage={handleSendMessage}
                            onBack={() => setSelectedPartnerId(null)}
                            currentUserId={user?.id || ''}
                            onCall={(isVideo) => selectedPartnerId && startCall(selectedPartnerId, isVideo)}
                            disableCalls={callState !== 'idle'}
                        />
                    </div>
                </>
            )}

            {isMobile && (
                <AnimatePresence initial={false} mode="popLayout">
                    {!selectedPartnerId ? (
                        <motion.div
                            key="list"
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="absolute inset-0 z-10 bg-white"
                        >
                            <ConversationList
                                conversations={filteredConversations}
                                selectedId={selectedPartnerId}
                                onSelect={handleSelectConversation}
                                onNewMessage={() => setShowNewChatModal(true)}
                                loading={loadingConversations}
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                currentUserId={user?.id || ''}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat"
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="absolute inset-0 z-20 bg-white"
                        >
                            <ChatWindow
                                conversationId={selectedPartnerId}
                                partnerName={selectedPartnerName}
                                partnerRole={selectedPartnerRole}
                                messages={[...messages, ...pendingMessages]}
                                loading={loadingMessages}
                                onSendMessage={handleSendMessage}
                                onBack={() => setSelectedPartnerId(null)}
                                currentUserId={user?.id || ''}
                                onCall={(isVideo) => selectedPartnerId && startCall(selectedPartnerId, isVideo)}
                                disableCalls={callState !== 'idle'}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            <CallModal
                isOpen={callState !== 'idle' && callState !== 'ended'}
                mode={callState}
                callerName={callerName || selectedPartnerName}
                localStream={localStream}
                remoteStream={remoteStream}
                onAccept={acceptCall}
                onReject={rejectCall}
                onEndCall={endCall}
                callType={callType}
            />

            <NewChatModal
                isOpen={showNewChatModal}
                onClose={() => setShowNewChatModal(false)}
                onStartChat={handleStartNewChat}
                currentUserId={user?.id || ''}
            />
        </div>
    );
}
