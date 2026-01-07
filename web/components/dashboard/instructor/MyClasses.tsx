'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Search, MoreHorizontal, Settings, BookOpen, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import CourseCreationWizard from './CourseCreationWizard';
import { useTranslations } from 'next-intl';

interface Course {
    id: string;
    title_en: string;
    title_fr: string;
    course_status: string;
    status?: string;
    thumbnail_url?: string;
    enrollment_count?: number;
}

interface MyClassesProps {
    instructorId: string;
    onManageClass: (courseId: string) => void;
    showCreateModal?: boolean;
    setShowCreateModal?: (show: boolean) => void;
}

export default function MyClasses({
    instructorId,
    onManageClass,
    showCreateModal: externalShowModal,
    setShowCreateModal: setExternalShowModal
}: MyClassesProps) {
    const t = useTranslations('InstructorDashboard.MyClasses');
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [internalShowModal, setInternalShowModal] = useState(false);

    const showCreateModal = externalShowModal !== undefined ? externalShowModal : internalShowModal;
    const setShowCreateModal = setExternalShowModal !== undefined ? setExternalShowModal : setInternalShowModal;

    const fetchCourses = async () => {
        setLoading(true);
        const { data: coursesData, error } = await supabase.rpc('get_manageable_courses');

        if (error) {
            console.error('Error fetching manageable courses:', error);
            const { data: staffAssignments } = await supabase
                .from('course_staff')
                .select('course_id')
                .eq('user_id', instructorId);

            if (staffAssignments && staffAssignments.length > 0) {
                const courseIds = staffAssignments.map(s => s.course_id);
                const { data: fallbackData } = await supabase
                    .from('courses')
                    .select('*')
                    .in('id', courseIds);

                if (fallbackData) {
                    setCourses(fallbackData.map(c => ({
                        ...c,
                        enrollment_count: 0,
                        course_status: c.course_status || c.status || 'draft'
                    })));
                }
            }
        } else if (coursesData) {
            const enrichedCourses = coursesData.map((c: any) => ({
                ...c,
                enrollment_count: 0,
                course_status: c.course_status || c.status || 'draft'
            }));
            setCourses(enrichedCourses);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (instructorId) fetchCourses();
    }, [instructorId]);

    const handleCourseCreated = () => {
        fetchCourses();
    };

    const handlePublishToggle = async (courseId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'published' ? 'draft' : 'published';
        const { error } = await supabase
            .from('courses')
            .update({ course_status: newStatus })
            .eq('id', courseId);

        if (error) {
            alert('Failed to update course status: ' + error.message);
        } else {
            fetchCourses();
        }
    };

    const filteredCourses = courses.filter(c =>
        (c.title_en?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.title_fr?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6 relative">
            <CourseCreationWizard
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                instructorId={instructorId}
                onSuccess={handleCourseCreated}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" /> {t('create_new')}
                </button>
            </div>

            <div className="flex gap-4 items-center bg-card p-4 rounded-xl border border-border">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-card h-64 rounded-2xl border border-border"></div>
                    ))}
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground">{t('no_results')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                        <motion.div
                            layout
                            key={course.id}
                            whileHover={{ y: -5 }}
                            className="bg-card rounded-2xl shadow-sm border border-border p-5 transition-all hover:shadow-xl group"
                        >
                            <div className="h-40 w-full rounded-xl bg-muted mb-4 overflow-hidden relative border border-border/50">
                                <img
                                    src={course.thumbnail_url || `https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=600&auto=format&fit=crop`}
                                    alt={course.title_en}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                />
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePublishToggle(course.id, course.course_status); }}
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border flex items-center gap-1 hover:scale-105 transition-transform ${course.course_status === 'published'
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                            }`}
                                    >
                                        {course.course_status === 'published' ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                        {course.course_status === 'published' ? t('published') : t('draft')}
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1">{course.title_en}</h3>
                            <p className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[32px]">{course.title_fr}</p>

                            <div className="flex items-center justify-between mb-5 pt-4 border-t border-border/50">
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-6 w-6 rounded-full border-2 border-card bg-secondary overflow-hidden">
                                                <img src={`https://ui-avatars.com/api/?name=User+${i}&background=random`} alt="Student" />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground">{t('students_count', { count: course.enrollment_count })}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => onManageClass(course.id)}
                                className="w-full bg-secondary hover:bg-muted text-foreground font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-primary-foreground"
                            >
                                <Settings className="h-4 w-4" /> {t('manage_class')}
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
