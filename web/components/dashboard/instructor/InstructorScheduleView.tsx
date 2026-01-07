"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { Calendar, Clock, MapPin } from 'lucide-react';

export default function InstructorScheduleView() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (user) fetchSchedule();
    }, [user]);

    const fetchSchedule = async () => {
        try {
            // 1. Get my session IDs
            const { data: mySessions } = await supabase
                .from('session_instructors')
                .select('session_id')
                .eq('instructor_id', user?.id);

            if (!mySessions || mySessions.length === 0) {
                setLoading(false);
                return;
            }

            const sessionIds = mySessions.map(s => s.session_id);

            // 2. Get session details
            const { data: sessionData } = await supabase
                .from('sessions')
                .select(`
                    id,
                    start_date,
                    end_date,
                    location,
                    status,
                    training_standard:training_standards(title, code)
                `)
                .in('id', sessionIds)
                .order('start_date', { ascending: true });

            if (sessionData) setSessions(sessionData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">My Schedule</h1>
            <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm p-8">
                <div className="flex items-center gap-4 mb-8">
                    <Calendar className="h-8 w-8 text-blue-500" />
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Sessions</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Your assigned training schedule.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading schedule...</div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No upcoming sessions assigned.</div>
                ) : (
                    <div className="space-y-4">
                        {sessions.map((session) => (
                            <div key={session.id} className="flex flex-col md:flex-row gap-6 border-b border-gray-100 dark:border-white/5 pb-6 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 p-4 rounded-lg transition-colors">
                                <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg p-3 text-center min-w-[80px] h-fit">
                                    <div className="text-xs font-bold uppercase">{new Date(session.start_date).toLocaleString('default', { month: 'short' })}</div>
                                    <div className="text-2xl font-bold">{new Date(session.start_date).getDate()}</div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${session.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                            session.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {session.status}
                                        </span>
                                        <span className="text-xs text-gray-400 font-mono">{(session.training_standard as any)?.code}</span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">{(session.training_standard as any)?.title}</h4>

                                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-gray-400" />
                                            {new Date(session.start_date).toLocaleDateString()} - {new Date(session.end_date).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            {session.location}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
