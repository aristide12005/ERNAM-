"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useTranslations } from 'next-intl';
import { Search, UserCheck, Shield, BookOpen, MoreHorizontal, Mail } from 'lucide-react';

type Instructor = {
    id: string;
    full_name: string;
    email: string;
    role: string;
    status: 'active' | 'pending' | 'suspended';
    created_at: string;
    specialization?: string;
};

export default function InstructorsView() {
    const t = useTranslations('InstructorsView');
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newInstructor, setNewInstructor] = useState({ fullName: '', email: '', password: '', specialization: '' });

    // Actions State
    const [viewProfileInstructor, setViewProfileInstructor] = useState<Instructor | null>(null);
    const [assignSessionInstructor, setAssignSessionInstructor] = useState<Instructor | null>(null);
    const [availableSessions, setAvailableSessions] = useState<{ id: string, training_standard: { title: string }, start_date: string }[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState("");
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        fetchInstructors();
    }, []);

    const fetchInstructors = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'instructor')
            .order('full_name', { ascending: true });

        if (!error && data) setInstructors(data as any);
        setLoading(false);
    };

    const handleCreateInstructor = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            const response = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newInstructor.email,
                    password: newInstructor.password,
                    fullName: newInstructor.fullName,
                    role: 'instructor'
                    // Specialization is not standard in createUser, would need profile update. 
                    // For now, let's just create the user. Specialized view can edit later.
                })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error);

            // Success
            alert('Instructor created successfully');
            setIsCreateModalOpen(false);
            setNewInstructor({ fullName: '', email: '', password: '', specialization: '' });
            fetchInstructors(); // Refresh list

        } catch (error: any) {
            alert('Error creating instructor: ' + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleAssignSession = async () => {
        if (!selectedSessionId || !assignSessionInstructor) return;
        setAssigning(true);

        const { error } = await supabase
            .from('session_instructors')
            .insert({
                session_id: selectedSessionId,
                instructor_id: assignSessionInstructor.id
            });

        setAssigning(false);

        if (error) {
            alert('Assignment failed: ' + error.message);
        } else {
            alert('Instructor assigned to session successfully.');
            setAssignSessionInstructor(null);
            setSelectedSessionId("");
        }
    };

    const openAssignModal = async (inst: Instructor) => {
        setAssignSessionInstructor(inst);
        // Fetch sessions
        const { data } = await supabase
            .from('sessions')
            .select(`id, start_date, training_standard:training_standards(title)`)
            .in('status', ['planned', 'active'])
            .order('start_date', { ascending: true });

        if (data) setAvailableSessions(data as any);
    };

    const filtered = instructors.filter(i =>
        i.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="text-blue-500" />
                        {t('title')}
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#141414] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                        + Add Instructor
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/5 rounded-xl border border-white/5" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-[#141414] rounded-xl border border-white/5">
                    <UserCheck className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-300">{t('no_results')}</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((inst) => (
                        <div key={inst.id} className="bg-[#141414] border border-white/5 p-6 rounded-xl hover:border-blue-500/30 transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-lg">
                                    {inst.full_name?.charAt(0).toUpperCase()}
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${inst.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                    'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                    }`}>
                                    {inst.status || 'Active'}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-1">{inst.full_name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                <Mail className="h-3 w-3" />
                                {inst.email}
                            </div>

                            <div className="border-t border-white/5 pt-4 flex gap-2">
                                <button
                                    onClick={() => setViewProfileInstructor(inst)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-xs font-bold transition-colors">
                                    {t('view_profile')}
                                </button>
                                <button
                                    onClick={() => openAssignModal(inst)}
                                    className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 py-2 rounded-lg text-xs font-bold transition-colors border border-blue-600/20">
                                    Assign Session
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Instructor Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0F0F0F] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Create New Instructor</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleCreateInstructor} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-[#1A1A1A] border border-white/10 text-white rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 transition-all"
                                    value={newInstructor.fullName}
                                    onChange={e => setNewInstructor({ ...newInstructor, fullName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-[#1A1A1A] border border-white/10 text-white rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 transition-all"
                                    value={newInstructor.email}
                                    onChange={e => setNewInstructor({ ...newInstructor, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Generate Password</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-[#1A1A1A] border border-white/10 text-white rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 transition-all"
                                    value={newInstructor.password}
                                    onChange={e => setNewInstructor({ ...newInstructor, password: e.target.value })}
                                    placeholder="Enter secure password"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCreating ? 'Creating...' : 'Create Instructor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Profile Modal */}
            {viewProfileInstructor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0F0F0F] border border-white/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
                        <button onClick={() => setViewProfileInstructor(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>

                        <div className="text-center mb-6">
                            <div className="h-20 w-20 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-3xl mx-auto mb-4 border border-blue-500/20">
                                {viewProfileInstructor.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-xl font-bold text-white">{viewProfileInstructor.full_name}</h2>
                            <p className="text-sm text-gray-400">{viewProfileInstructor.role} • {viewProfileInstructor.status || 'Active'}</p>
                        </div>

                        <div className="space-y-3 bg-[#1A1A1A] p-4 rounded-xl border border-white/5">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-500">Email Address</label>
                                <div className="text-sm text-white font-medium flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5" />
                                    {viewProfileInstructor.email}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-500 mt-2">Joined Date</label>
                                <div className="text-sm text-white font-medium">
                                    {new Date(viewProfileInstructor.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-500 mt-2">Specialization</label>
                                <div className="text-sm text-white font-medium">
                                    {viewProfileInstructor.specialization || 'Not specified'}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button onClick={() => setViewProfileInstructor(null)} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-2 rounded-lg transition-colors">
                                Close Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Session Modal */}
            {assignSessionInstructor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0F0F0F] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Assign to Session</h2>
                            <button onClick={() => setAssignSessionInstructor(null)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-400">Assigning instructor:</p>
                            <div className="font-bold text-white text-lg">{assignSessionInstructor.full_name}</div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Select Active Session</label>
                                {availableSessions.length === 0 ? (
                                    <div className="p-3 bg-red-900/10 border border-red-900/30 rounded-lg text-red-400 text-sm">
                                        No planned or active sessions found.
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                        {availableSessions.map(session => (
                                            <button
                                                key={session.id}
                                                onClick={() => setSelectedSessionId(session.id)}
                                                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedSessionId === session.id
                                                        ? 'bg-blue-600/10 border-blue-600 text-white'
                                                        : 'bg-[#1A1A1A] border-white/5 text-gray-300 hover:bg-white/5'
                                                    }`}
                                            >
                                                <div className="font-bold text-sm">{session.training_standard?.title || 'Untitled Session'}</div>
                                                <div className="text-xs opacity-70 mt-1 flex items-center gap-2">
                                                    <BookOpen className="w-3 h-3" />
                                                    Start: {new Date(session.start_date).toLocaleDateString()}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setAssignSessionInstructor(null)}
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssignSession}
                                    disabled={!selectedSessionId || assigning}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {assigning ? 'Assigning...' : 'Confirm Assignment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
