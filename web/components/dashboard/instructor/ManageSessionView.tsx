"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { ArrowLeft, Save, CheckCircle, XCircle, Clock, FilePlus, Upload, Trash2, Download, Users, Bell, ChevronRight, ChevronLeft, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ManageSessionViewProps = {
    sessionId: string;
    onBack: () => void;
};

type Step = 'participants' | 'plan' | 'materials' | 'attendance' | 'assessments' | 'messages';


type ParticipantRecord = {
    id: string;
    full_name: string;
    email: string;
    attendance_status: 'enrolled' | 'attended' | 'absent';
    assessment: {
        score: number | null;
        result: 'pass' | 'fail' | 'pending';
        remarks: string;
    } | null;
};

export default function ManageSessionView({ sessionId, onBack }: ManageSessionViewProps) {
    const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);


    const [activities, setActivities] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [newActivity, setNewActivity] = useState({ title: '', day_order: 1, description: '' });
    const [newDoc, setNewDoc] = useState({ title: '', url: '', type: 'material' });
    const [uploading, setUploading] = useState(false);

    const [activeStep, setActiveStep] = useState<Step>('participants');

    // Session Info
    const [sessionTitle, setSessionTitle] = useState('');

    useEffect(() => {
        if (sessionId) fetchData();
    }, [sessionId]);

    const fetchData = async () => {
        setLoading(true);

        // 1. Get Session Info
        const { data: sData } = await supabase
            .from('sessions')
            .select('training_standard:training_standards(title)')
            .eq('id', sessionId)
            .single();
        if (sData) setSessionTitle((sData as any).training_standard.title);

        // 2. Get Participants
        const { data: pData } = await supabase
            .from('session_participants')
            .select(`
                participant:users(id, full_name, email),
                attendance_status
            `)
            .eq('session_id', sessionId);

        // 3. Get Assessments (if any)
        const { data: aData } = await supabase
            .from('assessments')
            .select('*')
            .eq('session_id', sessionId);

        if (pData) {
            const merged = pData.map((row: any) => {
                const existingAssessment = aData?.find((a: any) => a.participant_id === row.participant.id);
                return {
                    id: row.participant.id,
                    full_name: row.participant.full_name,
                    email: row.participant.email,
                    attendance_status: row.attendance_status,
                    assessment: existingAssessment ? {
                        score: existingAssessment.score,
                        result: existingAssessment.result,
                        remarks: existingAssessment.remarks
                    } : { score: null, result: 'pending', remarks: '' }
                };
            });
            setParticipants(merged as ParticipantRecord[]);
        }

        // 4. Get Activities
        const { data: actData } = await supabase
            .from('planned_activities')
            .select('*')
            .eq('session_id', sessionId)
            .order('day_order', { ascending: true });
        if (actData) setActivities(actData);

        // 5. Get Documents
        const { data: docData } = await supabase
            .from('documents')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false });
        if (docData) setDocuments(docData);

        setLoading(false);
    };

    // ... (Attendance handlers remain same)

    const handleAttendanceChange = async (userId: string, newStatus: string) => {
        // Optimistic update
        setParticipants(prev => prev.map(p =>
            p.id === userId ? { ...p, attendance_status: newStatus as any } : p
        ));

        await supabase
            .from('session_participants')
            .update({ attendance_status: newStatus })
            .eq('session_id', sessionId)
            .eq('participant_id', userId);
    };

    const handleScoreChange = (userId: string, score: number) => {
        setParticipants(prev => prev.map(p => {
            if (p.id !== userId) return p;
            const assessment = p.assessment || { score: 0, result: 'pending' as const, remarks: '' };
            return { ...p, assessment: { ...assessment, score } };
        }));
    };

    const handleResultChange = (userId: string, result: 'pass' | 'fail' | 'pending') => {
        setParticipants(prev => prev.map(p => {
            if (p.id !== userId) return p;
            const assessment = p.assessment || { score: 0, result: 'pending' as const, remarks: '' };
            return { ...p, assessment: { ...assessment, result } };
        }));
    };

    const saveAssessments = async () => {
        setSaving(true);
        const upsertData = participants.map(p => ({
            session_id: sessionId,
            participant_id: p.id,
            score: p.assessment?.score,
            result: p.assessment?.result,
            remarks: p.assessment?.remarks
        }));

        const { error } = await supabase
            .from('assessments')
            .upsert(upsertData, { onConflict: 'session_id, participant_id' });

        if (error) {
            alert("Error saving grades: " + error.message);
        } else {
            alert("Grades saved successfully!");
        }
        setSaving(false);
    };

    const handleAddActivity = async () => {
        const { error } = await supabase.from('planned_activities').insert([{
            ...newActivity,
            session_id: sessionId,
            created_by: user?.id
        }]);
        if (!error) {
            setNewActivity({ title: '', day_order: 1, description: '' });
            fetchData();
        } else {
            alert("Failed to add activity: " + error.message);
        }
    };

    const handleDeleteActivity = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        await supabase.from('planned_activities').delete().eq('id', id);
        fetchData();
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `session_docs/${sessionId}/${Date.now()}.${fileExt}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('resources')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: publicUrl } = supabase.storage.from('resources').getPublicUrl(fileName);

            // Auto-save metadata
            const { error: insertError } = await supabase.from('documents').insert({
                session_id: sessionId,
                title: file.name, // Default to filename
                file_url: publicUrl.publicUrl,
                document_type: 'material', // Default
                uploaded_by: user?.id
            });

            if (insertError) throw insertError;

            fetchData();
            alert("File uploaded successfully!");

        } catch (error: any) {
            console.error(error);
            alert("Upload failed: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleAddDocumentLink = async () => {
        // Manual link addition
        const { error } = await supabase.from('documents').insert([{
            title: newDoc.title,
            file_url: newDoc.url,
            document_type: newDoc.type,
            session_id: sessionId,
            uploaded_by: user?.id
        }]);
        if (!error) {
            setNewDoc({ title: '', url: '', type: 'material' });
            fetchData();
        }
    };

    const handleDeleteDocument = async (id: string) => {
        if (!confirm("Delete this document?")) return;
        await supabase.from('documents').delete().eq('id', id);
        fetchData();
    };

    const steps = [
        { id: 'participants', label: 'Participants', icon: Users },
        { id: 'plan', label: "Today's Plan", icon: Clock },
        { id: 'materials', label: 'Materials', icon: FilePlus },
        { id: 'attendance', label: 'Attendance', icon: CheckCircle },
        { id: 'assessments', label: 'Assessments', icon: Save },
        { id: 'messages', label: 'Session Chat', icon: Bell },
    ];

    return (
        <div className="flex h-[calc(100vh-100px)] -m-8 overflow-hidden bg-[#F5F7FA] dark:bg-[#0A0A0A]">
            {/* LEFT RAIL */}
            <div className="w-80 bg-white dark:bg-[#141414] border-r border-gray-200 dark:border-white/5 flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-white/5">
                    <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-4 text-sm font-medium">
                        <ArrowLeft className="h-4 w-4" /> Exit Session
                    </button>
                    <h2 className="font-bold text-xl text-gray-900 dark:text-white leading-tight">{sessionTitle}</h2>
                    <div className="flex items-center gap-2 mt-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Session
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-6 space-y-2 px-4">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = activeStep === step.id;
                        return (
                            <button
                                key={step.id}
                                onClick={() => setActiveStep(step.id as Step)}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all relative ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 dark:text-gray-400'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/5 group-hover:bg-white/10'}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                        Step {index + 1}: {step.label}
                                    </p>
                                </div>
                                {isActive && (
                                    <motion.div layoutId="active-pill" className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-black/20">
                    {/* Mini progress or status */}
                    <p className="text-xs text-center text-gray-400 font-medium">Session Progress: 40%</p>
                    <div className="h-1 w-full bg-gray-200 dark:bg-white/10 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[40%]" />
                    </div>
                </div>
            </div>

            {/* MAIN WORK AREA */}
            <div className="flex-1 overflow-y-auto p-8 relative">


                {/* TAB CONTENT: PARTICIPANTS (Cards) */}
                {activeStep === 'participants' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Participants</h2>
                                <p className="text-gray-500">Manage your roster. Tap to toggle attendance.</p>
                            </div>
                            <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 px-4 py-2 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300">
                                Total: {participants.length}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {participants.map(p => (
                                <div key={p.id} className="group bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-2 h-full ${p.attendance_status === 'attended' ? 'bg-emerald-500' :
                                        p.attendance_status === 'absent' ? 'bg-red-500' : 'bg-gray-200 dark:bg-white/10'
                                        }`} />

                                    <div className="pl-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-12 w-12 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center font-bold text-lg text-gray-600 dark:text-gray-300">
                                                {p.full_name.charAt(0)}
                                            </div>
                                            <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                                <MoreVertical className="h-5 w-5" />
                                            </button>
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{p.full_name}</h3>
                                        <p className="text-sm text-gray-500 truncate">{p.email}</p>

                                        <div className="mt-6 flex gap-2">
                                            <button
                                                onClick={() => handleAttendanceChange(p.id, p.attendance_status === 'attended' ? 'enrolled' : 'attended')}
                                                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${p.attendance_status === 'attended'
                                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-white/5 dark:text-gray-400'
                                                    }`}
                                            >
                                                {p.attendance_status === 'attended' ? 'Present' : 'Mark Present'}
                                            </button>
                                            <button
                                                onClick={() => handleAttendanceChange(p.id, p.attendance_status === 'absent' ? 'enrolled' : 'absent')}
                                                className={`px-3 py-2 rounded-lg font-bold text-sm transition-colors ${p.attendance_status === 'absent'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-700 dark:bg-white/5'
                                                    }`}
                                            >
                                                Abs
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* TAB CONTENT: PLAN (Timeline) */}
                {activeStep === 'plan' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-3xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Today's Plan</h2>
                                <p className="text-gray-500">Keep your session on track.</p>
                            </div>
                            <button onClick={() => { }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Start Timer
                            </button>
                        </div>

                        <div className="relative border-l-2 border-gray-200 dark:border-white/10 ml-8 space-y-12">
                            {activities.map((act, idx) => (
                                <div key={act.id} className="relative pl-12 group">
                                    <div className={`
                                    absolute -left-[11px] top-0 h-6 w-6 rounded-full border-4 border-white dark:border-[#0A0A0A] transition-colors
                                    ${idx === 0 ? 'bg-blue-600 shadow-lg shadow-blue-500/50 scale-125' : 'bg-gray-300 dark:bg-white/20'}
                                `} />

                                    <div className={`p-6 bg-white dark:bg-[#141414] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm transition-all ${idx === 0 ? 'ring-2 ring-blue-500 shadow-xl' : 'hover:shadow-md'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{act.title}</h3>
                                            <span className="bg-gray-100 dark:bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase text-gray-500">60 Min</span>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                                            {act.description}
                                        </p>
                                        <button className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            View Details <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Add New Slot */}
                            <div className="relative pl-12">
                                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-gray-200 dark:bg-white/10 border-4 border-white dark:border-[#0A0A0A]" />
                                <div className="p-6 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-center hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors cursor-pointer" onClick={() => { }}>
                                    <p className="text-gray-400 font-bold">+ Add Activity</p>
                                </div>
                            </div>
                        </div>

                        {/* New Activity Form implementation can go here or in modal */}
                        <div className="mt-12 bg-white dark:bg-[#141414] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/5">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Add Activity</h3>
                            <div className="space-y-3">
                                <input value={newActivity.title} onChange={e => setNewActivity({ ...newActivity, title: e.target.value })} placeholder="Activity Title" className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                                <textarea value={newActivity.description} onChange={e => setNewActivity({ ...newActivity, description: e.target.value })} placeholder="Description" className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" />
                                <button onClick={handleAddActivity} className="w-full bg-gray-900 dark:bg-white hover:bg-gray-800 text-white dark:text-black font-bold py-3 rounded-xl transition-colors">Add to Timeline</button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* TAB CONTENT: ATTENDANCE */}
                {activeStep === 'attendance' && (
                    <>
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={saveAssessments}
                                disabled={saving}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Grades'}
                            </button>
                        </div>
                        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th className="px-6 py-4 font-bold uppercase">Participant</th>
                                        <th className="px-6 py-4 font-bold uppercase">Attendance</th>
                                        <th className="px-6 py-4 font-bold uppercase">Score (0-100)</th>
                                        <th className="px-6 py-4 font-bold uppercase">Result</th>
                                        <th className="px-6 py-4 font-bold uppercase">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {loading ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading student list...</td></tr>
                                    ) : participants.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">No participants enrolled in this session.</td></tr>
                                    ) : (
                                        participants.map(p => (
                                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900 dark:text-white">{p.full_name}</div>
                                                    <div className="text-xs text-gray-500">{p.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={p.attendance_status}
                                                        onChange={(e) => handleAttendanceChange(p.id, e.target.value)}
                                                        className={`
                                                        px-3 py-1.5 rounded-lg text-xs font-bold uppercase border outline-none cursor-pointer transition-colors
                                                        ${p.attendance_status === 'attended' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20' :
                                                                p.attendance_status === 'absent' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-500 dark:border-red-500/20' :
                                                                    'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-white/10'}
                                                    `}
                                                    >
                                                        <option value="enrolled">Enrolled</option>
                                                        <option value="attended">Attended</option>
                                                        <option value="absent">Absent</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        min="0" max="100"
                                                        value={p.assessment?.score ?? ''}
                                                        onChange={(e) => handleScoreChange(p.id, Number(e.target.value))}
                                                        placeholder="-"
                                                        className="w-20 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleResultChange(p.id, 'pass')}
                                                            className={`p-1.5 rounded disabled:opacity-50 transition-colors ${p.assessment?.result === 'pass' ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-400 hover:bg-gray-300 dark:hover:bg-white/20'}`}
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleResultChange(p.id, 'fail')}
                                                            className={`p-1.5 rounded disabled:opacity-50 transition-colors ${p.assessment?.result === 'fail' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-400 hover:bg-gray-300 dark:hover:bg-white/20'}`}
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleResultChange(p.id, 'pending')}
                                                            className={`p-1.5 rounded disabled:opacity-50 transition-colors ${p.assessment?.result === 'pending' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-400 hover:bg-gray-300 dark:hover:bg-white/20'}`}
                                                        >
                                                            <Clock className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="text"
                                                        placeholder="Optional remarks..."
                                                        value={p.assessment?.remarks || ''}
                                                        onChange={(e) => {
                                                            setParticipants(prev => prev.map(x => x.id === p.id ? { ...x, assessment: { ...x.assessment!, remarks: e.target.value } } : x))
                                                        }}
                                                        className="w-full bg-transparent border-b border-dashed border-gray-300 dark:border-white/10 focus:border-blue-500 outline-none text-xs dark:text-gray-300"
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* TAB CONTENT: MATERIALS (Drop & Go) */}
                {activeStep === 'materials' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Session Materials</h2>
                            <p className="text-gray-500">Drag and drop files to share with participants immediately.</p>
                        </div>

                        {/* BIG DROP ZONE */}
                        <div className="border-4 border-dashed border-gray-200 dark:border-white/10 rounded-3xl p-12 text-center hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all cursor-pointer group relative">
                            <input
                                type="file"
                                onChange={handleUpload}
                                disabled={uploading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                            />
                            <div className="h-20 w-20 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform text-blue-600 dark:text-blue-400">
                                <Upload className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{uploading ? 'Uploading...' : 'Drop files here'}</h3>
                            <p className="text-gray-500">PDF, PPTX, or Video. Automatically shared.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {documents.map(doc => (
                                <div key={doc.id} className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/5 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
                                    <div>
                                        <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                                            <FilePlus className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2">{doc.title}</h3>
                                        <p className="text-xs uppercase font-bold text-gray-400 mt-1">{doc.document_type}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 hover:underline">Download</a>
                                        <button onClick={() => handleDeleteDocument(doc.id)} className="text-gray-400 hover:text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* TAB CONTENT: ASSESSMENTS (Focus Mode) */}
                {activeStep === 'assessments' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[50vh]">
                        <div className="max-w-xl w-full">
                            <div className="text-center mb-10">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Grading Mode</h2>
                                <p className="text-gray-500">Focus on one student at a time.</p>
                            </div>

                            {/* SIMPLE CAROUSEL MOCKUP - In real app, manage active index */}
                            {participants.length > 0 ? (
                                <div className="bg-white dark:bg-[#141414] rounded-3xl border border-gray-200 dark:border-white/5 shadow-2xl p-10 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
                                        <div className="h-full bg-blue-500" style={{ width: '25%' }} /> {/* Progress Bar */}
                                    </div>

                                    <div className="text-center mb-8">
                                        <div className="h-24 w-24 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-gray-500">
                                            {participants[0].full_name.charAt(0)}
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{participants[0].full_name}</h3>
                                        <p className="text-gray-500">{participants[0].email}</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Score (0-100)</label>
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => handleScoreChange(participants[0].id, Math.max(0, (participants[0].assessment?.score || 0) - 5))} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10"><ChevronLeft className="h-4 w-4" /></button>
                                                <input
                                                    type="number"
                                                    value={participants[0].assessment?.score ?? ''}
                                                    onChange={e => handleScoreChange(participants[0].id, Number(e.target.value))}
                                                    className="flex-1 text-center text-4xl font-bold bg-transparent border-none outline-none"
                                                    placeholder="-"
                                                />
                                                <button onClick={() => handleScoreChange(participants[0].id, Math.min(100, (participants[0].assessment?.score || 0) + 5))} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10"><ChevronRight className="h-4 w-4" /></button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            {['pass', 'fail', 'pending'].map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleResultChange(participants[0].id, status as any)}
                                                    className={`py-3 rounded-xl font-bold uppercase text-sm transition-all ${participants[0].assessment?.result === status
                                                        ? (status === 'pass' ? 'bg-emerald-500 text-white' : status === 'fail' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white')
                                                        : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Student 1 of {participants.length}</span>
                                        <button onClick={() => { }} className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
                                            Next Student
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500">No students to grade.</div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* TAB CONTENT: ATTENDANCE (Quick View) */}
                {activeStep === 'attendance' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto text-center">
                        <div className="h-32 w-32 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Attendance Check</h2>
                        <p className="text-gray-500 mb-8">You have managed attendance in the Participants view. Is everyone accounted for?</p>

                        <div className="bg-white dark:bg-[#141414] p-8 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm mb-8">
                            <div className="grid grid-cols-3 gap-4 divide-x divide-gray-100 dark:divide-white/5">
                                <div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{participants.filter(p => p.attendance_status === 'attended').length}</p>
                                    <p className="text-xs uppercase font-bold text-gray-500 mt-1">Present</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{participants.filter(p => p.attendance_status === 'absent').length}</p>
                                    <p className="text-xs uppercase font-bold text-gray-500 mt-1">Absent</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{participants.filter(p => p.attendance_status === 'enrolled').length}</p>
                                    <p className="text-xs uppercase font-bold text-gray-500 mt-1">Unmarked</p>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setActiveStep('participants')} className="text-blue-600 font-bold hover:underline">
                            Go back to Participants list to adjust
                        </button>
                    </motion.div>
                )}

                {/* TAB CONTENT: MESSAGES */}
                {activeStep === 'messages' && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-12">
                        <div className="h-20 w-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                            <Bell className="h-8 w-8 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Session Chat</h2>
                        <p className="text-gray-500 max-w-sm mt-2">Chat with your participants here. Announcements are pinned to the top of their dashboard.</p>
                        <div className="mt-8">
                            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30">Start Discussion</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
