"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/providers/AuthProvider';
import { BookOpen, MapPin, Calendar, Clock, User, ChevronRight } from 'lucide-react';

type Session = {
    id: string;
    course_code: string;
    start_date: string;
    end_date: string;
    location: string;
    instructor?: { full_name: string };
    standard?: { title: string };
    participants_count: number;
    status: 'upcoming' | 'ongoing' | 'completed';
};

export default function OrgSessionsView() {
    const t = useTranslations('OrgAdmin.sessions');
    const { profile } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.organization_id) {
            fetchSessions();
        }
    }, [profile?.organization_id]);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            // 1. Get session IDs for this org
            const { data: participations } = await supabase
                .from('session_participants')
                .select('session_id, participant:profiles!inner(organization_id)')
                .eq('participant.organization_id', profile?.organization_id);

            if (!participations || participations.length === 0) {
                setSessions([]);
                setLoading(false);
                return;
            }

            const sessionIds = [...new Set(participations.map((p: any) => p.session_id))];

            // 2. Fetch session details
            const { data, error } = await supabase
                .from('training_sessions')
                .select(`
                    id, course_code, start_date, end_date, location, status,
                    instructor:profiles!instructor_id(full_name),
                    standard:training_standards(title)
                `)
                .in('id', sessionIds)
                .order('start_date', { ascending: false });

            if (data) {
                // Calculate count for this org specifically or total? 
                // Let's count how many of OUR participants are in each session
                const sessionsWithCounts = data.map((session: any) => {
                    const count = participations.filter((p: any) => p.session_id === session.id).length;
                    return { ...session, participants_count: count };
                });
                setSessions(sessionsWithCounts as any);
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                        {t('title')}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">{t('subtitle')}</p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}
                </div>
            ) : sessions.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">{t('table.status')}</h3>
                    <p className="text-slate-500">{t('subtitle')}</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">{t('table.code')}</th>
                                <th className="px-6 py-4">{t('table.standard')}</th>
                                <th className="px-6 py-4">{t('table.dates')}</th>
                                <th className="px-6 py-4">{t('table.location')}</th>
                                <th className="px-6 py-4">{t('table.instructor')}</th>
                                <th className="px-6 py-4 text-right">{t('table.status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sessions.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4 font-mono text-sm font-bold text-slate-700">
                                        {s.course_code}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{s.standard?.title}</div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            {s.participants_count} Org Participants
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                            <span>{new Date(s.start_date).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <MapPin className="h-4 w-4 text-slate-400" />
                                            <span>{s.location}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <User className="h-4 w-4 text-slate-400" />
                                            <span>{s.instructor?.full_name || 'Unassigned'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${s.status === 'upcoming' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                s.status === 'ongoing' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    'bg-slate-50 text-slate-500 border-slate-100'
                                            }`}>
                                            {s.status}
                                        </span>
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
