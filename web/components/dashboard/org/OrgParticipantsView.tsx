"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/providers/AuthProvider';
import { Users, Search, Plus, UserCheck, MoreHorizontal, Mail, GraduationCap, AlertCircle, CheckCircle } from 'lucide-react';
import AddParticipantDialog from './AddParticipantDialog';

type Participant = {
    id: string;
    full_name: string;
    email: string;
    status: 'active' | 'suspended' | 'pending';
    created_at: string;
    organization_id: string;
    session_participants: any[]; // Joined data
};

export default function OrgParticipantsView() {
    const t = useTranslations('OrgAdmin.participants'); // Make sure to add this key in json if missing or fallback
    const { profile } = useAuth();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [error, setError] = useState<string | null>(null);

    // Assignment State
    const [assigningUser, setAssigningUser] = useState<Participant | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState('');

    useEffect(() => {
        if (profile?.organization_id) {
            fetchParticipants();
        }
    }, [profile?.organization_id]);

    const fetchParticipants = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log("Fetching participants for org:", profile?.organization_id);
            const { data: users, error: supabaseError } = await supabase
                .from('users')
                .select(`
                    *,
                    session_participants(
                        session_id,
                        attendance_status,
                        session:sessions(
                            start_date,
                            status,
                            training_standard:training_standards(title)
                        )
                    )
                `)
                .eq('role', 'participant')
                .eq('organization_id', profile?.organization_id)
                .order('full_name');

            if (supabaseError) {
                console.error("Error fetching participants:", supabaseError);
                throw new Error(supabaseError.message);
            }

            if (users) {
                console.log("Participants fetched:", users.length);
                setParticipants(users as any);
            }
        } catch (err: any) {
            console.error("Critical error in fetchParticipants:", err);
            setError(err.message || "Failed to load participants");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAssign = async (user: Participant) => {
        setAssigningUser(user);
        // Fetch valid sessions (status = planned or active)
        const { data } = await supabase
            .from('sessions')
            .select('id, training_standard:training_standards(title), start_date, status')
            .in('status', ['planned', 'active'])
            .order('start_date'); // Removed .eq('organization_id') constraint to allow general sessions if applicable

        if (data) setSessions(data);
        setIsAssignModalOpen(true);
    };

    const handleAssignSubmit = async () => {
        if (!assigningUser || !selectedSessionId) return;

        const { error } = await supabase
            .from('session_participants')
            .insert({
                session_id: selectedSessionId,
                participant_id: assigningUser.id,
                organization_id: profile?.organization_id,
                attendance_status: 'enrolled'
            });

        if (error) {
            alert('Assignment failed: ' + error.message);
        } else {
            setIsAssignModalOpen(false);
            setAssigningUser(null);
            fetchParticipants();
        }
    };

    const getParticipantStatus = (p: Participant) => {
        const activeSession = p.session_participants?.find(sp => sp.session?.status === 'active');
        const plannedSession = p.session_participants?.find(sp => sp.session?.status === 'planned');
        const completedSession = p.session_participants?.find(sp => sp.attendance_status === 'attended');

        if (activeSession) return { key: 'active', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
        if (plannedSession) return { key: 'nominated', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
        if (completedSession) return { key: 'completed', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' };

        return { key: 'dormant', color: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400' };
    };

    const filtered = participants.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="h-6 w-6 text-blue-600" />
                        {t('title')}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">{t('subtitle')}</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all"
                >
                    <Plus className="h-4 w-4" />
                    {t('add_participant')}
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 mb-4">
                    <AlertCircle className="h-5 w-5" />
                    <div>
                        <p className="font-bold text-sm">Failed to load participants</p>
                        <p className="text-xs opacity-80">{error}. Please check the console for more details.</p>
                    </div>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <UserCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No participants found</h3>
                    <p className="text-slate-500">Add staff members to start tracking their training.</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">{t('table.name')}</th>
                                <th className="px-6 py-4">{t('table.status')}</th>
                                <th className="px-6 py-4">{t('table.assigned_sessions')}</th>
                                <th className="px-6 py-4 text-right">{t('table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((p) => {
                                const status = getParticipantStatus(p);
                                const currentSession = p.session_participants?.[0]?.session;
                                return (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                                                    {p.full_name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{p.full_name}</div>
                                                    <div className="text-xs text-slate-500">{p.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${status.color}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                                                {t(`status.${status.key}`)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {currentSession ? (
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap className="h-4 w-4 text-indigo-500" />
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {currentSession.training_standard?.title || 'Session'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {status.key === 'dormant' || status.key === 'completed' ? (
                                                <button
                                                    onClick={() => handleOpenAssign(p)}
                                                    className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    {t('actions.assign_session')}
                                                </button>
                                            ) : (
                                                <button className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors">
                                                    {t('actions.manage')}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <AddParticipantDialog
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchParticipants}
                organizationId={profile?.organization_id}
                onAssign={(userId) => {
                    // Find the user in the (updated) list and open assign modal
                    // We might need to wait for fetchParticipants to complete, 
                    // or just optimistically fetch/create a partial user object.
                    // Note: fetchParticipants is async. The user might not be in 'participants' state yet if we don't wait.
                    // Safer: fetch specific user or wait.
                    const user = participants.find(p => p.id === userId);
                    if (user) {
                        handleOpenAssign(user);
                    } else {
                        // Fallback if list update lags: Fetch text or just pass minimal data
                        // For now, let's close AddModal and try to find him. 
                        // To ensure data consistency, we'll try to find him after a short delay or force fetch.
                        setTimeout(async () => {
                            const { data } = await supabase.from('users').select('*').eq('id', userId).single();
                            if (data) handleOpenAssign(data as any);
                        }, 500);
                    }
                    setIsAddModalOpen(false);
                }}
            />

            {/* Simple Assign Modal (Ideally separate component) */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                        <h3 className="font-bold text-lg text-slate-900 mb-2">Assign Session</h3>
                        <p className="text-sm text-slate-500 mb-4">Assign <b>{assigningUser?.full_name}</b> to an approved session.</p>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto mb-6">
                            {sessions.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => setSelectedSessionId(s.id)}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedSessionId === s.id ? 'border-blue-500 bg-blue-50ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}
                                >
                                    <div className="font-bold text-slate-900">{s.training_standard?.title || 'Unknown Standard'}</div>
                                    <div className="text-xs text-slate-500">Starts: {s.start_date} • Status: {s.status}</div>
                                </div>
                            ))}
                            {sessions.length === 0 && <p className="text-sm text-slate-500">No active or planned sessions found.</p>}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setIsAssignModalOpen(false)} className="flex-1 py-2 font-bold text-slate-500 bg-slate-100 rounded-lg">Cancel</button>
                            <button onClick={handleAssignSubmit} disabled={!selectedSessionId} className="flex-1 py-2 font-bold text-white bg-blue-600 rounded-lg disabled:opacity-50">Confirm Assignment</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
