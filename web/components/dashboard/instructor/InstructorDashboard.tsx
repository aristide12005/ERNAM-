"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Clock, MapPin, Calendar, Users, FolderKanban, User, CheckCircle, ArrowRight } from 'lucide-react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import NotificationsDialog from '@/components/dashboard/NotificationsDialog';
import MySessionsView from '@/components/dashboard/instructor/MySessionsView';
import ManageSessionView from '@/components/dashboard/instructor/ManageSessionView';
import InstructorScheduleView from './InstructorScheduleView';
import InstructorParticipantsView from './InstructorParticipantsView';
import InstructorActivitiesView from './InstructorActivitiesView';
import InstructorDocumentsView from './InstructorDocumentsView';
import InstructorProfileView from './InstructorProfileView';
import ControlCenter from '@/components/dashboard/ControlCenter';

import { useSearchParams, useRouter } from 'next/navigation';

export default function InstructorDashboard() {
    const t = useTranslations();
    const { user, profile } = useAuth();
    const router = useRouter();
    const [showNotifications, setShowNotifications] = useState(false);
    const [isControlCenterOpen, setIsControlCenterOpen] = useState(false);

    // New State for "My Teaching Day"
    const [todaySession, setTodaySession] = useState<any>(null);
    const [loadingSession, setLoadingSession] = useState(true);
    const [stats, setStats] = useState({
        participants: 0,
        pendingAssmts: 0,
        materials: 0,
        messages: 0
    });

    useEffect(() => {
        if (user) fetchTodaySession();
    }, [user]);

    const fetchTodaySession = async () => {
        try {
            const { data: mySessions } = await supabase
                .from('session_instructors')
                .select('session_id')
                .eq('instructor_id', user?.id);

            if (!mySessions || mySessions.length === 0) {
                setLoadingSession(false);
                return;
            }
            const sessionIds = mySessions.map(s => s.session_id);

            // Fetch active session nearest to today
            const { data: session } = await supabase
                .from('sessions')
                .select(`
                    id, start_date, end_date, location, status,
                    training_standard:training_standards(title, code)
                `)
                .in('id', sessionIds)
                .gte('end_date', new Date().toISOString().split('T')[0]) // Not ended yet
                .order('start_date', { ascending: true })
                .limit(1)
                .single();

            if (session) {
                setTodaySession(session);

                // Fetch Real Stats
                const { count: pCount } = await supabase
                    .from('session_participants')
                    .select('*', { count: 'exact', head: true })
                    .eq('session_id', session.id);

                const { count: pendingCount } = await supabase
                    .from('session_participants')
                    .select('*', { count: 'exact', head: true })
                    .eq('session_id', session.id)
                    .neq('assessment_status', 'completed');

                const { count: mCount } = await supabase
                    .from('documents')
                    .select('*', { count: 'exact', head: true })
                    .eq('session_id', session.id);

                setStats({
                    participants: pCount || 0,
                    pendingAssmts: pendingCount || 0,
                    materials: mCount || 0,
                    messages: 0 // TODO: Implement Messages
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingSession(false);
        }
    };


    const searchParams = useSearchParams();
    const activeView = searchParams.get('view') || 'dashboard';
    const sessionId = searchParams.get('sessionId');

    return (
        <div className="min-h-screen bg-secondary/10">
            {/* Sidebar managed by layout */}

            <div className="flex-1 relative">
                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-8 py-4 flex justify-between items-center border-b border-border">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold text-foreground capitalize">
                            {activeView.replace('-', ' ')}
                        </h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={() => setShowNotifications(true)} className="relative p-2 hover:bg-muted rounded-full transition-colors">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                        </button>

                        {/* Instructor Profile Trigger */}
                        <button
                            onClick={() => setIsControlCenterOpen(true)}
                            className="flex items-center gap-3 pl-4 border-l border-border outline-none group"
                        >
                            <div className="text-right hidden sm:block">
                                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest group-hover:text-primary transition-colors">
                                    Instructor
                                </div>
                                <div className="text-sm font-bold text-foreground uppercase italic tracking-tighter group-hover:text-primary/80 transition-colors">
                                    {profile?.full_name}
                                </div>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border-2 border-transparent group-hover:border-primary transition-all shadow-sm">
                                {profile?.full_name?.charAt(0).toUpperCase() || 'I'}
                            </div>
                        </button>
                    </div>
                </div>

                <div className="p-8 max-w-7xl mx-auto pb-20">
                    <AnimatePresence mode="wait">
                        {activeView === 'dashboard' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h1 className="text-3xl font-bold text-foreground">My Teaching Day</h1>
                                        <p className="text-muted-foreground mt-1">Here is your daily mission.</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-primary uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                </div>

                                {/* HERO: TODAY'S MISSION */}
                                {loadingSession ? (
                                    <div className="h-64 bg-card rounded-2xl animate-pulse border border-border" />
                                ) : todaySession ? (
                                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl">
                                        {/* Background Decoration */}
                                        <div className="absolute top-0 right-0 p-12 opacity-10">
                                            <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg>
                                        </div>

                                        <div className="relative p-10 flex flex-col md:flex-row justify-between items-center gap-8">
                                            <div className="space-y-4">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                    Active Session
                                                </div>
                                                <h2 className="text-4xl font-bold tracking-tight">{(todaySession.training_standard as any)?.title}</h2>
                                                <div className="flex flex-wrap gap-6 text-blue-100 font-medium text-lg">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-5 w-5 opacity-70" />
                                                        09:00 - 16:00
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-5 w-5 opacity-70" />
                                                        {todaySession.location}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => router.push(`/dashboard?view=assessments&sessionId=${todaySession.id}`)}
                                                className="group relative px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3"
                                            >
                                                OPEN SESSION
                                                <div className="bg-blue-100 text-blue-600 p-1 rounded-full group-hover:translate-x-1 transition-transform">
                                                    <ArrowRight className="h-5 w-5" />
                                                </div>
                                            </button>
                                        </div>

                                        {/* QUICK STATUS STRIP */}
                                        <div className="bg-black/20 backdrop-blur-xl border-t border-white/10 p-6 grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-white/10">
                                            <div className="px-4 text-center md:text-left">
                                                <p className="text-blue-200 text-xs uppercase font-bold tracking-wider mb-1">Participants</p>
                                                <p className="text-2xl font-bold text-white">{stats.participants} <span className="text-sm font-normal text-blue-300">/ ?</span></p>
                                            </div>
                                            <div className="px-4 text-center md:text-left">
                                                <p className="text-blue-200 text-xs uppercase font-bold tracking-wider mb-1">Pending Assmts</p>
                                                <p className="text-2xl font-bold text-white">{stats.pendingAssmts}</p>
                                            </div>
                                            <div className="px-4 text-center md:text-left">
                                                <p className="text-blue-200 text-xs uppercase font-bold tracking-wider mb-1">Materials</p>
                                                <p className="text-base font-bold text-white flex items-center gap-2 justify-center md:justify-start"><CheckCircle className="h-4 w-4 text-emerald-400" /> {stats.materials} Files</p>
                                            </div>
                                            <div className="px-4 text-center md:text-left">
                                                <p className="text-blue-200 text-xs uppercase font-bold tracking-wider mb-1">Messages</p>
                                                <p className="text-base font-bold text-white flex items-center gap-2 justify-center md:justify-start"><span className="w-2 h-2 rounded-full bg-blue-400" /> {stats.messages} New</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-lg">
                                        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                                            <span className="text-4xl">☕</span>
                                        </div>
                                        <h2 className="text-2xl font-bold text-foreground">No active session today</h2>
                                        <p className="text-muted-foreground max-w-md mx-auto mt-2">You have no sessions scheduled for today. Enjoy your day off or check your upcoming schedule.</p>
                                        <button
                                            onClick={() => router.push('/dashboard?view=my-schedule')}
                                            className="mt-8 px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl transition-colors"
                                        >
                                            View Schedule
                                        </button>
                                    </div>
                                )}

                                {/* SHORTCUTS */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <button onClick={() => router.push('/dashboard?view=my-schedule')} className="p-6 bg-card border border-border hover:border-primary/50 hover:bg-primary/5 rounded-2xl text-left transition-all group">
                                        <Calendar className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                                        <p className="font-bold text-foreground">My Schedule</p>
                                        <p className="text-xs text-muted-foreground mt-1">Check upcoming dates</p>
                                    </button>
                                    <button onClick={() => router.push('/dashboard?view=participants')} className="p-6 bg-card border border-border hover:border-primary/50 hover:bg-primary/5 rounded-2xl text-left transition-all group">
                                        <Users className="h-8 w-8 text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
                                        <p className="font-bold text-foreground">Student Directory</p>
                                        <p className="text-xs text-muted-foreground mt-1">All past students</p>
                                    </button>
                                    <button onClick={() => router.push('/dashboard?view=documents')} className="p-6 bg-card border border-border hover:border-primary/50 hover:bg-primary/5 rounded-2xl text-left transition-all group">
                                        <FolderKanban className="h-8 w-8 text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
                                        <p className="font-bold text-foreground">File Repository</p>
                                        <p className="text-xs text-muted-foreground mt-1">Manage all docs</p>
                                    </button>
                                    <button onClick={() => router.push('/dashboard?view=profile')} className="p-6 bg-card border border-border hover:border-primary/50 hover:bg-primary/5 rounded-2xl text-left transition-all group">
                                        <User className="h-8 w-8 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
                                        <p className="font-bold text-foreground">My Profile</p>
                                        <p className="text-xs text-muted-foreground mt-1">Settings & info</p>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        {activeView === 'my-schedule' && <InstructorScheduleView />}
                        {activeView === 'sessions' && <MySessionsView />}
                        {activeView === 'participants' && <InstructorParticipantsView />}
                        {activeView === 'assessments' && <ManageSessionView sessionId={sessionId || todaySession?.id || ''} onBack={() => router.push('/dashboard')} />}
                        {activeView === 'documents' && <InstructorDocumentsView />}
                        {activeView === 'planned-activities' && <InstructorActivitiesView />}
                        {activeView === 'messages' && (
                            <div className="p-6 bg-card rounded-xl border border-border">
                                <h2 className="text-xl font-bold mb-4">Messages</h2>
                                <p className="text-muted-foreground">Session-based secure messaging.</p>
                            </div>
                        )}
                        {(activeView === 'profile' || activeView === 'settings') && <InstructorProfileView />}
                    </AnimatePresence>
                </div>
            </div>
            <NotificationsDialog
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                userId={user?.id || ''}
                onNavigate={(view) => { }}
            />
            {/* Control Center */}
            <ControlCenter
                isOpen={isControlCenterOpen}
                onClose={() => setIsControlCenterOpen(false)}
            />
        </div>
    );
}
