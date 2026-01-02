"use client";

import { useState, useEffect } from 'react';
import { X, Search, User, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useTranslations } from 'next-intl';

interface Profile {
    id: string;
    full_name: string;
    role: string;
    avatar_url?: string;
}

interface NewChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartChat: (partnerId: string, partnerName: string, partnerRole: string) => void;
    currentUserId: string;
}

export default function NewChatModal({ isOpen, onClose, onStartChat, currentUserId }: NewChatModalProps) {
    const t = useTranslations('Messaging');
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch users on open
    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            setSearchTerm('');
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setLoading(true);
        // Fetch all profiles except current user
        // Optimally, limit this or paginate in a real large app
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .neq('id', currentUserId)
            .limit(50);

        if (!error && data) {
            setUsers(data);
        }
        setLoading(false);
    };

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800">{t('new_message')}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t('search_people')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            {t('no_users_found')}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredUsers.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => onStartChat(user.id, user.full_name, user.role)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group"
                                >
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                                        {user.full_name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{user.full_name}</h3>
                                        <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
