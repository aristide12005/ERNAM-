"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { Calendar as CalendarIcon, User as UserIcon, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function InstructorAttendanceView() {
    const { user } = useAuth();
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');

    useEffect(() => {
        const fetchSessions = async () => {
            if (!user) return;
            try {
                const { data: mySessions } = await supabase
                    .from('session_instructors')
                    .select('session_id, sessions(id, training_standard:training_standards(title))')
                    .eq('instructor_id', user.id);

                if (mySessions) {
                    const sessionList = mySessions.map((s: any) => ({
                        id: s.session_id,
                        title: s.sessions?.training_standard?.title || 'Unknown'
                    }));
                    setSessions(sessionList);
                    if (sessionList.length > 0 && !selectedSessionId) {
                        setSelectedSessionId(sessionList[0].id);
                    }
                }
            } catch (err) {
                console.error("Error fetching instructor sessions:", err);
            }
        };
        fetchSessions();
    }, [user]);

    useEffect(() => {
        if (selectedSessionId) fetchParticipants();
    }, [selectedSessionId, sessionDate]);

    const fetchParticipants = async () => {
        try {
            setLoading(true);
            const { data: partData, error } = await supabase
                .from('session_participants')
                .select(`
                    id,
                    attendance_status,
                    attendance_log,
                    user:users!participant_id(id, full_name, email, avatar_url)
                `)
                .eq('session_id', selectedSessionId);

            if (error) throw error;

            if (partData) {
                const processed = partData.map(p => {
                    const log = p.attendance_log || [];
                    const dayEntry = log.find((e: any) => e.date === sessionDate);
                    return {
                        ...p,
                        todayStatus: dayEntry ? dayEntry.status : 'undecided'
                    };
                });
                setParticipants(processed);
            }
        } catch (err) {
            console.error("Error fetching roster:", err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (participantRowId: string, newStatus: string) => {
        setSavingId(participantRowId);
        try {
            const participant = participants.find(p => p.id === participantRowId);
            const currentLog = participant.attendance_log || [];
            
            // Filter out existing entry for this date and add new one
            const newLog = currentLog.filter((e: any) => e.date !== sessionDate);
            newLog.push({ date: sessionDate, status: newStatus });

            const { error } = await supabase
                .from('session_participants')
                .update({ 
                    attendance_log: newLog,
                    attendance_status: newStatus === 'present' ? 'attended' : 'absent' // Sync overall status for simplicity
                })
                .eq('id', participantRowId);

            if (error) throw error;

            setParticipants(prev => prev.map(p => {
                if (p.id === participantRowId) {
                    return { ...p, todayStatus: newStatus, attendance_log: newLog };
                }
                return p;
            }));
        } catch (err: any) {
            alert("Failed to save attendance: " + err.message);
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Attendance Log</h1>
                <div className="flex gap-4 items-center">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Active Session:</label>
                    <select 
                        value={selectedSessionId}
                        onChange={(e) => setSelectedSessionId(e.target.value)}
                        className="bg-card border border-border rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                    >
                        {sessions.map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                
                {/* Toolbar */}
                <div className="p-4 border-b border-border flex items-center gap-4 bg-secondary/30">
                    <div className="relative flex items-center gap-3">
                        <label className="text-sm font-semibold text-muted-foreground">Log Date:</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="date"
                                value={sessionDate}
                                onChange={e => setSessionDate(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary bg-background text-sm font-medium"
                            />
                        </div>
                    </div>
                    <div className="ml-auto flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm text-emerald-500 font-bold">
                            <CheckCircle2 className="w-4 h-4" /> Present: {participants.filter(p => p.todayStatus === 'present').length}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-red-500 font-bold">
                            <XCircle className="w-4 h-4" /> Absent: {participants.filter(p => p.todayStatus === 'absent').length}
                        </div>
                    </div>
                </div>

                {/* Table Area */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="p-12 text-center text-muted-foreground animate-pulse">Loading roster details...</div>
                    ) : participants.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                            <AlertCircle className="w-10 h-10 opacity-20" />
                            <p>No participants enrolled in this session yet.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white dark:bg-card sticky top-0 z-10 shadow-sm border-b border-border">
                                <tr className="text-muted-foreground">
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Student</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">Daily Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {participants.map((item) => (
                                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                    {item.user?.avatar_url ? (
                                                        <img src={item.user.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                                                    ) : (
                                                        item.user?.full_name?.charAt(0) || <UserIcon className="w-5 h-5 opacity-50" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-foreground text-sm">{item.user?.full_name}</div>
                                                    <div className="text-muted-foreground text-[10px]">{item.user?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2 relative">
                                                {savingId === item.id && (
                                                    <span className="absolute -left-8 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                )}
                                                <button
                                                    onClick={() => updateStatus(item.id, 'present')}
                                                    className={`px-6 py-2 rounded-xl font-bold text-xs transition-all border-2 ${
                                                        item.todayStatus === 'present' 
                                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                                                        : 'bg-background border-border text-muted-foreground hover:border-emerald-500/50 hover:text-emerald-500'
                                                    }`}
                                                >
                                                    PRESENT
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(item.id, 'absent')}
                                                    className={`px-6 py-2 rounded-xl font-bold text-xs transition-all border-2 ${
                                                        item.todayStatus === 'absent' 
                                                        ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/20' 
                                                        : 'bg-background border-border text-muted-foreground hover:border-red-500/50 hover:text-red-500'
                                                    }`}
                                                >
                                                    ABSENT
                                                </button>
                                                {item.todayStatus === 'undecided' && (
                                                    <span className="text-[10px] font-bold text-amber-500 uppercase ml-2 animate-pulse">Pending</span>
                                                )}
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
