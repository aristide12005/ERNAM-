"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    Calendar,
    Users,
    Plus,
    Trash2,
    Edit2,
    CheckCircle,
    X,
    Layers,
    GraduationCap,
    Loader2
} from 'lucide-react';

export default function AcademicManagement() {
    const [activeTab, setActiveTab] = useState<'sessions' | 'departments' | 'batches'>('sessions');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <GraduationCap className="h-6 w-6 text-blue-500" /> Academic Structure
                </h2>

                <div className="flex bg-[#141414] p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('sessions')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'sessions' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Calendar className="h-4 w-4" /> Sessions
                    </button>
                    <button
                        onClick={() => setActiveTab('departments')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'departments' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <BookOpen className="h-4 w-4" /> Departments
                    </button>
                    <button
                        onClick={() => setActiveTab('batches')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'batches' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Users className="h-4 w-4" /> Batches
                    </button>
                </div>
            </div>

            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 min-h-[500px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'sessions' && <SessionsManager key="sessions" />}
                    {activeTab === 'departments' && <DepartmentsManager key="departments" />}
                    {activeTab === 'batches' && <BatchesManager key="batches" />}
                </AnimatePresence>
            </div>
        </div>
    );
}

// --- Sessions Manager ---
function SessionsManager() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newItem, setNewItem] = useState({ year: new Date().getFullYear(), is_current: false });

    const fetchSessions = async () => {
        setLoading(true);
        const { data } = await supabase.from('academic_sessions').select('*').order('year', { ascending: false });
        if (data) setSessions(data);
        setLoading(false);
    };

    useEffect(() => { fetchSessions(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        // If is_current is true, first set all others to false (conceptually, though trigger is better)
        // For now simple insert
        if (newItem.is_current) {
            await supabase.from('academic_sessions').update({ is_current: false }).neq('id', 0);
        }

        const { error } = await supabase.from('academic_sessions').insert(newItem);
        if (!error) {
            setIsCreateOpen(false);
            fetchSessions();
        } else {
            alert("Error: " + error.message);
        }
    };

    const toggleCurrent = async (id: string) => {
        // Set all to false first
        await supabase.from('academic_sessions').update({ is_current: false }).neq('id', 0);
        // Set specific to true
        await supabase.from('academic_sessions').update({ is_current: true }).eq('id', id);
        fetchSessions();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this session?")) return;
        const { error } = await supabase.from('academic_sessions').delete().eq('id', id);
        if (!error) fetchSessions();
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Academic Years</h3>
                <button onClick={() => setIsCreateOpen(true)} className="btn-primary flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-white font-bold text-sm">
                    <Plus className="h-4 w-4" /> Add Session
                </button>
            </div>

            {loading ? <Loader2 className="animate-spin text-blue-500 mx-auto" /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.map(session => (
                        <div key={session.id} className={`p-4 rounded-xl border ${session.is_current ? 'bg-blue-600/10 border-blue-500' : 'bg-white/5 border-white/5'} flex justify-between items-center`}>
                            <div>
                                <div className="text-xl font-black text-white">{session.year}</div>
                                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                                    {session.is_current ? 'Current Session' : 'Past/Future'}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {!session.is_current && (
                                    <button onClick={() => toggleCurrent(session.id)} title="Make Current" className="p-2 hover:bg-emerald-500/20 text-emerald-500 rounded-lg">
                                        <CheckCircle className="h-4 w-4" />
                                    </button>
                                )}
                                <button onClick={() => handleDelete(session.id)} className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#141414] border border-white/10 p-6 rounded-2xl w-full max-w-sm">
                        <h3 className="text-xl font-bold text-white mb-4">New Session</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase">Year</label>
                                <input type="number" required value={newItem.year} onChange={e => setNewItem({ ...newItem, year: parseInt(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="curr" checked={newItem.is_current} onChange={e => setNewItem({ ...newItem, is_current: e.target.checked })} className="rounded bg-white/10 border-white/20" />
                                <label htmlFor="curr" className="text-sm text-white font-bold">Set as Active Session</label>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 py-2 text-gray-400 font-bold hover:text-white">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

// --- Departments Manager ---
function DepartmentsManager() {
    const [depts, setDepts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', code: '' });

    const fetchDepts = async () => {
        setLoading(true);
        const { data } = await supabase.from('departments').select('*').order('name');
        if (data) setDepts(data);
        setLoading(false);
    };

    useEffect(() => { fetchDepts(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('departments').insert(newItem);
        if (!error) {
            setIsCreateOpen(false);
            setNewItem({ name: '', code: '' });
            fetchDepts();
        } else {
            alert("Error: " + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this department?")) return;
        const { error } = await supabase.from('departments').delete().eq('id', id);
        if (!error) fetchDepts();
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Departments</h3>
                <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-white font-bold text-sm">
                    <Plus className="h-4 w-4" /> Add Department
                </button>
            </div>

            {loading ? <Loader2 className="animate-spin text-blue-500 mx-auto" /> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-white/5">
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Code</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {depts.map(d => (
                                <tr key={d.id} className="hover:bg-white/5">
                                    <td className="px-4 py-3 font-bold text-white">{d.name}</td>
                                    <td className="px-4 py-3 text-gray-400 font-mono">{d.code}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleDelete(d.id)} className="text-red-500 hover:text-red-400">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#141414] border border-white/10 p-6 rounded-2xl w-full max-w-sm">
                        <h3 className="text-xl font-bold text-white mb-4">New Department</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase">Department Name</label>
                                <input required value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none" placeholder="e.g. Computer Science" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase">Code</label>
                                <input required value={newItem.code} onChange={e => setNewItem({ ...newItem, code: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none" placeholder="e.g. CSE" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 py-2 text-gray-400 font-bold hover:text-white">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

// --- Batches Manager ---
function BatchesManager() {
    const [batches, setBatches] = useState<any[]>([]);
    const [depts, setDepts] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', department_id: '', session_id: '' });

    const fetchData = async () => {
        setLoading(true);
        const [bRes, dRes, sRes] = await Promise.all([
            supabase.from('batches').select('*, departments(name), academic_sessions(year)'),
            supabase.from('departments').select('*'),
            supabase.from('academic_sessions').select('*').order('year', { ascending: false })
        ]);

        if (bRes.data) setBatches(bRes.data);
        if (dRes.data) setDepts(dRes.data);
        if (sRes.data) setSessions(sRes.data);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('batches').insert(newItem);
        if (!error) {
            setIsCreateOpen(false);
            setNewItem({ name: '', department_id: '', session_id: '' });
            fetchData();
        } else {
            alert("Error: " + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this batch?")) return;
        const { error } = await supabase.from('batches').delete().eq('id', id);
        if (!error) fetchData();
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Student Batches</h3>
                <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-white font-bold text-sm">
                    <Plus className="h-4 w-4" /> Add Batch
                </button>
            </div>

            {loading ? <Loader2 className="animate-spin text-blue-500 mx-auto" /> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-white/5">
                                <th className="px-4 py-3">Batch Name</th>
                                <th className="px-4 py-3">Department</th>
                                <th className="px-4 py-3">Session</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {batches.map(b => (
                                <tr key={b.id} className="hover:bg-white/5">
                                    <td className="px-4 py-3 font-bold text-white">{b.name}</td>
                                    <td className="px-4 py-3 text-gray-300">
                                        {b.departments?.name || <span className="text-red-500 text-xs">Deleted</span>}
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">
                                        {b.academic_sessions?.year || <span className="text-red-500 text-xs">Deleted</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleDelete(b.id)} className="text-red-500 hover:text-red-400">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#141414] border border-white/10 p-6 rounded-2xl w-full max-w-sm">
                        <h3 className="text-xl font-bold text-white mb-4">New Batch</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase">Batch Name</label>
                                <input required value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none" placeholder="e.g. Batch A" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase">Department</label>
                                <select required value={newItem.department_id} onChange={e => setNewItem({ ...newItem, department_id: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none">
                                    <option value="">Select Department</option>
                                    {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase">Session</label>
                                <select required value={newItem.session_id} onChange={e => setNewItem({ ...newItem, session_id: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none">
                                    <option value="">Select Session</option>
                                    {sessions.map(s => <option key={s.id} value={s.id}>{s.year}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 py-2 text-gray-400 font-bold hover:text-white">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
