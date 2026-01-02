'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import {
    ArrowLeft,
    BookOpen,
    Play,
    FileText,
    CheckCircle,
    Lock,
    Clock,
    Award,
    Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface CourseViewerProps {
    courseId: string;
    onBack: () => void;
}

export default function CourseViewer({ courseId, onBack }: CourseViewerProps) {
    const t = useTranslations('TraineeDashboard');
    const { user } = useAuth();
    const [course, setCourse] = useState<any>(null);
    const [modules, setModules] = useState<any[]>([]);
    const [selectedModule, setSelectedModule] = useState<any>(null);
    const [enrollment, setEnrollment] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourseData();
    }, [courseId]);

    const fetchCourseData = async () => {
        if (!user) return;
        setLoading(true);

        // Fetch course details
        const { data: courseData } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();

        let instructorName = 'TBA';

        // Fetch instructor from staff
        const { data: staffData } = await supabase
            .from('course_staff')
            .select('profiles(full_name)')
            .eq('course_id', courseId)
            .in('role', ['owner', 'trainer'])
            .limit(1)
            .maybeSingle();

        if (staffData?.profiles) {
            // @ts-ignore
            instructorName = staffData.profiles.full_name || 'TBA';
        }

        if (courseData) {
            setCourse({ ...courseData, instructor: { full_name: instructorName } });
        }

        // Fetch enrollment status
        const { data: enrollData } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .single();

        if (enrollData) setEnrollment(enrollData);

        // Fetch modules with their items
        const { data: modulesData } = await supabase
            .from('modules')
            .select(`
                *,
                course_items (
                    id,
                    title,
                    content_type,
                    file_url,
                    sort_order
                )
            `)
            .eq('course_id', courseId)
            .order('created_at', { ascending: true });

        if (modulesData) {
            // Sort items within modules just to be safe
            const sortedModules = modulesData.map((m: any) => ({
                ...m,
                course_items: m.course_items?.sort((a: any, b: any) => a.sort_order - b.sort_order)
            }));
            setModules(sortedModules);
        }

        setLoading(false);
    };

    const renderContentItem = (item: any) => {
        const iconClasses = "h-5 w-5 text-blue-500 mr-3";
        return (
            <a
                href={item.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group"
            >
                {item.content_type === 'video' ? <Play className={iconClasses} /> : <FileText className={iconClasses} />}
                <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700">{item.title}</h4>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">{item.content_type}</p>
                </div>
                <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center border border-slate-200 group-hover:border-blue-300">
                    <Download className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                </div>
            </a>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">{t('loading_course')}</p>
                </div>
            </div>
        );
    }

    if (!enrollment || enrollment.status !== 'active') {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
                <Lock className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">{t('access_restricted')}</h3>
                <p className="text-slate-600 mb-6">
                    {enrollment?.status === 'pending'
                        ? t('enrollment_pending')
                        : t('need_enrollment')}
                </p>
                <button
                    onClick={onBack}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    {t('back_to_learning')}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-medium">{t('back_to_learning')}</span>
                </button>

                <div className="flex items-start gap-6">
                    <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-12 w-12 text-white" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{course?.title_en || 'Course'}</h1>
                        <p className="text-slate-600 mb-4">{course?.description_en}</p>
                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <User className="h-4 w-4" />
                                <span>{t('instructor')}: {course?.instructor?.full_name || 'TBA'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <Clock className="h-4 w-4" />
                                <span>{t('modules_count', { count: modules.length })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="font-semibold">{t('enrolled')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Modules List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">{t('course_modules')}</h2>

                        {modules.length === 0 ? (
                            <div className="text-center py-8">
                                <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-500">{t('no_modules')}</p>
                                <p className="text-xs text-slate-400 mt-1">{t('check_back_soon')}</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {modules.map((module, idx) => (
                                    <button
                                        key={module.id}
                                        onClick={() => setSelectedModule(module)}
                                        className={`w-full text-left p-4 rounded-xl transition-all ${selectedModule?.id === module.id
                                            ? 'bg-blue-50 border-2 border-blue-500'
                                            : 'bg-slate-50 border-2 border-transparent hover:border-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedModule?.id === module.id
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-200 text-slate-600'
                                                }`}>
                                                <span className="text-sm font-bold">{idx + 1}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-sm text-slate-900 mb-1">{module.title}</h3>
                                                <p className="text-xs text-slate-500">
                                                    {t('lessons_count', { count: module.course_items?.length || 0 })}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Module Content */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl border border-slate-200 p-8">
                        {selectedModule ? (
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-4">{selectedModule.title}</h2>
                                <p className="text-slate-600 mb-6">{selectedModule.description || t('no_description')}</p>

                                {/* Actual Content */}
                                <div className="space-y-4">
                                    {selectedModule.course_items && selectedModule.course_items.length > 0 ? (
                                        selectedModule.course_items.map((item: any) => (
                                            <div key={item.id}>
                                                {renderContentItem(item)}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="bg-slate-50 rounded-xl p-6 text-center">
                                            <Play className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                            <p className="text-sm text-slate-500">{t('no_lessons')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('select_module')}</h3>
                                <p className="text-slate-500">{t('select_module_desc')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function User({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    );
}
