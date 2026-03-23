"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Calendar, MapPin } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { format } from 'date-fns';

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

interface MyLearningViewProps {
    onLaunch?: (sessionId: string) => void;
}

export default function MyLearningView({ onLaunch }: MyLearningViewProps) {
    const { profile } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMyLearning = async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
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
                .eq('participant_id', profile.id);

            if (data) {
                const mapped = data
                    .filter((d: any) => d.session) // Ensure session exists
                    .map((d: any) => ({
                        ...d.session,
                        participants_link_status: d.attendance_status
                    }));
                setSessions(mapped);
            }
        } catch (err) {
            console.error("Error fetching learning:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyLearning();
    }, [profile?.id]);

    return (
        <div className="p-6">
            {loading ? (
                <div className="space-y-4 animate-pulse">
                    {[1, 2].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
                </div>
            ) : sessions.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No Active Training Sessions</h3>
                    <p className="text-gray-500">You are not currently enrolled in any upcoming or ongoing training sessions.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className="bg-white border border-gray-200 rounded-[32px] p-8 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all group min-h-[260px]"
                        >
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-widest border border-blue-100/50">
                                            {session.training_standard?.code || 'N/A'}
                                        </span>
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Enrollment Verified</span>
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border
                                        ${session.status === 'active' 
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 animate-pulse' 
                                            : 'bg-gray-50 text-gray-500 border-gray-100'}
                                     `}>
                                        {session.status}
                                    </span>
                                </div>
                                
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black text-gray-900 leading-[1.2] group-hover:text-blue-700 transition-colors line-clamp-2 tracking-tight">
                                        {session.training_standard?.title || 'Untitled Session'}
                                    </h3>
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                                            {session.delivery_mode}
                                        </div>
                                        <span className="h-1 w-1 bg-gray-300 rounded-full" />
                                        <div className="flex items-center gap-1.5 uppercase">
                                            {session.participants_link_status}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
                                        <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                                            <Calendar className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500" />
                                        </div>
                                        {session.start_date ? format(new Date(session.start_date), 'MMMM d') : '...'} — {session.end_date ? format(new Date(session.end_date), 'MMMM d, yyyy') : '...'}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
                                        <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-emerald-50 transition-colors">
                                            <MapPin className="h-3.5 w-3.5 text-gray-400 group-hover:text-emerald-500" />
                                        </div>
                                        {session.location}
                                    </div>
                                </div>

                                <button 
                                    onClick={() => onLaunch?.(session.id)}
                                    className="w-full sm:w-auto px-8 py-3.5 bg-gray-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-black hover:-translate-y-0.5 transition-all shadow-lg shadow-black/5 active:scale-95"
                                >
                                    Launch Studio
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
