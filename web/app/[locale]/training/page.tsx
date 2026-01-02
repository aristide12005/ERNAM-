"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Calendar, Users, ArrowRight, Plane } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

type Course = {
    id: string;
    title_fr: string;
    description_fr: string;
    start_date: string;
    status: 'upcoming' | 'active' | 'completed';
    title_en?: string;
    description_en?: string;
}

export default function TrainingPage() {
    const t = useTranslations('Training');
    const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
    const [availableCourses, setAvailableCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            // Get all published courses
            const { data: allCourses, error: coursesError } = await supabase
                .from('courses')
                .select('*')
                .eq('course_status', 'published')
                .order('created_at', { ascending: false });

            // Get my enrollments
            const { data: myEnrollments, error: enrollError } = await supabase
                .from('enrollments')
                .select('*')
                .eq('user_id', user?.id);

            if (coursesError) console.error('Error fetching courses:', coursesError);
            if (enrollError) console.error('Error fetching enrollments:', enrollError);

            const enrolledCourseIds = new Set(myEnrollments?.map((e: any) => e.course_id) || []);

            // Split courses into enrolled and available
            const enrolled = (allCourses || []).filter(c => enrolledCourseIds.has(c.id));
            const available = (allCourses || []).filter(c => !enrolledCourseIds.has(c.id));

            setEnrolledCourses(enrolled);
            setAvailableCourses(available);
            setLoading(false);
        };

        fetchData();
    }, []);

    // Reusable Course Card Component
    const CourseCard = ({ course, isEnrolled }: { course: Course, isEnrolled: boolean }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-[#141414] border border-white/5 hover:border-blue-500/50 rounded-2xl p-6 transition-all hover:bg-[#1A1A1A] hover:shadow-2xl hover:-translate-y-1 overflow-hidden flex flex-col h-full"
        >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Plane className="h-24 w-24 -rotate-12" />
            </div>

            {/* Status Badge */}
            <div className="mb-6 flex justify-between items-start">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isEnrolled
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : 'bg-white/5 text-gray-400 border-white/10'
                    }`}>
                    {isEnrolled ? t('status_in_progress') : t('status_available')}
                </span>
            </div>

            <h3 className="text-xl font-black text-white mb-2 line-clamp-2 min-h-[3.5rem]">
                {course.title_fr}
            </h3>

            <p className="text-gray-500 text-sm mb-6 line-clamp-3 font-medium">
                {course.description_fr || t('no_description')}
            </p>

            {/* Metadata Footer */}
            <div className="space-y-3 pt-4 border-t border-white/5 mt-auto">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                    <Calendar className="h-3 w-3 text-blue-500" />
                    <span>{t('created_at', { date: new Date(course.start_date || new Date()).toLocaleDateString() })}</span>
                </div>
            </div>

            {/* Action Button */}
            <Link
                href={`/training/${course.id}`}
                className={`mt-6 w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isEnrolled
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5'
                    }`}
            >
                {isEnrolled ? t('continue_mission') : t('view_details')}
                <ArrowRight className="h-3 w-3" />
            </Link>
        </motion.div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-end border-b border-white/5 pb-8"
            >
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">
                        {t('hangar_title')}
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg font-medium">
                        {t('hangar_subtitle')}
                    </p>
                </div>
                <div className="hidden md:block">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/5 px-4 py-2 rounded-full border border-blue-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        {t('campus_status')}
                    </div>
                </div>
            </motion.div>

            {/* My Learning Section */}
            {enrolledCourses.length > 0 && (
                <section>
                    <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                        {t('my_active_missions')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrolledCourses.map((course) => (
                            <CourseCard key={course.id} course={course} isEnrolled={true} />
                        ))}
                    </div>
                </section>
            )}

            {/* Available Courses Section */}
            <section>
                <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-gray-700 rounded-full"></span>
                    {t('available_curriculum')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableCourses.map((course) => (
                        <CourseCard key={course.id} course={course} isEnrolled={false} />
                    ))}
                </div>

                {availableCourses.length === 0 && enrolledCourses.length === 0 && !loading && (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                        <p className="text-gray-500 font-medium">{t('no_courses_found')}</p>
                    </div>
                )}
            </section>

        </div>
    )
}
