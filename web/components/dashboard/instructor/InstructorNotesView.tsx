"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { 
    FileText, 
    Search, 
    ChevronRight, 
    BookOpen, 
    Clock, 
    CheckCircle, 
    MoreHorizontal,
    Layout,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import CourseNotesEditor from './CourseNotesEditor';

export default function InstructorNotesView() {
    const { user, profile } = useAuth();
    const [courses, setCourses] = useState<any[]>([]);
    const [allNotes, setAllNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNote, setSelectedNote] = useState<{ note: any, mode: 'preview' | 'edit' } | null>(null);

    useEffect(() => {
        if (profile?.id) fetchAllData();
    }, [profile?.id]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // 1. Fetch instructor's courses
            const { data: staffData } = await supabase
                .from('course_staff')
                .select('course_id')
                .eq('user_id', profile?.id);
            
            const courseIds = staffData?.map(s => s.course_id) || [];
            
            if (courseIds.length > 0) {
                const { data: courseData } = await supabase
                    .from('courses')
                    .select('id, title_en, title_fr')
                    .in('id', courseIds);
                setCourses(courseData || []);

                // 2. Fetch all notes for these courses
                const { data: noteData } = await supabase
                    .from('course_notes')
                    .select('*')
                    .in('course_id', courseIds)
                    .order('updated_at', { ascending: false });
                setAllNotes(noteData || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredNotes = allNotes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getCourseName = (courseId: string) => {
        return courses.find(c => c.id === courseId)?.title_en || 'Unknown Course';
    };

    if (selectedNote) {
        return (
            <div className="fixed inset-0 z-[100] bg-white dark:bg-[#0f0f1a]">
                <CourseNotesEditor 
                    note={selectedNote.note} 
                    courseName={getCourseName(selectedNote.note.course_id)}
                    initialPreview={selectedNote.mode === 'preview'}
                    onClose={(updated) => {
                        setSelectedNote(null);
                        if (updated) fetchAllData();
                    }} 
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lesson Notes</h1>
                    <p className="text-slate-500 font-bold mt-1.5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        Manage curriculum across all your courses
                    </p>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search by note title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-100 pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all font-medium text-sm shadow-sm placeholder:text-slate-400"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-40">
                    <div className="w-8 h-8 rounded-full border-2 border-black border-t-transparent animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredNotes.map((note) => (
                        <motion.div 
                            key={note.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative bg-white border border-slate-100 p-8 rounded-[2.5rem] hover:shadow-2xl hover:shadow-blue-500/5 transition-all text-center flex flex-col items-center"
                        >
                            <div className="absolute top-8 right-8 flex items-center gap-2">
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                    note.status === 'published' 
                                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                        : "bg-slate-50 text-slate-400 border border-slate-100"
                                )}>
                                    {note.status}
                                </div>
                            </div>

                            <div 
                                onClick={() => setSelectedNote({ note, mode: 'preview' })}
                                className="w-32 h-32 mb-8 transition-transform group-hover:scale-110 duration-500 cursor-pointer drop-shadow-2xl"
                            >
                                <img src="/icons/note_icon_3d.png" alt="Note Icon" className="w-full h-full object-contain" />
                            </div>

                            <div className="flex-1 space-y-2.5 mb-8">
                                <h3 className="text-xl font-black text-slate-900 line-clamp-2 leading-tight px-4 group-hover:text-blue-600 transition-colors">
                                    {note.title}
                                </h3>
                                <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100 inline-flex">
                                    <BookOpen className="w-3 h-3" />
                                    {getCourseName(note.course_id)}
                                </div>
                            </div>

                            <button 
                                onClick={() => setSelectedNote({ note, mode: 'edit' })}
                                className={cn(
                                    "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all",
                                    "bg-[#12388D] text-white hover:bg-[#0E2C6F] shadow-lg shadow-blue-900/10 active:scale-95",
                                    "flex items-center justify-center gap-2"
                                )}
                            >
                                <span>Open Editor</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    ))}

                    {filteredNotes.length === 0 && (
                        <div className="col-span-full py-40 border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-center bg-white/50">
                            <div className="w-20 h-20 mb-6 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                                <BookOpen className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-900 font-black text-xl tracking-tight">No lesson notes found</p>
                            <p className="text-slate-500 font-bold text-sm mt-2 max-w-xs mx-auto">Start by creating lesson content from within your specific course modules.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
