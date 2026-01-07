"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useTranslations } from 'next-intl';
import { Search, Users, GraduationCap, Clock, Award } from 'lucide-react';

type Participant = {
    id: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
    // Mock fields for demo
    status?: 'enrolled' | 'completed' | 'inactive';
    progress?: number;
};

export default function ParticipantsView() {
    const t = useTranslations('ParticipantsView');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchParticipants();
    }, []);

    const fetchParticipants = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'participant')
            .order('full_name', { ascending: true });

        if (!error && data) {
            // Add mock status for visual variety until enrollment integration
            const enriched = data.map(p => ({
                ...p,
                status: Math.random() > 0.6 ? 'completed' : Math.random() > 0.3 ? 'enrolled' : 'inactive',
                progress: Math.floor(Math.random() * 100)
            })) as Participant[];
            setParticipants(enriched);
        }
        setLoading(false);
    };

    const filtered = participants.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Users className="text-purple-500" />
                        {t('title')}
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 gap-4 animate-pulse">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-white/5 rounded-lg" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-[#141414] rounded-xl border border-white/5">
                    <GraduationCap className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-300">{t('no_results')}</h3>
                </div>
            ) : (
                <div className="bg-[#141414] border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">{t('headers.name')}</th>
                                <th className="px-6 py-4">{t('headers.status')}</th>
                                <th className="px-6 py-4">{t('headers.progress')}</th>
                                <th className="px-6 py-4 text-right">{t('headers.action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map((p) => (
                                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-xs">
                                                {p.full_name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-sm">{p.full_name}</div>
                                                <div className="text-xs text-gray-500">{p.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${p.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                p.status === 'enrolled' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                            }`}>
                                            {t(`status.${p.status}`)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-full max-w-[100px]">
                                            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                                <span>{p.progress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-purple-500 rounded-full"
                                                    style={{ width: `${p.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-white transition-colors">
                                            {t('view_details')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
