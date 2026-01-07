"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, BookOpen, User, Award, ArrowRight, Clock, MapPin, CheckCircle, FileText, PieChart } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useSearchParams, useRouter } from 'next/navigation';
import NotificationsDialog from '@/components/dashboard/NotificationsDialog';
import TraineeProfile from '@/components/dashboard/trainee/TraineeProfile';
import CertificatesView from './CertificatesView';
import MyLearningView from './MyLearningView';
import Resources from '@/components/dashboard/trainee/Resources';
import ParticipantSessionView from './ParticipantSessionView'; // New Component
import { supabase } from '@/lib/supabaseClient';
import ControlCenter from '@/components/dashboard/ControlCenter';

export default function ParticipantDashboard() {
    const t = useTranslations('Participant');
    const { user, profile } = useAuth();
    const router = useRouter();
    const [showNotifications, setShowNotifications] = useState(false);

    // State for Data
    const [currentSession, setCurrentSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isControlCenterOpen, setIsControlCenterOpen] = useState(false);
    const [stats, setStats] = useState({
        materialsCount: 0,
        assessmentStatus: 'pending',
        certificateStatus: 'not_issued',
        messagesCount: 0,
        progress: 0
    });

    // Navigation
    const searchParams = useSearchParams();
    const activeView = searchParams.get('view') || 'dashboard';
    const sessionId = searchParams.get('sessionId');

    useEffect(() => {
        if (user) fetchCurrentTraining();
    }, [user]);

    const fetchCurrentTraining = async () => {
        setLoading(true);
        // Fetch the nearest active session for this participant
        const { data: participation } = await supabase
            .from('session_participants')
            .select('session_id, attendance_status')
            .eq('participant_id', user?.id)
            // .eq('attendance_status', 'enrolled') // Removed to show any status for now
            .limit(1)
            .single();

        if (participation && participation.session_id) {
            const sid = participation.session_id;
            const { data: session } = await supabase
                .from('sessions')
                .select(`
                    id, start_date, end_date, location, status,
                    training_standard:training_standards(title, code)
                `)
                .eq('id', sid)
                .single();

            if (session) {
                setCurrentSession(session);

                // Fetch Stats
                const { count: docCount } = await supabase
                    .from('documents')
                    .select('*', { count: 'exact', head: true })
                    .eq('session_id', sid);

                // Fetch Message Count
                const { count: msgCount } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('session_id', sid);

                // Calculate Progress
                const start = new Date(session.start_date).getTime();
                const end = new Date(session.end_date).getTime();
                const now = new Date().getTime();
                const total = end - start;
                const elapsed = now - start;
                let progress = 0;
                if (total > 0) {
                    progress = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
                }

                setStats({
                    materialsCount: docCount || 0,
                    assessmentStatus: 'pending', // Defaulting as column missing in schema
                    certificateStatus: 'not_issued', // Defaulting as column missing in schema
                    messagesCount: msgCount || 0,
                    progress
                });
            }
        }
        setLoading(false);
    };

    const handleNavigate = (view: string, sId?: string) => {
        let url = `/dashboard?view=${view}`;
        if (sId) url += `&sessionId=${sId}`;
        router.push(url);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header (Simplified) */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-8 py-4 flex justify-between items-center border-b border-slate-200">
                <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-slate-900 capitalize">
                        {activeView === 'dashboard' ? t('journeyTitle') : t(`menu.${activeView}`)}
                    </h2>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowNotifications(true)} className="relative p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <Bell className="h-5 w-5 text-slate-500" />
                        {/* Red dot if needed */}
                    </button>

                    {/* User Menu / Control Center Trigger */}
                    <button
                        onClick={() => setIsControlCenterOpen(true)}
                        className="flex items-center gap-3 pl-4 border-l border-slate-200 outline-none group"
                    >
                        <div className="text-right hidden sm:block">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest group-hover:text-blue-600 transition-colors">
                                {t('traineeId')}
                            </div>
                            <div className="text-sm font-bold text-slate-900 uppercase italic tracking-tighter group-hover:text-blue-600 transition-colors">
                                {profile?.full_name}
                            </div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border-2 border-transparent group-hover:border-blue-600 transition-all shadow-sm">
                            {profile?.full_name?.charAt(0).toUpperCase() || 'P'}
                        </div>
                    </button>
                </div>
            </div>

            <div className="p-4 md:p-8 max-w-7xl mx-auto pb-20">
                <AnimatePresence mode="wait">
                    {/* DASHBOARD VIEW */}
                    {activeView === 'dashboard' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

                            {/* HERO CARD */}
                            {loading ? (
                                <div className="h-64 bg-slate-200 rounded-3xl animate-pulse" />
                            ) : currentSession ? (
                                <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl">
                                    <div className="absolute top-0 right-0 p-12 opacity-5">
                                        <Award className="h-64 w-64 text-white" />
                                    </div>

                                    <div className="relative p-8 md:p-12">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                            <div className="space-y-4 max-w-2xl">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider text-blue-300">
                                                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                                    {t('hero.currentStatus')}
                                                </div>
                                                <h1 className="text-3xl md:text-5xl font-bold leading-tight">
                                                    {(currentSession.training_standard as any)?.title}
                                                </h1>

                                                {/* Progress Bar */}
                                                <div className="space-y-2 pt-2">
                                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                                                        <span>{t('hero.progress')}</span>
                                                        <span>{stats.progress}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${stats.progress}%` }} />
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-6 text-slate-300 font-medium pt-2">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-5 w-5 text-blue-400" />
                                                        09:00 - 16:00
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-5 w-5 text-red-400" />
                                                        {currentSession.location}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-4 w-full md:w-auto">
                                                <button
                                                    onClick={() => handleNavigate('session', currentSession.id)}
                                                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 group"
                                                >
                                                    {t('hero.viewSession')}
                                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                                <p className="text-center text-xs text-slate-500">{t('hero.nextSession', { time: 'Tomorrow 09:00' })}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* STATUS STRIP */}
                                    <div className="bg-black/20 backdrop-blur-sm border-t border-white/5 p-6 grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-white/10">
                                        <div className="px-4 text-center">
                                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">{t('codex.materials')}</p>
                                            <p className="text-xl font-bold text-white max-w-full truncate">{stats.materialsCount} <span className="text-xs font-normal text-slate-500">{t('codex.unit_files')}</span></p>
                                        </div>
                                        <div className="px-4 text-center">
                                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">{t('codex.assessments')}</p>
                                            <p className="text-xl font-bold text-white flex items-center justify-center gap-2 max-w-full truncate">
                                                <span className={`h-2 w-2 rounded-full ${stats.assessmentStatus === 'completed' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                                                <span className="capitalize">{stats.assessmentStatus}</span>
                                            </p>
                                        </div>
                                        <div className="px-4 text-center">
                                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">{t('codex.certificate')}</p>
                                            <p className="text-xl font-bold text-slate-500 max-w-full truncate">{stats.certificateStatus === 'issued' ? t('codex.ready') : t('codex.notIssued')}</p>
                                        </div>
                                        <button onClick={() => handleNavigate('session', currentSession.id)} className="px-4 text-center w-full group">
                                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 group-hover:text-blue-400 transition-colors">{t('codex.messages')}</p>
                                            <p className="text-xl font-bold text-white max-w-full truncate">{stats.messagesCount} <span className="text-xs font-normal text-blue-400">{t('codex.unit_total')}</span></p>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* EMPTY STATE */
                                <div className="h-96 flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-dashed border-slate-300">
                                    <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                        <Clock className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('empty.title')}</h2>
                                    <p className="text-slate-500 max-w-md">{t('empty.message')}</p>
                                </div>
                            )}

                            {/* SHORTCUTS / MENU GRID */}


                        </motion.div>
                    )}

                    {/* SUB-VIEWS */}
                    {activeView === 'session' && sessionId && <ParticipantSessionView sessionId={sessionId} onBack={() => handleNavigate('dashboard')} />}

                    {activeView === 'my-trainings' && (
                        <div className="space-y-6">
                            <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                                <ArrowRight className="h-4 w-4 rotate-180" /> {t('back')}
                            </button>
                            <MyLearningView />
                        </div>
                    )}

                    {activeView === 'documents' && (
                        <div className="space-y-6">
                            <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                                <ArrowRight className="h-4 w-4 rotate-180" /> {t('back')}
                            </button>
                            <Resources />
                        </div>
                    )}

                    {activeView === 'achievements' && (
                        <div className="space-y-6">
                            <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                                <ArrowRight className="h-4 w-4 rotate-180" /> {t('back')}
                            </button>
                            <CertificatesView />
                        </div>
                    )}

                    {activeView === 'profile' && (
                        <div className="space-y-6">
                            <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                                <ArrowRight className="h-4 w-4 rotate-180" /> {t('back')}
                            </button>
                            <TraineeProfile />
                        </div>
                    )}

                    {/* SCHEDULE VIEW */}
                    {activeView === 'schedule' && (
                        <div className="space-y-6">
                            <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                                <ArrowRight className="h-4 w-4 rotate-180" /> {t('back')}
                            </button>
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                                <Calendar className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{t('menu.schedule')}</h3>
                                <p className="text-slate-500">{t('placeholder.schedule')}</p>
                            </div>
                        </div>
                    )}

                    {/* ASSESSMENTS VIEW */}
                    {activeView === 'assessments' && (
                        <div className="space-y-6">
                            <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                                <ArrowRight className="h-4 w-4 rotate-180" /> {t('back')}
                            </button>
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                                <FileText className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{t('menu.assessments')}</h3>
                                <p className="text-slate-500">{t('placeholder.assessments')}</p>
                            </div>
                        </div>
                    )}

                    {/* CERTIFICATES VIEW (Alias for achievements) */}
                    {activeView === 'certificates' && (
                        <div className="space-y-6">
                            <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                                <ArrowRight className="h-4 w-4 rotate-180" /> {t('back')}
                            </button>
                            <CertificatesView />
                        </div>
                    )}

                    {/* SETTINGS VIEW */}
                    {activeView === 'settings' && (
                        <div className="space-y-6">
                            <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                                <ArrowRight className="h-4 w-4 rotate-180" /> {t('back')}
                            </button>
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{t('menu.settings')}</h3>
                                <p className="text-slate-500">{t('placeholder.settings')}</p>
                            </div>
                        </div>
                    )}

                    {/* SESSION-DETAILS (Redirects to Session View) */}
                    {activeView === 'session-details' && currentSession && (
                        <ParticipantSessionView sessionId={currentSession.id} onBack={() => handleNavigate('dashboard')} />
                    )}
                </AnimatePresence>
            </div>

            <NotificationsDialog
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                userId={user?.id || ''}
                onNavigate={(view) => handleNavigate(view)}
            />
            {/* Control Center */}
            <ControlCenter
                isOpen={isControlCenterOpen}
                onClose={() => setIsControlCenterOpen(false)}
            />
        </div>
    );
}
