"use client";

import React, { useEffect, useState } from 'react';
import { Plus, ArrowLeft, Save, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function Gradebook({ instructorId }: { instructorId?: string }) {
    const [viewMode, setViewMode] = useState<'list' | 'marking'>('list');
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [students, setStudents] = useState<any[]>([]);
    const [marks, setMarks] = useState<Record<string, { score: number | string, result: string, id?: string }>>({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            setLoading(true);
            try {
                // Get sessions assigned to this instructor
                const { data: mySessions } = await supabase
                    .from('session_instructors')
                    .select('session_id')
                    .eq('instructor_id', instructorId);

                if (mySessions && mySessions.length > 0) {
                    const sessionIds = mySessions.map(s => s.session_id);
                    const { data: sessionsData } = await supabase
                        .from('sessions')
                        .select('id, training_standard:training_standards(title)')
                        .in('id', sessionIds);
                    
                    if (sessionsData) {
                        setSessions(sessionsData.map(s => ({
                            id: s.id,
                            title: s.training_standard?.title || 'Unknown Session'
                        })));
                    }
                }
            } catch (err) {
                console.error("Error fetching sessions:", err);
            } finally {
                setLoading(false);
            }
        };

        if (instructorId) fetchSessions();
    }, [instructorId]);

    useEffect(() => {
        const fetchParticipantsAndGrades = async () => {
            if (!selectedSessionId) return;
            setLoading(true);
            try {
                // 1. Get Participants
                const { data: participants } = await supabase
                    .from('session_participants')
                    .select('participant_id, users(full_name)')
                    .eq('session_id', selectedSessionId);

                if (participants) {
                    const studentList = participants.map((p: any) => ({
                        id: p.participant_id,
                        name: p.users?.full_name || 'Unknown Student'
                    }));
                    setStudents(studentList);

                    // 2. Get existing assessments
                    const { data: assessments } = await supabase
                        .from('assessments')
                        .select('*')
                        .eq('session_id', selectedSessionId);

                    const marksMap: any = {};
                    assessments?.forEach(a => {
                        marksMap[a.participant_id] = {
                            id: a.id,
                            score: a.score,
                            result: a.result
                        };
                    });
                    setMarks(marksMap);
                }
            } catch (err) {
                console.error("Error fetching grades:", err);
            } finally {
                setLoading(false);
            }
        };

        if (viewMode === 'marking' && selectedSessionId) {
            fetchParticipantsAndGrades();
        }
    }, [viewMode, selectedSessionId]);

    const handleSaveMarks = async () => {
        setSaving(true);
        try {
            const upsertData = Object.entries(marks).map(([participantId, data]) => ({
                id: data.id, 
                session_id: selectedSessionId,
                participant_id: participantId,
                score: data.score === '' ? null : Number(data.score),
                result: (Number(data.score) >= 50) ? 'pass' : 'fail',
                entered_by: instructorId,
                entered_at: new Date().toISOString()
            }));

            if (upsertData.length > 0) {
                const { error } = await supabase
                    .from('assessments')
                    .upsert(upsertData, { onConflict: 'session_id, participant_id' });

                if (error) throw error;
            }
            
            alert('Marks securely saved to the Database!');
            setViewMode('list');
        } catch (err: any) {
            console.error("Error saving marks:", err);
            alert("Failed to save marks: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (viewMode === 'marking') {
        return (
            <div className="flex flex-col h-[calc(100vh-140px)] gap-6 p-2 max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-4 border-b border-gray-200 dark:border-white/10 pb-4">
                    <button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Session Grading</h1>
                        <p className="text-muted-foreground mt-1 text-sm font-medium">Input marks for the selected session participants.</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-card border border-border rounded-3xl shadow-lg p-8 flex-1 flex flex-col overflow-hidden">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="overflow-y-auto flex-1 pr-2">
                                <table className="w-full text-left">
                                    <thead className="border-b border-gray-200 dark:border-white/10 sticky top-0 bg-white dark:bg-card z-10">
                                        <tr className="text-gray-500 dark:text-gray-400">
                                            <th className="py-4 font-semibold uppercase tracking-wider text-xs w-2/3 text-blue-900 dark:text-blue-300">Name</th>
                                            <th className="py-4 font-semibold uppercase tracking-wider text-xs w-1/3 text-center text-blue-900 dark:text-blue-300">Marks / 100</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {students.map(s => (
                                            <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="py-4 font-bold text-gray-900 dark:text-white">{s.name}</td>
                                                <td className="py-4 flex justify-center">
                                                    <input 
                                                        type="number"
                                                        value={marks[s.id]?.score || ''}
                                                        onChange={e => setMarks({...marks, [s.id]: { ...(marks[s.id] || {}), score: e.target.value }})}
                                                        placeholder="0"
                                                        className="w-24 text-center bg-transparent border-b-2 justify-center border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none font-bold text-lg px-2 py-1"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <button 
                                    onClick={handleSaveMarks}
                                    disabled={saving || students.length === 0}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-3 disabled:opacity-50"
                                >
                                    {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                                    {saving ? 'SAVING...' : 'SAVE ASSESSMENT RESULTS'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-6 p-2 max-w-4xl mx-auto w-full">
            <div className="flex justify-between items-end border-b border-gray-200 dark:border-white/10 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Gradebook</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Select a session to manage participant results.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-card border border-border rounded-3xl shadow-lg p-8">
                {loading ? (
                    <div className="py-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sessions.map(s => (
                            <div key={s.id} className="group relative flex items-center justify-between bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 p-5 rounded-2xl shadow-sm transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer" onClick={() => { setSelectedSessionId(s.id); setViewMode('marking'); }}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{s.title}</h3>
                                        <p className="text-sm text-gray-500">Session ID: {s.id.slice(0, 8)}...</p>
                                    </div>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-white/10 text-sm font-bold shadow-sm transition-opacity">
                                    Manage Marks
                                </button>
                            </div>
                        ))}
                        {sessions.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground italic border-2 border-dashed border-border rounded-2xl">
                                No sessions assigned to your account.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
