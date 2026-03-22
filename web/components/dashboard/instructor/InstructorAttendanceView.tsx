"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { Calendar as CalendarIcon, User as UserIcon, CheckCircle2, XCircle } from 'lucide-react';

export default function InstructorAttendanceView() {
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
    const [savingId, setSavingId] = useState<string | null>(null);

    useEffect(() => {
        if (user) fetchParticipants();
    }, [user, sessionDate]);

    const fetchParticipants = async () => {
        try {
            setLoading(true);
            const { data: mySessions } = await supabase
                .from('session_instructors')
                .select('session_id')
                .eq('instructor_id', user?.id);

            if (!mySessions || mySessions.length === 0) {
                setLoading(false);
                return;
            }
            const sessionIds = mySessions.map(s => s.session_id);

            // Fetch participants based on course
            const { data: partData } = await supabase
                .from('session_participants')
                .select(`
                    id,
                    attendance_status,
                    user:users!participant_id(id, full_name, email, avatar_url)
                `)
                .in('session_id', sessionIds);

            if (partData) {
                // Determine mock presence based on date string hash for UI demonstration if no DB attendance table exists per-day yet
                const processed = partData.map(p => ({
                    ...p,
                    // If true DB exists, we would join daily_attendance table. Here we use session_participants generic status or a local toggle state.
                    todayStatus: Math.random() > 0.2 ? 'present' : 'absent' 
                }));
                const uniqueTrainees = Array.from(new Map(processed.map(item => [item.user?.id, item])).values());
                setParticipants(uniqueTrainees as any[]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = (id: string, currentStatus: string) => {
        setSavingId(id);
        setTimeout(() => {
            setParticipants(prev => prev.map(p => {
                if (p.id === id) {
                    return { ...p, todayStatus: currentStatus === 'present' ? 'absent' : 'present' };
                }
                return p;
            }));
            setSavingId(null);
        }, 400); // Simulate network latency
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Daily Attendance</h1>
            </div>

            <div className="flex-1 bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
                
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center gap-4 bg-gray-50/50 dark:bg-black/10">
                    <div className="relative flex items-center gap-3">
                        <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">Select Date:</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="date"
                                value={sessionDate}
                                onChange={e => setSessionDate(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-black/40 text-sm font-medium"
                            />
                        </div>
                    </div>
                    <div className="ml-auto flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                            <CheckCircle2 className="w-4 h-4" /> Present: {participants.filter(p => p.todayStatus === 'present').length}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-bold">
                            <XCircle className="w-4 h-4" /> Absent: {participants.filter(p => p.todayStatus === 'absent').length}
                        </div>
                    </div>
                </div>

                {/* Table Area */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400">Loading attendance roster...</div>
                    ) : participants.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No trainees assigned to you yet.</div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white dark:bg-transparent sticky top-0 z-10 shadow-sm border-b border-gray-200 dark:border-white/10">
                                <tr className="text-gray-500 dark:text-gray-400">
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Photo</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Name & Email</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">Status Toggle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {participants.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 w-16">
                                            {item.user?.avatar_url ? (
                                                <img src={item.user.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                                                    {item.user?.full_name?.charAt(0) || <UserIcon className="w-5 h-5 opacity-50" />}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 dark:text-white text-base mb-0.5">
                                                {item.user?.full_name}
                                            </div>
                                            <div className="text-gray-500 dark:text-gray-400 text-xs">
                                                {item.user?.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2 relative">
                                                {savingId === item.id && (
                                                    <span className="absolute -left-6 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                )}
                                                <button
                                                    onClick={() => toggleStatus(item.id, item.todayStatus)}
                                                    className={`px-6 py-2 rounded-full font-bold text-xs tracking-wider transition-all border-2 ${
                                                        item.todayStatus === 'present' 
                                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                                                        : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-500 opacity-60 hover:opacity-100'
                                                    }`}
                                                >
                                                    PRESENT
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(item.id, item.todayStatus)}
                                                    className={`px-6 py-2 rounded-full font-bold text-xs tracking-wider transition-all border-2 ${
                                                        item.todayStatus === 'absent' 
                                                        ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/20' 
                                                        : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-500 opacity-60 hover:opacity-100'
                                                    }`}
                                                >
                                                    ABSENT
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
