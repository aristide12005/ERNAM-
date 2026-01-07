"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthProvider';
import ManageSessionView from './ManageSessionView';

type Session = {
    id: string;
    start_date: string;
    end_date: string;
    location: string;
    status: string;
    training_standard: {
        code: string;
        title: string;
    }
};

export default function MySessionsView() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    useEffect(() => {
        if (user?.id) fetchMySessions();
    }, [user?.id]);

    const fetchMySessions = async () => {
        setLoading(true);
        // Query session_instructors to find sessions this user is teaching
        const { data, error } = await supabase
            .from('session_instructors')
            .select(`
                session:sessions (
                    id,
                    start_date,
                    end_date,
                    location,
                    status,
                    training_standard:training_standards(code, title)
                )
            `)
            .eq('instructor_id', user?.id)
            .order('session(start_date)', { ascending: true }); // sort might need manual handling if deep

        if (data) {
            // Flatten the structure
            const validSessions = data.map((d: any) => d.session).filter(s => s !== null);
            setSessions(validSessions);
        }
        setLoading(false);
    };

    if (selectedSessionId) {
        return <ManageSessionView sessionId={selectedSessionId} onBack={() => setSelectedSessionId(null)} />;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto text-gray-200">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">My Teaching Schedule</h1>
                <p className="text-sm text-gray-500">Upcoming sessions you are assigned to instruct.</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2].map(i => (
                        <div key={i} className="h-40 bg-gray-200 dark:bg-white/5 rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-500 bg-white dark:bg-[#141414] rounded-xl border border-gray-100 dark:border-white/5">
                            No sessions assigned yet.
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <motion.div
                                key={session.id}
                                whileHover={{ y: -4 }}
                                className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/5 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-400/10 px-2 py-1 rounded">
                                            {session.training_standard?.code}
                                        </span>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2 leading-tight">
                                            {session.training_standard?.title}
                                        </h3>
                                    </div>
                                    <div className={`
                                        px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                        ${session.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500' :
                                            session.status === 'planned' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500' :
                                                'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-500'}
                                    `}>
                                        {session.status}
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                            {new Date(session.start_date).toLocaleDateString()} — {new Date(session.end_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                        <MapPin className="h-4 w-4" />
                                        <span>{session.location}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedSessionId(session.id)}
                                    className="mt-6 w-full py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-white text-sm font-bold rounded-lg transition-colors border border-gray-200 dark:border-white/5 flex items-center justify-center gap-2 group-hover:border-blue-500/30"
                                >
                                    Open Marking <ArrowRight className="h-3 w-3" />
                                </button>
                            </motion.div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
