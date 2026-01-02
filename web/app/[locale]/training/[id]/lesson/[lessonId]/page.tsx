"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    CheckCircle,
    PlayCircle,
    FileText,
    Layout,
    ChevronRight,
    Lock,
    Clock
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function LessonPlayerPage() {
    const t = useTranslations('Training');
    const params = useParams();
    const router = useRouter();
    // CHANGED: courseId comes from params.id because the parent route is [id]
    const courseId = params?.id as string;
    const lessonId = params?.lessonId as string;

    const [lesson, setLesson] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [progress, setProgress] = useState<'not_started' | 'completed'>('not_started');
    const [canComplete, setCanComplete] = useState(false);

    // Timer for "Smart Progress"
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const fetchLesson = async () => {
            setLoading(true);
            const { data: lessonData, error } = await supabase
                .from('lessons')
                .select('*')
                .eq('id', lessonId)
                .single();

            if (lessonData) {
                setLesson(lessonData);

                // Content View Timer (Simple Logic: Enable completion after 5 seconds)
                // In production, this would be based on video duration or scroll events.
                timerRef.current = setTimeout(() => {
                    setCanComplete(true);
                }, 5000);
            }

            // Check existing progress
            const { data: progressData } = await supabase
                .from('lesson_progress')
                .select('status')
                .eq('lesson_id', lessonId)
                .maybeSingle(); // RLS automatically filters by auth.uid()

            if (progressData?.status === 'completed') {
                setProgress('completed');
                setCanComplete(true); // Already done
            }

            setLoading(false);
        };

        if (lessonId) fetchLesson();

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [lessonId]);

    const handleComplete = async () => {
        setCompleting(true);
        try {
            // LAYER 2: RPC Call
            const { error } = await supabase.rpc('mark_lesson_completed', {
                p_lesson_id: lessonId
            });

            if (error) throw error;

            setProgress('completed');

            // Optional: Redirect back to course map after short delay
            setTimeout(() => {
                router.push(`/training/${courseId}`);
            }, 1000);

        } catch (err: any) {
            console.error('Completion failed:', err);
            alert(t('progress_save_failed'));
        } finally {
            setCompleting(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">{t('loading_mission_data')}</div>;
    if (!lesson) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">{t('lesson_not_found')}</div>;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
            {/* Top Bar */}
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#141414]">
                <button
                    onClick={() => router.push(`/training/${courseId}`)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> {t('back_to_map')}
                </button>
                <div className="font-bold text-sm tracking-widest uppercase text-gray-400">
                    {t('mission_control')}
                </div>
            </header>

            <div className="flex-1 flex max-w-7xl mx-auto w-full p-6 gap-8">
                {/* Main Content Area */}
                <main className="flex-1 bg-[#141414] rounded-2xl border border-white/5 overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-white/5">
                        <h1 className="text-2xl font-black mb-2">{lesson.title}</h1>
                        <div className="flex items-center gap-2 text-xs text-blue-400 uppercase tracking-widest font-bold">
                            {lesson.content_type === 'video' ? <PlayCircle className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                            {t(lesson.content_type)} {t('module_suffix', { fallback: 'Module' })}
                        </div>
                    </div>

                    <div className="flex-1 p-8 bg-black/20 overflow-y-auto">
                        {/* Placeholder for Content Renderer */}
                        <div className="aspect-video bg-black/50 rounded-xl border border-white/5 flex items-center justify-center mb-8">
                            {lesson.content_type === 'video' ? (
                                <PlayCircle className="h-20 w-20 text-white/10" />
                            ) : (
                                <div className="text-center text-gray-500">
                                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                    <p>{t('text_content_placeholder')}</p>
                                </div>
                            )}
                        </div>

                        <div className="prose prose-invert max-w-none">
                            <p className="text-gray-400">
                                {lesson.description || t('default_description')}
                            </p>
                        </div>
                    </div>
                </main>

                {/* Sidebar / Action Panel */}
                <aside className="w-80 space-y-6">
                    <div className="bg-[#141414] rounded-2xl border border-white/5 p-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{t('status_label')}</h3>

                        <div className="space-y-4">
                            {!canComplete && progress !== 'completed' && (
                                <div className="flex items-center gap-3 text-amber-500 text-xs font-bold bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                                    <Clock className="h-4 w-4 animate-pulse" />
                                    <span>{t('reviewing_content')}</span>
                                </div>
                            )}

                            <button
                                onClick={handleComplete}
                                disabled={!canComplete || completing || progress === 'completed'}
                                className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${progress === 'completed'
                                    ? 'bg-emerald-600 text-white cursor-default shadow-lg shadow-emerald-900/20'
                                    : canComplete
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                                        : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                                    }`}
                            >
                                {completing ? (
                                    t('processing')
                                ) : progress === 'completed' ? (
                                    <>
                                        <CheckCircle className="h-5 w-5" /> {t('completed')}
                                    </>
                                ) : canComplete ? (
                                    <>
                                        {t('mark_complete')} <ChevronRight className="h-4 w-4" />
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4" /> {t('locked')}
                                    </>
                                )}
                            </button>

                            {progress === 'completed' && (
                                <p className="text-xs text-center text-emerald-500/70 font-medium">
                                    {t('progress_recorded_at', { time: new Date().toLocaleTimeString() })}
                                </p>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
