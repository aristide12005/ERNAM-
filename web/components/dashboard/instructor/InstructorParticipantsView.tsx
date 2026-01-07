"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { Users, Search } from 'lucide-react';

export default function InstructorParticipantsView() {
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user) fetchParticipants();
    }, [user]);

    const fetchParticipants = async () => {
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

            // 2. Get participants from those sessions
            const { data: partData } = await supabase
                .from('session_participants')
                .select(`
                    id,
                    attendance_status,
                    user:users!participant_id(id, full_name, email, organization_id),
                    session:sessions(id, start_date, training_standard:training_standards(title))
                `)
                .in('session_id', sessionIds);

            if (partData) {
                // Flatten and dedup if you want unique students, OR list by enrollment. 
                // Listing by enrollment (per session) is usually more useful for instructors.
                setParticipants(partData);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = participants.filter(p =>
        (p.user?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.user?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Participants Directory</h1>

            <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-white/5 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-gray-500">Loading participants...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">No participants found.</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase">Student</th>
                                <th className="px-6 py-4 font-bold uppercase">Session</th>
                                <th className="px-6 py-4 font-bold uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {filtered.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{item.user?.full_name}</div>
                                        <div className="text-xs text-gray-500">{item.user?.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 dark:text-gray-300">{(item.session?.training_standard as any)?.title}</div>
                                        <div className="text-xs text-gray-500">{new Date(item.session?.start_date).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${item.attendance_status === 'attended' ? 'bg-emerald-100 text-emerald-700' :
                                            item.attendance_status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {item.attendance_status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
