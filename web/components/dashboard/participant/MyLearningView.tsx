"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Calendar, MapPin } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

type Session = {
    id: string;
    start_date: string;
    end_date: string;
    location: string;
    status: string;
    delivery_mode: string;
    training_standard: {
        code: string;
        title: string;
    };
    participants_link_status: string;
};

export default function MyLearningView() {
    const t = useTranslations('Participant.MyLearning');
    const locale = useLocale();
    const { user } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) fetchMyLearning();
    }, [user?.id]);

    const fetchMyLearning = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('session_participants')
            .select(`
                attendance_status,
                session:sessions (
                    id,
                    start_date,
                    end_date,
                    location,
                    status,
                    delivery_mode,
                    training_standard:training_standards(code, title)
                )
            `)
            .eq('participant_id', user?.id)
            .order('session(start_date)', { ascending: true });

        if (data) {
            const mapped = data.map((d: any) => ({
                ...d.session,
                participants_link_status: d.attendance_status
            })).filter(s => s !== null);
            setSessions(mapped);
        }
        setLoading(false);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>

            {loading ? (
                <div className="space-y-4 animate-pulse">
                    {[1, 2].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
                </div>
            ) : sessions.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">{t('no_active')}</h3>
                    <p className="text-gray-500">{t('no_active_desc')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs font-bold text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded">
                                        {session.training_standard.code}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                        ${session.status === 'active' ? 'bg-emerald-100 text-emerald-700 animate-pulse' : 'bg-blue-100 text-blue-700'}
                                     `}>
                                        {session.status}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase text-gray-400 border border-gray-200 px-2 py-0.5 rounded">
                                        {session.participants_link_status}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">{session.training_standard.title}</h3>
                                <div className="flex items-center gap-6 mt-3 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                            {new Date(session.start_date).toLocaleDateString(locale)} — {new Date(session.end_date).toLocaleDateString(locale)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        <span>{session.location} ({session.delivery_mode})</span>
                                    </div>
                                </div>
                            </div>

                            <button className="mt-4 md:mt-0 w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">
                                {t('access_materials')}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
