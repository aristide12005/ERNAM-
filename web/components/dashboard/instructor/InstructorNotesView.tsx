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
    const [selectedNote, setSelectedNote] = useState<any | null>(null);

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
                    note={selectedNote} 
                    courseName={getCourseName(selectedNote.course_id)}
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Lesson Notes</h1>
                    <p className="text-gray-500 font-medium mt-1">Manage and publish curriculum across all your courses.</p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 pl-12 pr-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-medium text-sm"
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
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="group relative bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 p-8 rounded-[3rem] hover:shadow-2xl hover:shadow-purple-500/5 transition-all text-center flex flex-col items-center"
                        >
                            <div className="absolute top-8 right-8 flex items-center gap-2">
                                <div className={cn(
                                    "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider",
                                    note.status === 'published' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                )}>
                                    {note.status}
                                </div>
                            </div>

                            <div className="w-28 h-28 mb-8 transition-transform group-hover:scale-110 duration-500">
                                <img src="/icons/note_icon_3d.png" alt="Note Icon" className="w-full h-full object-contain" />
                            </div>

                            <div className="flex-1 space-y-2 mb-8">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white line-clamp-2 leading-tight px-4">{note.title}</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{getCourseName(note.course_id)}</p>
                            </div>

                            <button 
                                onClick={() => setSelectedNote(note)}
                                className="w-full py-4 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all group-hover:shadow-lg group-hover:shadow-black/5"
                            >
                                Open Editor
                            </button>
                        </motion.div>
                    ))}

                    {filteredNotes.length === 0 && (
                        <div className="col-span-full py-40 border-2 border-dashed border-gray-100 dark:border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-center">
                            <BookOpen className="w-12 h-12 text-gray-200 mb-4" />
                            <p className="text-gray-400 font-bold">No lesson notes found.</p>
                            <p className="text-gray-300 text-sm mt-1">Start by creating notes from within your courses.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
