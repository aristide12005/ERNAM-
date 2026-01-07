"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/providers/AuthProvider';
import { User, Mail, Search, Award } from 'lucide-react';

type Instructor = {
    id: string;
    full_name: string;
    email: string;
    specialization?: string;
    assigned_sessions_count: number;
};

export default function OrgInstructorsView() {
    const t = useTranslations('OrgAdmin.instructors');
    const { profile } = useAuth();
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.organization_id) {
            fetchInstructors();
        }
    }, [profile?.organization_id]);

    const fetchInstructors = async () => {
        setLoading(true);
        try {
            // 1. Get all session IDs where this org's participants are enrolled
            const { data: participations } = await supabase
                .from('session_participants')
                .select('session_id, participant:profiles!inner(organization_id)')
                .eq('participant.organization_id', profile?.organization_id);

            if (!participations || participations.length === 0) {
                setInstructors([]);
                setLoading(false);
                return;
            }

            const sessionIds = [...new Set(participations.map((p: any) => p.session_id))];

            // 2. Get sessions details to find instructors
            const { data: sessions } = await supabase
                .from('training_sessions')
                .select('instructor_id, instructor:profiles!instructor_id(id, full_name, email)')
                .in('id', sessionIds);

            if (sessions) {
                // Aggregate unique instructors
                const uniqueInstructorsMap = new Map<string, Instructor>();

                sessions.forEach((s: any) => {
                    if (s.instructor) {
                        const existing = uniqueInstructorsMap.get(s.instructor.id);
                        if (existing) {
                            existing.assigned_sessions_count++;
                        } else {
                            uniqueInstructorsMap.set(s.instructor.id, {
                                ...s.instructor,
                                assigned_sessions_count: 1
                            });
                        }
                    }
                });

                setInstructors(Array.from(uniqueInstructorsMap.values()));
            }
        } catch (error) {
            console.error("Error fetching instructors:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Award className="h-6 w-6 text-indigo-600" />
                        {t('title')}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">{t('subtitle')}</p>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-xl" />)}
                </div>
            ) : instructors.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">{t('no_instructors')}</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {instructors.map((inst) => (
                        <div key={inst.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xl">
                                    {inst.full_name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">{inst.full_name}</h3>
                                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                        Instructor
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    {inst.email}
                                </div>
                                <div className="flex justify-between items-center text-sm pt-2">
                                    <span className="text-slate-500 font-medium">{t('table.assigned_sessions')}</span>
                                    <span className="font-bold text-slate-900 text-lg">{inst.assigned_sessions_count}</span>
                                </div>
                            </div>

                            <button className="w-full mt-6 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2 rounded-lg transition-colors text-xs uppercase flex items-center justify-center gap-2">
                                <Mail className="h-3 w-3" />
                                Contact Instructor
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
