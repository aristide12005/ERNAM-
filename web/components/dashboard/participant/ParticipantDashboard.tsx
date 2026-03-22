"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, BookOpen, User, Award, ArrowRight, Clock, MapPin, CheckCircle, FileText, PieChart, Settings } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import NotificationsDialog from '@/components/dashboard/NotificationsDialog';
import TraineeProfile from '@/components/dashboard/trainee/TraineeProfile';
import CertificatesView from './CertificatesView';
import MyLearningView from './MyLearningView';
import Resources from '@/components/dashboard/trainee/Resources';
import TraineeSchedule from '@/components/dashboard/trainee/TraineeSchedule';
import ParticipantSessionView from './ParticipantSessionView';
import { supabase } from '@/lib/supabaseClient';
import ControlCenter from '@/components/dashboard/ControlCenter';

export default function ParticipantDashboard() {
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

    const fetchCurrentTraining = async () => {
        setLoading(true);
        const { data: participation } = await supabase
            .from('session_participants')
            .select('session_id, attendance_status')
            .eq('participant_id', user?.id)
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

                const { count: docCount } = await supabase
                    .from('documents')
                    .select('*', { count: 'exact', head: true })
                    .eq('session_id', sid);

                const { count: msgCount } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('session_id', sid);

                const { data: assessment } = await supabase
                    .from('assessments')
                    .select('result')
                    .eq('session_id', sid)
                    .eq('participant_id', user?.id)
                    .single();

                const { data: certificate } = await supabase
                    .from('certificates')
                    .select('id')
                    .eq('session_id', sid)
                    .eq('participant_id', user?.id)
                    .single();

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
                    assessmentStatus: assessment?.result || 'pending',
                    certificateStatus: certificate ? 'issued' : 'not_issued',
                    messagesCount: msgCount || 0,
                    progress
                });
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user) fetchCurrentTraining();
    }, [user]);

    const handleNavigate = (view: string, sId?: string) => {
        let url = `/dashboard?view=${view}`;
        if (sId) url += `&sessionId=${sId}`;
        router.push(url);
    };

    return (
        <div className="min-h-screen font-sans bg-gray-50 text-gray-900 pb-12">
            {/* Top Navigation - PREMIUM LIGHT MODE */}
            <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 sticky top-0 z-50">
                <div 
                    onClick={() => handleNavigate('dashboard')}
                    className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200 rounded-full pr-5 pl-1.5 py-1.5 shadow-sm cursor-pointer group"
                >
                    <div className="flex items-center -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 border-2 border-[#12388D] relative z-10 group-hover:-translate-x-1 transition-transform">
                            <img src="/logos/asecna-logo.png" alt="ASECNA" className="w-full h-full object-contain rounded-full" />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 border-2 border-[#12388D] relative z-20 shadow-sm group-hover:translate-x-1 transition-transform">
                            <img src="/logos/ernam-logo.png" alt="ERNAM" className="w-full h-full object-contain rounded-full" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-900 font-black text-sm leading-tight tracking-wide">ASECNA - ERNAM</span>
                        <span className="text-blue-600 font-bold text-[10px] leading-tight flex items-center gap-1.5 uppercase tracking-widest opacity-90">
                            Participant <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                        </span>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    {[
                        { id: 'dashboard', label: 'Home' },
                        { id: 'courses', label: 'My Learning' },
                        { id: 'schedule', label: 'Schedule' },
                        { id: 'documents', label: 'Resources' },
                        { id: 'certificates', label: 'Achievements' }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigate(item.id)}
                            className={`text-sm font-semibold transition-colors pb-1 border-b-2 ${
                                activeView === item.id || (activeView === 'dashboard' && item.id === 'dashboard')
                                    ? "text-blue-700 border-blue-700" 
                                    : "text-gray-400 border-transparent hover:text-gray-900"
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowNotifications(true)}
                        className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all relative"
                    >
                        <Bell className="w-5 h-5" />
                        {stats.messagesCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        )}
                    </button>
                    
                    <button 
                        onClick={() => handleNavigate('settings')}
                        className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    <div 
                        onClick={() => setIsControlCenterOpen(true)}
                        className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 cursor-pointer hover:bg-gray-100 transition-all group"
                    >
                        <div className="flex flex-col text-right hidden sm:block">
                            <span className="text-gray-900 font-bold text-xs leading-tight group-hover:text-blue-700 transition-colors capitalize">{profile?.full_name?.toLowerCase()}</span>
                            <span className="text-gray-400 font-bold text-[9px] uppercase tracking-widest leading-tight">Trainee Pro</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-sm group-hover:scale-105 transition-transform">
                            {profile?.full_name?.charAt(0).toUpperCase() || 'P'}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="p-4 md:p-8 max-w-7xl mx-auto pb-20">
                <AnimatePresence mode="wait">
                    {activeView === 'dashboard' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                            {/* PREMIUM HERO CARD */}
                            {loading ? (
                                <div className="h-64 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-200 animate-pulse" />
                            ) : currentSession ? (
                                <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] min-h-[400px] flex flex-col group">
                                    {/* Glassmorphic Patterns & Glows */}
                                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-blue-600/30 transition-all duration-700" />
                                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-600/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                                    
                                    <div className="relative p-8 md:p-12 flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-10 z-10">
                                        <div className="space-y-6 max-w-2xl">
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-lg border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                                Active Training Path
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <h1 className="text-4xl md:text-6xl font-black leading-[1.1] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/60">
                                                    {(currentSession.training_standard as any)?.title}
                                                </h1>
                                                <p className="text-blue-400 font-bold tracking-widest text-xs uppercase opacity-80">
                                                    COURSE CODE: {(currentSession.training_standard as any)?.code || 'N/A'}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-8 py-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 backdrop-blur-md">
                                                        <Clock className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Schedule</p>
                                                        <p className="text-sm font-bold text-white">09:00 - 16:00</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 backdrop-blur-md">
                                                        <MapPin className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Location</p>
                                                        <p className="text-sm font-bold text-white">{currentSession.location}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-6 w-full md:w-auto self-stretch justify-center md:border-l md:border-white/10 md:pl-12">
                                            <div className="relative w-32 h-32 flex items-center justify-center">
                                                <svg className="w-full h-full -rotate-90">
                                                    <circle className="text-white/5" strokeWidth="8" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
                                                    <circle 
                                                        className="text-blue-500 transition-all duration-1000" 
                                                        strokeWidth="8" 
                                                        strokeDasharray={364}
                                                        strokeDashoffset={364 - (364 * stats.progress) / 100}
                                                        strokeLinecap="round" 
                                                        stroke="currentColor" 
                                                        fill="transparent" 
                                                        r="58" 
                                                        cx="64" 
                                                        cy="64" 
                                                    />
                                                </svg>
                                                <div className="absolute inset-x-0 flex flex-col items-center justify-center text-center">
                                                    <span className="text-3xl font-black text-white leading-none">{stats.progress}%</span>
                                                    <span className="text-[8px] font-black uppercase text-blue-400 tracking-widest mt-1">Progress</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleNavigate('session', currentSession.id)}
                                                className="w-full md:w-56 py-4 bg-white text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] hover:shadow-[0_25px_50px_-12px_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group/btn"
                                            >
                                                Training Studio
                                                <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* STATUS STRIP REDESIGN */}
                                    <div className="mt-auto bg-white/[0.03] backdrop-blur-xl border-t border-white/10 p-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {[
                                            { icon: <BookOpen className="w-4 h-4" />, label: "Resources", value: `${stats.materialsCount} Files`, sub: "Available", color: "blue" },
                                            { icon: <CheckCircle className="w-4 h-4" />, label: "Evaluation", value: stats.assessmentStatus, sub: "Status", color: "emerald", highlight: true },
                                            { icon: <Award className="w-4 h-4" />, label: "Credential", value: stats.certificateStatus === 'issued' ? 'Ready' : 'Pending', sub: "Issuance", color: "amber" },
                                            { icon: <Bell className="w-4 h-4" />, label: "Studio Chat", value: `${stats.messagesCount} Alerts`, sub: "Unread", color: "indigo" }
                                        ].map((stat, i) => (
                                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group/stat">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all bg-${stat.color}-500/10 text-${stat.color}-400 group-hover/stat:scale-110`}>
                                                    {stat.icon}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-white/40 text-[9px] font-black uppercase tracking-widest truncate">{stat.label}</p>
                                                    <p className={`text-sm font-black text-white truncate capitalize ${stat.highlight ? (stat.value === 'completed' ? 'text-emerald-400' : 'text-amber-400') : ''}`}>
                                                        {stat.value}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* PREMIUM EMPTY STATE */
                                <div className="h-[400px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[40px] border border-gray-200 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50" />
                                    
                                    <div className="relative z-10">
                                        <div className="h-24 w-24 bg-gray-50 rounded-3xl flex items-center justify-center mb-8 mx-auto border border-gray-100 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                                            <Clock className="h-10 w-10 text-gray-300" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Deployment Pending</h2>
                                        <p className="text-gray-500 max-w-sm mx-auto font-medium leading-relaxed">
                                            Systems are currently calibrating your enrollment data. Re-synchronize or contact support for direct assignment.
                                        </p>
                                        <button 
                                            onClick={() => fetchCurrentTraining()}
                                            className="mt-10 px-8 py-3 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-black/5"
                                        >
                                            Refresh System
                                        </button>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    )}

                    {/* SUB-VIEWS */}
                    {activeView === 'session' && sessionId && <ParticipantSessionView sessionId={sessionId as string} onBack={() => handleNavigate('dashboard')} />}

                    {activeView === 'courses' && (
                        <div className="space-y-6">
                            <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                                <ArrowRight className="h-4 w-4 rotate-180" /> Back
                            </button>
                            <MyLearningView />
                        </div>
                    )}

                    {activeView === 'documents' && (
                        <div className="space-y-6">
                            <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                                <ArrowRight className="h-4 w-4 rotate-180" /> Back
                            </button>
                            <Resources />
                        </div>
                    )}

                    {activeView === 'achievements' && (
                        <div className="space-y-6">
                            <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                                <ArrowRight className="h-4 w-4 rotate-180" /> Back
                            </button>
                            <CertificatesView />
                        </div>
                    )}

                    {activeView === 'profile' && (
                        <div className="space-y-6">
                            <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                                <ArrowRight className="h-4 w-4 rotate-180" /> Back
                            </button>
                            <TraineeProfile />
                        </div>
                    )}

                    {activeView === 'schedule' && (
                        <div className="space-y-6">
                            <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                                <ArrowRight className="h-4 w-4 rotate-180" /> Back
                            </button>
                            <TraineeSchedule />
                        </div>
                    )}

                    {activeView === 'assessments' && (
                        <div className="space-y-6">
                            <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                                <ArrowRight className="h-4 w-4 rotate-180" /> Back
                            </button>
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                                <FileText className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Evaluations & Exams</h3>
                                <p className="text-slate-500">No active assessments found for your profile.</p>
                            </div>
                        </div>
                    )}

                    {activeView === 'certificates' && (
                        <div className="space-y-6">
                            <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                                <ArrowRight className="h-4 w-4 rotate-180" /> Back
                            </button>
                            <CertificatesView />
                        </div>
                    )}

                    {activeView === 'settings' && (
                        <div className="space-y-6">
                            <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                                <ArrowRight className="h-4 w-4 rotate-180" /> Back
                            </button>
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Account Preferences</h3>
                                <p className="text-slate-500">Configure your dashboard and notification preferences.</p>
                            </div>
                        </div>
                    )}

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
            <ControlCenter
                isOpen={isControlCenterOpen}
                onClose={() => setIsControlCenterOpen(false)}
            />
        </div>
    );
}
