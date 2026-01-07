"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useTranslations } from 'next-intl';
import { Search, UserPlus, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    organizationId: string;
    onAssign: (userId: string) => void;
}

export default function AddParticipantDialog({ isOpen, onClose, onSuccess, organizationId, onAssign }: Props) {
    const t = useTranslations('OrgAdmin.participants.modal');
    const [mode, setMode] = useState<'invite' | 'search'>('invite');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [createdUserId, setCreatedUserId] = useState<string | null>(null);

    // Invite Form
    const [inviteData, setInviteData] = useState({ fullName: '', email: '' });

    // Search Form
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleInvite = async () => {
        if (!inviteData.email || !inviteData.fullName) return;
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch('/api/org/invite-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: inviteData.email,
                    fullName: inviteData.fullName,
                    organizationId
                })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setSuccess(t('success.created', { password: data.tempPassword }));
            setCreatedUserId(data.user?.id);

            // Immediately refresh background list
            onSuccess();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (searchTerm.length < 3) return;
        setIsSearching(true);
        setSearchResults([]); // Clear previous

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .ilike('email', `%${searchTerm}%`)
            .eq('role', 'participant')
            .is('organization_id', null)
            .limit(5);

        if (data) setSearchResults(data);
        setIsSearching(false);
    };

    const handleAttachUser = async (userId: string) => {
        setLoading(true);
        const { error } = await supabase
            .from('users')
            .update({ organization_id: organizationId })
            .eq('id', userId);

        if (error) {
            setError(error.message);
        } else {
            setSuccess(t('success.added'));
            setCreatedUserId(userId);
            setSearchResults([]); // Clear Search
            onSuccess(); // Refresh list immediately
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-900">{t('title')}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => { setMode('invite'); setSuccess(null); setError(null); }}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'invite' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        {t('tabs.create')}
                    </button>
                    <button
                        onClick={() => { setMode('search'); setSuccess(null); setError(null); }}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'search' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        {t('tabs.search')}
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" /> {error}
                        </div>
                    )}

                    {/* Success State with Action Buttons */}
                    {success ? (
                        <div className="mb-4">
                            <div className="p-4 bg-emerald-50 text-emerald-800 text-sm rounded-lg border border-emerald-100 mb-4">
                                <div className="flex items-center gap-2 mb-2 font-bold">
                                    <CheckCircle className="h-5 w-5" /> Success
                                </div>
                                {success}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-colors"
                                >
                                    {t('actions.dismiss')}
                                </button>
                                {createdUserId && (
                                    <button
                                        onClick={() => onAssign(createdUserId)}
                                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        {t('actions.assign')}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {mode === 'invite' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('full_name')}</label>
                                        <input
                                            value={inviteData.fullName}
                                            onChange={(e) => setInviteData({ ...inviteData, fullName: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g. Jean Dupont"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('email')}</label>
                                        <input
                                            value={inviteData.email}
                                            onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g. jean@example.com"
                                        />
                                    </div>
                                    <button
                                        onClick={handleInvite}
                                        disabled={loading || !inviteData.email || !inviteData.fullName}
                                        className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                        {t('submit')}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <input
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder={t('search.placeholder')}
                                            />
                                            {isSearching && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleSearch}
                                            disabled={isSearching}
                                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 rounded-lg"
                                        >
                                            <Search className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
                                        {searchResults.map(user => (
                                            <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div>
                                                    <div className="font-bold text-slate-900 text-sm">{user.full_name}</div>
                                                    <div className="text-xs text-slate-500">{user.email}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleAttachUser(user.id)}
                                                    disabled={loading}
                                                    className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors"
                                                >
                                                    {t('search.add')}
                                                </button>
                                            </div>
                                        ))}
                                        {searchResults.length === 0 && !isSearching && searchTerm.length > 3 && (
                                            <div className="text-center text-sm text-slate-400 py-4">{t('search.no_results')}</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
