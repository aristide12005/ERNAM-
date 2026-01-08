"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import {
    BookOpen,
    Search,
    Play,
    CheckCircle,
    Clock,
    Trophy,
    ArrowRight,
    Loader2,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStudentDashboard, requestEnrollment, StudentCourse } from '@/lib/logic/student';
import CourseViewer from './CourseViewer';
import { useTranslations } from 'next-intl';

export default function MyLearning() {
    const { user } = useAuth();
    const t = useTranslations('TraineeDashboard');
    const [activeTab, setActiveTab] = useState<'my' | 'catalog'>('my');
    const [myCourses, setMyCourses] = useState<any[]>([]);
    const [catalog, setCatalog] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Use logical layer
            const { activeCourses } = await getStudentDashboard(user.id);
            setMyCourses(activeCourses);

            // Catalog still separate for now or could be added to logic
            const enrolledIds = activeCourses.map(c => c.courseId); // Note: courseId mapped to session.id in student.ts.
            // For catalog we want Standards.
            // Complex logic: A student enrolls in a Session, but Browse Catalog shows Standards?
            // For simplicity, let's fetch ACTIVE Sessions (published courses).

            // Fetch available SESSIONS (which represent bookable courses)
            // Or fetch STANDARDS? If the UI expects "Join", it implies a Session.
            // Let's fetch Sessions with status 'scheduled' or 'planned'.
            const { data: allSessions } = await supabase
                .from('sessions')
                .select(`
                    id,
                    start_date,
                    training_standard:training_standards (
                        title, 
                        description,
                        details
                    )
                `)
                .in('status', ['planned', 'scheduled', 'confirmed']); // Only show future/open sessions

            // Map to "Course" shape for UI
            const catalogItems = allSessions?.map((s: any) => ({
                id: s.id,
                title_en: s.training_standard?.title,
                description_en: s.training_standard?.description,
                thumbnail_url: s.training_standard?.details?.thumbnail_url,
                duration_hours: s.training_standard?.details?.duration_hours,
                level: s.training_standard?.details?.level
            })) || [];

            setCatalog(catalogItems.filter(c => !enrolledIds.includes(c.id)));
        } catch (error) {
            console.error('Error fetching academic data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Set up real-time subscription for enrollment updates
        if (!user) return;

        const channel = supabase
            .channel('enrollment-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'session_roster',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Enrollment changed:', payload);
                    // Refresh data when enrollment status changes
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const handleEnroll = async (courseId: string) => {
        if (!user) return;
        const result = await requestEnrollment(user.id, courseId);

        if (!result.success) {
            alert(result.message);
        } else {
            alert(result.message);
            fetchData();
        }
    };

    const filteredCatalog = catalog.filter(c =>
        (c.title_en || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // If a course is selected, show the course viewer
    if (selectedCourseId) {
        return <CourseViewer courseId={selectedCourseId} onBack={() => setSelectedCourseId(null)} />;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-xl">
                            <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        {t('portal_title')}
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium italic">{t('portal_desc')}</p>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
                    {[
                        { id: 'my', label: t('my_learning') },
                        { id: 'catalog', label: t('course_catalog') }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 md:flex-none px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab.id
                                ? 'bg-white text-blue-600 shadow-xl shadow-blue-500/10'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <input
                    type="text"
                    placeholder={t('search_placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-100 rounded-3xl py-4 pl-14 pr-6 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm group-hover:shadow-md"
                />
                <Search className="absolute left-6 top-4.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            </div>

            {loading ? (
                <div className="py-32 flex flex-col items-center gap-6">
                    <div className="relative">
                        <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
                        <Sparkles className="absolute top-0 right-0 h-4 w-4 text-blue-400 animate-pulse" />
                    </div>
                    <p className="text-slate-900 font-black uppercase tracking-widest text-sm italic">{t('sync_data')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="wait">
                        {activeTab === 'my' ? (
                            myCourses.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="col-span-full py-24 bg-white border-2 border-dashed border-slate-200 rounded-[40px] text-center"
                                >
                                    <Trophy className="h-16 w-16 text-slate-100 mx-auto mb-6" />
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t('journey_awaits')}</h3>
                                    <p className="text-slate-500 mb-8 max-w-sm mx-auto font-medium">{t('no_enrollments')}</p>
                                    <button
                                        onClick={() => setActiveTab('catalog')}
                                        className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 shadow-2xl shadow-blue-500/30 transition-all active:scale-95"
                                    >
                                        {t('browse_catalog')}
                                    </button>
                                </motion.div>
                            ) : (
                                myCourses.map((course, idx) => (
                                    <CourseCard
                                        key={course.courseId}
                                        course={course}
                                        status={course.status}
                                        isEnrolled
                                        onClick={() => course.status === 'active' && setSelectedCourseId(course.courseId)}
                                        index={idx}
                                        t={t}
                                    />
                                ))
                            )
                        ) : (
                            filteredCatalog.length === 0 ? (
                                <div className="col-span-full py-24 text-center">
                                    <Search className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                    <p className="text-slate-500 font-bold italic">{t('no_matching_courses')}</p>
                                </div>
                            ) : (
                                filteredCatalog.map((course, idx) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        onEnroll={() => handleEnroll(course.id)}
                                        index={idx}
                                        t={t}
                                    />
                                ))
                            )
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

function CourseCard({ course, status, isEnrolled, onEnroll, onClick, index, t }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all group flex flex-col h-full"
        >
            <div className="h-48 bg-slate-900 relative overflow-hidden">
                <img
                    src={course?.thumbnail_url || 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?q=80&w=800&auto=format&fit=crop'}
                    alt={course?.title}
                    className="w-full h-full object-cover opacity-70 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

                {isEnrolled && (
                    <div className="absolute top-4 right-4">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md ${status === 'active'
                            ? 'bg-emerald-500/80 text-white border-emerald-400'
                            : 'bg-amber-500/80 text-white border-amber-400'
                            }`}>
                            {status}
                        </span>
                    </div>
                )}

                <div className="absolute bottom-4 left-6 right-6">
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">
                        {course?.level || t('default_level')}
                    </div>
                    <h3 className="text-lg font-bold text-white leading-tight group-hover:text-blue-300 transition-colors line-clamp-1 italic underline decoration-blue-500/50 underline-offset-4">
                        {course?.title || course?.title_en}
                    </h3>
                </div>
            </div>

            <div className="p-6 space-y-5 flex-1 flex flex-col">
                <p className="text-sm text-slate-500 line-clamp-2 font-medium leading-relaxed">
                    {course?.description_en || t('default_desc')}
                </p>

                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {course?.duration_hours ? `${course.duration_hours} ${t('hours')}` : t('flexible_duration')}
                    </div>
                    {/* Module count not currently fetched in list view, using generic label */}
                    <div className="flex items-center gap-1.5 text-blue-600">
                        <CheckCircle className="h-3.5 w-3.5" />
                        {t('standard_curriculum')}
                    </div>
                </div>

                {isEnrolled && (
                    <div className="space-y-2">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '0%' }}
                                className="h-full bg-blue-600"
                            />
                        </div>
                    </div>
                )}

                <div className="pt-2 mt-auto">
                    {isEnrolled ? (
                        <button
                            onClick={onClick}
                            disabled={status !== 'active'}
                            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${status === 'active'
                                ? 'bg-slate-900 text-white hover:bg-blue-600 shadow-xl shadow-blue-500/20 cursor-pointer'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            <Play className="h-3.5 w-3.5" /> {t('continue_training')}
                        </button>
                    ) : (
                        <button
                            onClick={onEnroll}
                            className="w-full py-4 bg-white border-2 border-slate-100 hover:border-blue-600 text-slate-900 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 group/btn"
                        >
                            {t('request_enrollment')} <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
