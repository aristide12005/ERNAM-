"use client";

import { Search, Plus, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';

interface Conversation {
    partner_id: string; // The user ID of the other person
    last_message_id: string;
    content: string;
    created_at: string;
    sender_id: string; // Who sent the last message
    is_read: boolean;
    partner_name?: string; // Enriched after fetch
    partner_role?: string;
}

interface ConversationListProps {
    conversations: Conversation[];
    selectedId: string | null;
    onSelect: (id: string, name: string, role: string) => void;
    onNewMessage: () => void;
    loading: boolean;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    currentUserId: string;
}

export default function ConversationList({
    conversations,
    selectedId,
    onSelect,
    onNewMessage,
    loading,
    searchTerm,
    onSearchChange,
    currentUserId
}: ConversationListProps) {
    const t = useTranslations('Messaging');

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-200 w-full md:w-80 lg:w-96">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">{t('title')}</h2>
                    <button
                        onClick={onNewMessage}
                        className="h-9 w-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                        title={t('new_message')}
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs (Future: Direct | Course) */}
                <div className="flex gap-2">
                    <button className="flex-1 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg shadow-sm">
                        {t('direct')}
                    </button>
                    <button className="flex-1 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
                        {t('archived')}
                    </button>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder={t('search_chats')}
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="h-12 w-12 bg-slate-200 rounded-full" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                                    <div className="h-3 bg-slate-200 rounded w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                        <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <User className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">{t('no_chats')}</p>
                        <p className="text-xs text-slate-400 mt-1">{t('start_conversation')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {conversations.map((conv) => {
                            const isSelected = selectedId === conv.partner_id;
                            const isUnread = !conv.is_read && conv.sender_id !== currentUserId;
                            const displayName = conv.partner_name || t('unknown_user');
                            const displayRole = conv.partner_role || '';

                            return (
                                <button
                                    key={conv.partner_id}
                                    onClick={() => onSelect(conv.partner_id, displayName, displayRole)}
                                    className={`w-full p-4 flex gap-3 transition-all duration-200 hover:bg-slate-50 text-left relative group
                                        ${isSelected ? 'bg-blue-50/60 hover:bg-blue-50' : ''}
                                    `}
                                >
                                    {/* Unread Indicator Bar */}
                                    {isUnread && (
                                        <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-500 rounded-r-full" />
                                    )}

                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm
                                            ${isSelected ? 'bg-blue-600 ring-2 ring-blue-100' : 'bg-gradient-to-br from-slate-400 to-slate-500'}
                                        `}>
                                            {displayName.charAt(0)}
                                        </div>
                                        {/* Online dot logic would go here */}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h3 className={`text-sm truncate pr-2 ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                                {displayName}
                                            </h3>
                                            <span className={`text-[10px] whitespace-nowrap ${isUnread ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                                                {(() => {
                                                    try {
                                                        const date = conv.created_at ? new Date(conv.created_at) : new Date();
                                                        if (isNaN(date.getTime())) return t('recently');
                                                        return formatDistanceToNow(date, { addSuffix: false });
                                                    } catch (e) {
                                                        return t('recently');
                                                    }
                                                })()}
                                            </span>
                                        </div>
                                        <p className={`text-xs truncate leading-relaxed ${isUnread ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                                            {conv.sender_id === currentUserId && <span className="text-slate-400 mr-1">{t('you')}:</span>}
                                            {conv.content}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
