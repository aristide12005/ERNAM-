"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { 
    Plus, 
    Search, 
    BookOpen, 
    Clock, 
    Users, 
    MoreHorizontal, 
    ChevronRight,
    Loader2,
    CheckCircle2,
    Calendar,
    Globe,
    LayoutGrid,
    List,
    Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import InstructorCourseDetailView from './InstructorCourseDetailView';

interface Course {
    id: string;
    title_en: string;
    title_fr: string;
    description_en?: string;
    course_status: string;
    duration?: string;
    session_id?: string;
}

export default function InstructorCoursesView({ instructorId }: { instructorId: string }) {
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
    const [courses, setCourses] = useState<Course[]>([]);
    const [otherCourses, setOtherCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // Create Flow State
    const [step, setStep] = useState(1);
    const [standards, setStandards] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        standard_id: '',
        session_id: '',
        name: '',
        description: '',
        duration: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCourses();
        fetchMetadata();
    }, [instructorId]);

    const fetchMetadata = async () => {
        const { data: stds } = await supabase.from('training_standards').select('id, title, code');
        const { data: sess } = await supabase.from('sessions').select('id, start_date').order('start_date', { ascending: false });
        if (stds) setStandards(stds);
        if (sess) setSessions(sess);
    };

    const fetchCourses = async () => {
        setLoading(true);
        try {
            // My Courses (via course_staff)
            const { data: myStaff } = await supabase
                .from('course_staff')
                .select('course_id')
                .eq('user_id', instructorId);
            
            const myCourseIds = (myStaff || []).map(s => s.course_id);

            let myCoursesData = [];
            let allCoursesData = [];

            if (myCourseIds.length > 0) {
                const { data } = await supabase
                    .from('courses')
                    .select('*')
                    .in('id', myCourseIds);
                myCoursesData = data || [];
            }
            
            // Other Courses
            const { data: allCourses } = await supabase
                .from('courses')
                .select('*')
                .filter('id', 'not.in', `(${myCourseIds.join(',') || '00000000-0000-0000-0000-000000000000'})`);

            setCourses(myCoursesData);
            setOtherCourses(allCourses || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCourse = async () => {
        setSubmitting(true);
        try {
            // Minimalist creation logic
            let targetSessionId = formData.session_id;
            
            if (!targetSessionId) {
                // Create a default session if user didn't specify
                const { data: newSess, error: sessErr } = await supabase
                    .from('sessions')
                    .insert({
                        status: 'planned',
                        start_date: new Date().toISOString(),
                        end_date: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days default
                        location: 'Virtual Classroom',
                        training_standard_id: formData.standard_id || null
                    })
                    .select()
                    .single();
                
                if (sessErr) throw sessErr;
                targetSessionId = newSess.id;

                // Also link instructor to this session
                await supabase.from('session_instructors').insert({
                    session_id: targetSessionId,
                    instructor_id: instructorId
                });
            }

            const { data: newCourse, error: courseErr } = await supabase
                .from('courses')
                .insert({
                    title_en: formData.name,
                    description_en: formData.description,
                    session_id: targetSessionId,
                    training_standard_id: formData.standard_id || null,
                    course_status: 'published' // Default as requested
                })
                .select()
                .single();

            if (courseErr) throw courseErr;

            // Link instructor to the course via course_staff
            await supabase.from('course_staff').insert({
                course_id: newCourse.id,
                user_id: instructorId,
                role: 'owner'
            });

            setIsCreateModalOpen(false);
            setStep(1);
            setFormData({ standard_id: '', session_id: '', name: '', description: '', duration: '' });
            fetchCourses();
            toast.success(`Course "${formData.name}" created successfully!`);
        } catch (e) {
            console.error(e);
            toast.error("Failed to create course");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Courses</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium italic">Manage and explore training modules</p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-black dark:bg-white dark:text-black text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-black/5"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create Course</span>
                </button>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 p-2 rounded-3xl shadow-sm">
                <div className="flex gap-1">
                    <button 
                        onClick={() => setActiveTab('my')}
                        className={cn(
                            "px-6 py-2.5 rounded-2xl text-sm font-bold transition-all",
                            activeTab === 'my' ? "bg-black text-white shadow-md" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        My Courses
                    </button>
                    <button 
                        onClick={() => setActiveTab('all')}
                        className={cn(
                            "px-6 py-2.5 rounded-2xl text-sm font-bold transition-all",
                            activeTab === 'all' ? "bg-black text-white shadow-md" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        Other Courses
                    </button>
                </div>
                <div className="relative w-full md:w-80 pr-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search courses..." 
                        className="w-full bg-gray-50 dark:bg-black/20 border-none rounded-2xl py-2.5 pl-11 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                    />
                </div>
            </div>

            {/* Course Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(activeTab === 'my' ? courses : otherCourses).map((course) => (
                        <div 
                            key={course.id} 
                            onClick={() => setSelectedCourse(course)}
                            className="group bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 rounded-[2rem] p-6 hover:shadow-xl hover:shadow-black/5 transition-all duration-300 relative overflow-hidden cursor-pointer active:scale-[0.98]"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                    course.course_status === 'published' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                )}>
                                    {course.course_status}
                                </span>
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 line-clamp-1">{course.title_en}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 font-medium leading-relaxed">
                                {course.description_en || "No description provided for this training module."}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs font-bold text-gray-400 mt-auto pt-6 border-t border-gray-50 dark:border-white/5">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    <span>{course.duration || 'Flexible'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4" />
                                    <span>Assignees</span>
                                </div>
                            </div>

                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 hover:bg-gray-50 rounded-full">
                                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {(activeTab === 'my' ? courses : otherCourses).length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[3rem]">
                            <LayoutGrid className="w-12 h-12 text-gray-200 mb-4" />
                            <p className="text-gray-400 font-bold">No courses found</p>
                            <button 
                                onClick={() => setIsCreateModalOpen(true)}
                                className="mt-4 text-sm font-black text-black dark:text-white underline underline-offset-4"
                            >
                                Create your first one
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Render Detail View as Overlay or Replacement */}
            <AnimatePresence>
                {selectedCourse && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="fixed inset-0 z-[60] bg-gray-50 dark:bg-[#0f0f1a] overflow-y-auto"
                    >
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            <InstructorCourseDetailView 
                                course={selectedCourse} 
                                instructorId={instructorId}
                                onBack={() => setSelectedCourse(null)} 
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Minimalist Creation Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-[#1a1a2e] w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">New Course</h2>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Step {step} of 2</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {[1, 2].map(i => (
                                            <div key={i} className={cn("w-8 h-1 rounded-full transition-all", i <= step ? "bg-black dark:bg-white" : "bg-gray-100 dark:bg-white/10")} />
                                        ))}
                                    </div>
                                </div>

                                {step === 1 ? (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Training Standard</label>
                                            <select 
                                                value={formData.standard_id}
                                                onChange={(e) => setFormData({...formData, standard_id: e.target.value})}
                                                className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="">Select a Standard (Optional)</option>
                                                {standards.map(s => <option key={s.id} value={s.id}>{s.code} - {s.title}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Active Session</label>
                                            <select 
                                                value={formData.session_id}
                                                onChange={(e) => setFormData({...formData, session_id: e.target.value})}
                                                className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="">Create New (Unclassified)</option>
                                                {sessions.map(s => <option key={s.id} value={s.id}>Session: {new Date(s.start_date).toLocaleDateString()}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Course Name</label>
                                            <input 
                                                autoFocus
                                                type="text" 
                                                value={formData.name}
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                placeholder="e.g. Advanced Security Protocols"
                                                className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                                            <textarea 
                                                rows={3}
                                                value={formData.description}
                                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                                placeholder="Brief overview of the course content..."
                                                className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none resize-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 pt-0 flex gap-3">
                                {step === 1 ? (
                                    <button 
                                        onClick={() => setStep(2)}
                                        className="flex-1 bg-black dark:bg-white dark:text-black text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-black/10 flex items-center justify-center gap-2 group"
                                    >
                                        <span>Continue</span>
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                ) : (
                                    <>
                                        <button 
                                            onClick={() => setStep(1)}
                                            className="px-6 py-4 rounded-2xl font-black text-sm border border-gray-100 dark:border-white/5 text-gray-400 hover:text-gray-900 transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button 
                                            onClick={handleCreateCourse}
                                            disabled={submitting || !formData.name}
                                            className="flex-1 bg-black dark:bg-white dark:text-black text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                                <>
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    <span>Create & Publish</span>
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
