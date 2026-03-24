"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
    ChevronLeft, 
    BookOpen, 
    FileText,
    UserCircle,
    Mail,
    Phone,
    Download,
    Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
// Note Editor component repurposed as a Read-Only Viewer
import CourseNotesEditor from '@/components/dashboard/instructor/CourseNotesEditor';

interface TraineeCourseDetailViewProps {
    course: any;
    participantId: string;
    onBack: () => void;
}

export default function TraineeCourseDetailView({ course, participantId, onBack }: TraineeCourseDetailViewProps) {
    const [activeTab, setActiveTab] = useState<'notes' | 'materials' | 'instructor'>('notes');
    const [notes, setNotes] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    const [instructor, setInstructor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [readingNote, setReadingNote] = useState<any | null>(null);

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
                    .eq('status', 'published') // Only trainees see published notes
                    .order('created_at', { ascending: false });
                setNotes(data || []);
            } else if (activeTab === 'instructor') {
                const { data } = await supabase
                    .from('course_staff')
                    .select('*, user:users(id, full_name, email, phone)')
                    .eq('course_id', course.id)
                    .limit(1)
                    .single();
                setInstructor(data?.user || null);
            } else if (activeTab === 'materials') {
                // Fetch materials based on session or course
                const { data } = await supabase
                    .from('documents')
                    .select('*')
                    .eq('session_id', course.session_id || '00000000-0000-0000-0000-000000000000');
                setMaterials(data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
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
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider">
                                Enrolled
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                ID: {course.id.split('-')[0]}
                            </span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{course.title_en}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 p-1.5 rounded-2xl shadow-sm overflow-x-auto">
                    {[
                        { id: 'notes', label: 'Curriculum', icon: BookOpen },
                        { id: 'materials', label: 'Docs', icon: FileText },
                        { id: 'instructor', label: 'Instructor Details', icon: UserCircle },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
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
                        {/* NOTES TAB */}
                        {activeTab === 'notes' && (
                            <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Curriculum Notes</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {notes.map(note => (
                                        <motion.div 
                                            key={note.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="group relative bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 p-6 rounded-[2.5rem] hover:shadow-2xl hover:shadow-blue-500/5 transition-all text-center flex flex-col items-center"
                                        >
                                            <div className="absolute top-6 right-6 flex items-center gap-2">
                                                <div className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600">
                                                    Official
                                                </div>
                                            </div>

                                            <div className="w-24 h-24 mb-6 transition-transform group-hover:scale-110 duration-500">
                                                <img src="/icons/note_icon_3d.png" alt="Note Icon" className="w-full h-full object-contain" />
                                            </div>

                                            <div className="flex-1 space-y-2 mb-6">
                                                <h3 className="text-lg font-black text-gray-900 dark:text-white line-clamp-2 leading-tight px-4">{note.title}</h3>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{course.title_en}</p>
                                            </div>

                                            <button 
                                                onClick={() => setReadingNote(note)}
                                                className="w-full py-4 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                                            >
                                                Read Lesson
                                            </button>
                                        </motion.div>
                                    ))}
                                    {notes.length === 0 && (
                                        <div className="col-span-full py-20 bg-white/50 dark:bg-white/5 border-2 border-dashed border-gray-100 dark:border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-center">
                                            <Layout className="w-12 h-12 text-gray-200 mb-4" />
                                            <p className="text-gray-400 font-bold">No curriculum published yet.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* INFO / INSTRUCTOR TAB */}
                        {activeTab === 'instructor' && (
                            <motion.div key="instructor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                {!instructor ? (
                                    <div className="py-20 flex flex-col items-center text-center opacity-50">
                                        <UserCircle className="w-16 h-16 text-gray-300 mb-4" />
                                        <p className="text-gray-500 font-bold">No instructor assigned yet.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 max-w-2xl">
                                        <div className="w-32 h-32 rounded-full bg-blue-50 border-4 border-white shadow-xl flex items-center justify-center text-blue-600 font-black text-5xl">
                                            {instructor.full_name?.charAt(0) || 'I'}
                                        </div>
                                        <div className="space-y-4 text-center md:text-left">
                                            <div>
                                                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-600 mb-3 inline-block">
                                                    Lead Instructor
                                                </span>
                                                <h2 className="text-3xl font-black text-gray-900 dark:text-white">{instructor.full_name}</h2>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-center md:justify-start gap-3 text-sm font-bold text-gray-500">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    {instructor.email}
                                                </div>
                                                {instructor.phone && (
                                                    <div className="flex items-center justify-center md:justify-start gap-3 text-sm font-bold text-gray-500">
                                                        <Phone className="w-4 h-4 text-gray-400" />
                                                        {instructor.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* MATERIALS TAB */}
                        {activeTab === 'materials' && (
                            <motion.div key="materials" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-6">
                                    {materials.length === 0 ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
                                            <FileText className="w-12 h-12 text-gray-300 mb-4" />
                                            <p className="font-bold text-gray-500">No additional materials shared.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {materials.map(doc => (
                                                <a 
                                                    key={doc.id}
                                                    href={doc.file_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-gray-100 transition-all group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm">
                                                            {doc.cover_url ? (
                                                                <img src={doc.cover_url} alt="Cover" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <FileText className="w-5 h-5 text-blue-500" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{doc.title}</p>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{doc.file_type || 'Document'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-3 rounded-xl bg-white shadow-sm text-gray-400 group-hover:text-blue-600 transition-colors">
                                                        <Download className="w-4 h-4" />
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Read-Only Note Viewer Overlay */}
            <AnimatePresence>
                {readingNote && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] bg-white dark:bg-[#0f0f1a] overflow-y-auto"
                    >
                        <CourseNotesEditor 
                            note={readingNote} 
                            courseName={course.title_en}
                            onClose={() => setReadingNote(null)} 
                            isReadOnly={true}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
