"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { 
    ChevronLeft, 
    BookOpen, 
    Users, 
    CalendarCheck, 
    Plus, 
    Search, 
    FileText,
    MoreVertical,
    CheckCircle2,
    Clock,
    UserCircle,
    Mail,
    Phone,
    Download,
    Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import CourseNotesEditor from './CourseNotesEditor';

interface InstructorCourseDetailViewProps {
    course: any;
    instructorId: string;
    onBack: () => void;
}

export default function InstructorCourseDetailView({ course, instructorId, onBack }: InstructorCourseDetailViewProps) {
    const [activeTab, setActiveTab] = useState<'notes' | 'trainees' | 'attendance'>('notes');
    const [notes, setNotes] = useState<any[]>([]);
    const [trainees, setTrainees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingNote, setEditingNote] = useState<any | null>(null);

    useEffect(() => {
        fetchData();
    }, [course.id, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'notes') {
                const { data } = await supabase
                    .from('course_notes')
                    .select('*')
                    .eq('course_id', course.id)
                    .order('created_at', { ascending: false });
                setNotes(data || []);
            } else if (activeTab === 'trainees' || activeTab === 'attendance') {
                // Fetch trainees from session_participants
                const { data } = await supabase
                    .from('session_participants')
                    .select(`
                        id,
                        attendance_status,
                        attendance_log,
                        participant:users (
                            id,
                            full_name,
                            email,
                            phone,
                            organization:organizations(name)
                        )
                    `)
                    .eq('session_id', course.session_id);
                setTrainees(data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAttendance = async (participantId: string, newStatus: string) => {
        try {
            // Optimistic update
            setTrainees(prev => prev.map(t => 
                t.id === participantId ? { ...t, attendance_status: newStatus } : t
            ));
            
            const { error } = await supabase
                .from('session_participants')
                .update({ attendance_status: newStatus })
                .eq('id', participantId);
                
            if (error) throw error;
            toast.success(`Attendance marked as ${newStatus}`);
        } catch (e) {
            console.error(e);
            toast.error('Failed to update attendance');
            fetchData(); // Rollback
        }
    };

    const handleCreateNote = () => {
        setEditingNote({ course_id: course.id, title: 'Untitled Note', status: 'draft' });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-wider">
                                {course.course_status}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                ID: {course.id.split('-')[0]}
                            </span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{course.title_en}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 p-1.5 rounded-2xl shadow-sm">
                    {[
                        { id: 'notes', label: 'Notes', icon: BookOpen },
                        { id: 'trainees', label: 'Trainees', icon: Users },
                        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                activeTab === tab.id 
                                    ? "bg-black text-white shadow-lg" 
                                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {loading ? (
                    <div className="flex items-center justify-center h-full pt-40">
                        <div className="w-8 h-8 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {activeTab === 'notes' && (
                            <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Curriculum & Study Materials</h2>
                                    <button 
                                        onClick={handleCreateNote}
                                        className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 dark:shadow-none"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Create Lesson Note</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {notes.map(note => (
                                        <motion.div 
                                            key={note.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="group relative bg-white border border-slate-100 p-6 rounded-[2.5rem] hover:shadow-2xl hover:shadow-blue-500/5 transition-all text-center flex flex-col items-center"
                                        >
                                            <div className="absolute top-6 right-6 flex items-center gap-2">
                                                <div className={cn(
                                                    "px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                                    note.status === 'published' 
                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                                        : "bg-slate-50 text-slate-400 border-slate-100"
                                                )}>
                                                    {note.status}
                                                </div>
                                            </div>

                                            <div className="w-24 h-24 mb-6 transition-transform group-hover:scale-110 duration-500 drop-shadow-xl">
                                                <img src="/icons/note_icon_3d.png" alt="Note Icon" className="w-full h-full object-contain" />
                                            </div>

                                            <div className="flex-1 space-y-2 mb-6">
                                                <h3 className="text-lg font-black text-slate-900 line-clamp-2 leading-tight px-4 group-hover:text-blue-600 transition-colors">{note.title}</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{course.title_en}</p>
                                            </div>

                                            <button 
                                                onClick={() => setEditingNote(note)}
                                                className="w-full py-4 rounded-2xl bg-[#12388D] text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#0E2C6F] transition-all shadow-lg shadow-blue-900/10 active:scale-95"
                                            >
                                                Open Lesson
                                            </button>
                                        </motion.div>
                                    ))}
                                    {notes.length === 0 && (
                                        <div className="col-span-full py-20 bg-white/50 dark:bg-white/5 border-2 border-dashed border-gray-100 dark:border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-center">
                                            <Layout className="w-12 h-12 text-gray-200 mb-4" />
                                            <p className="text-gray-400 font-bold">No curriculum notes found for this course.</p>
                                            <button onClick={handleCreateNote} className="mt-4 text-sm font-black text-purple-600 underline">Add your first lesson</button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'trainees' && (
                            <motion.div key="trainees" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-50 dark:border-white/5">
                                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Trainee</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Organization</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                            {trainees.map(t => (
                                                <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                                                <UserCircle className="w-6 h-6 text-gray-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-gray-900 dark:text-white capitalize">{t.participant?.full_name}</p>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.attendance_status}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{t.participant?.organization?.name || 'Independent'}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                                                <Mail className="w-3 h-3" />
                                                                <span>{t.participant?.email}</span>
                                                            </div>
                                                            {t.participant?.phone && (
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                                                    <Phone className="w-3 h-3" />
                                                                    <span>{t.participant.phone}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="p-2 rounded-xl hover:bg-white dark:hover:bg-white/5 hover:shadow-sm border border-transparent hover:border-gray-100 transition-all">
                                                            <MoreVertical className="w-4 h-4 text-gray-400" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'attendance' && (
                            <motion.div key="attendance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/20">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Present</p>
                                        <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{trainees.filter(t => t.attendance_status === 'attended').length}</h3>
                                    </div>
                                    <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-[2rem] border border-amber-100 dark:border-amber-900/20">
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Excused</p>
                                        <h3 className="text-2xl font-black text-amber-700 dark:text-amber-400">0</h3>
                                    </div>
                                    <div className="bg-rose-50 dark:bg-rose-900/10 p-6 rounded-[2rem] border border-rose-100 dark:border-rose-900/20">
                                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Absent</p>
                                        <h3 className="text-2xl font-black text-rose-700 dark:text-rose-400">{trainees.filter(t => t.attendance_status === 'absent').length}</h3>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-[2rem] border border-gray-100 dark:border-white/10">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Completion Rate</p>
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">85%</h3>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Attendance Sheet</h3>
                                        <button className="flex items-center gap-2 text-xs font-black text-purple-600 hover:underline">
                                            <Download className="w-4 h-4" />
                                            <span>Export CSV</span>
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {trainees.map(t => (
                                            <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-white/5 flex items-center justify-center">
                                                        <CheckCircle2 className={cn("w-4 h-4", t.attendance_status === 'attended' ? "text-emerald-500" : "text-gray-200")} />
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{t.participant?.full_name}</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    {['enrolled', 'attended', 'absent'].map(status => (
                                                        <button 
                                                            key={status}
                                                            onClick={() => handleUpdateAttendance(t.id, status)}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                                                t.attendance_status === status 
                                                                    ? (status === 'attended' ? "bg-emerald-500 text-white" : status === 'absent' ? "bg-rose-500 text-white" : "bg-gray-900 text-white")
                                                                    : "bg-white dark:bg-white/5 text-gray-400 hover:bg-gray-100"
                                                            )}
                                                        >
                                                            {status}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Note Editor Overlay */}
            <AnimatePresence>
                {editingNote && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] bg-white dark:bg-[#0f0f1a] overflow-y-auto"
                    >
                        <CourseNotesEditor 
                            note={editingNote} 
                            courseName={course.title_en}
                            onClose={(updated) => {
                                setEditingNote(null);
                                if (updated) fetchData();
                            }} 
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
