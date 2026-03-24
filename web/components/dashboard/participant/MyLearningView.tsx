"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { 
    Search, 
    BookOpen, 
    Clock, 
    Users, 
    MoreHorizontal, 
    Loader2,
    LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import TraineeCourseDetailView from './TraineeCourseDetailView';

interface Course {
    id: string;
    title_en: string;
    title_fr: string;
    description_en?: string;
    course_status: string;
    duration?: string;
    session_id?: string;
}

export default function MyLearningView() {
    const { profile } = useAuth();
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
    const [myCourses, setMyCourses] = useState<Course[]>([]);
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.id) fetchCourses();
    }, [profile?.id]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            // 1. Get my enrolled sessions
            const { data: mySessions } = await supabase
                .from('session_participants')
                .select('session_id')
                .eq('participant_id', profile?.id);
            
            const mySessionIds = (mySessions || []).map(s => s.session_id);

            // 2. Fetch all published courses
            const { data: allCourses } = await supabase
                .from('courses')
                .select('*')
                .eq('course_status', 'published'); // Trainees only see published courses

            const _myCourses = allCourses?.filter(c => c.session_id && mySessionIds.includes(c.session_id)) || [];
            const _availableCourses = allCourses?.filter(c => !c.session_id || !mySessionIds.includes(c.session_id)) || [];

            setMyCourses(_myCourses);
            setAvailableCourses(_availableCourses);
        } catch (e) {
            console.error("Error fetching courses:", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header Area */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Learning Hub</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium italic">Explore your curriculum and discover new courses</p>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 p-2 rounded-3xl shadow-sm">
                <div className="flex gap-1">
                    <button 
                        onClick={() => setActiveTab('my')}
                        className={cn(
                            "px-6 py-2.5 rounded-2xl text-sm font-bold transition-all",
                            activeTab === 'my' ? "bg-black dark:bg-white text-white dark:text-black shadow-md" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        )}
                    >
                        My Courses
                    </button>
                    <button 
                        onClick={() => setActiveTab('all')}
                        className={cn(
                            "px-6 py-2.5 rounded-2xl text-sm font-bold transition-all",
                            activeTab === 'all' ? "bg-black dark:bg-white text-white dark:text-black shadow-md" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        )}
                    >
                        Available Courses
                    </button>
                </div>
                <div className="relative w-full md:w-80 pr-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search courses..." 
                        className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl py-2.5 pl-11 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none dark:text-white"
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
                    {(activeTab === 'my' ? myCourses : availableCourses).map((course) => (
                        <div 
                            key={course.id} 
                            onClick={() => setSelectedCourse(course)}
                            className="group bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 rounded-[2rem] p-6 hover:shadow-xl hover:shadow-black/5 transition-all duration-300 relative overflow-hidden cursor-pointer active:scale-[0.98]"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                    activeTab === 'my' ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"
                                )}>
                                    {activeTab === 'my' ? 'Enrolled' : 'Available'}
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
                            </div>

                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 hover:bg-gray-50 dark:hover:bg-white/10 rounded-full">
                                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {(activeTab === 'my' ? myCourses : availableCourses).length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[3rem]">
                            <LayoutGrid className="w-12 h-12 text-gray-200 dark:text-gray-600 mb-4" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                                {activeTab === 'my' ? 'No Enrolled Courses' : 'No Additional Courses Available'}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Course Detail Overlay */}
            <AnimatePresence>
                {selectedCourse && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="fixed inset-0 z-[60] bg-gray-50 dark:bg-[#0f0f1a] overflow-y-auto"
                    >
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            <TraineeCourseDetailView 
                                course={selectedCourse} 
                                participantId={profile?.id || ''}
                                onBack={() => setSelectedCourse(null)} 
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
