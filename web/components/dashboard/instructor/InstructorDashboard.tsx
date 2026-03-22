"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Clock, MapPin, Calendar, Users, FolderKanban, User, CheckCircle, ArrowRight } from 'lucide-react';
import NotificationsDialog from '@/components/dashboard/NotificationsDialog';
import MySessionsView from '@/components/dashboard/instructor/MySessionsView';
import ManageSessionView from '@/components/dashboard/instructor/ManageSessionView';
import InstructorScheduleView from './InstructorScheduleView';
import InstructorParticipantsView from './InstructorParticipantsView';
import InstructorAttendanceView from './InstructorAttendanceView';
import InstructorNotesView from './InstructorNotesView';
import Gradebook from './Gradebook';
import InstructorActivitiesView from './InstructorActivitiesView';
import InstructorDocumentsView from './InstructorDocumentsView';
import InstructorProfileView from './InstructorProfileView';
import ControlCenter from '@/components/dashboard/ControlCenter';
import MyClasses from '@/components/dashboard/instructor/MyClasses';
import InstructorHomeView from './InstructorHomeView';

import { useSearchParams, useRouter } from 'next/navigation';

export default function InstructorDashboard() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [showNotifications, setShowNotifications] = useState(false);
    const [isControlCenterOpen, setIsControlCenterOpen] = useState(false);

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

            const { data: session } = await supabase
                .from('sessions')
                .select(`
                    id, start_date, end_date, location, status,
                    training_standard:training_standards(title, code)
                `)
                .in('id', sessionIds)
                .gte('end_date', new Date().toISOString().split('T')[0])
                .order('start_date', { ascending: true })
                .limit(1)
                .single();

            if (session) {
                setTodaySession(session);

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
                    messages: 0
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
        <div className="min-h-screen">
            <div className="flex-1 relative">
                <div className="max-w-[1400px] mx-auto pb-20">
                    <AnimatePresence mode="wait">
                        {activeView === 'dashboard' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                <InstructorHomeView session={todaySession} stats={stats} />
                            </motion.div>
                        )}
                        {activeView === 'my-schedule' && <InstructorScheduleView />}
                        {activeView === 'sessions' && <MyClasses instructorId={user?.id || ''} onManageClass={(id) => router.push(`/dashboard?view=assessments&sessionId=${id}`)} />}
                        {activeView === 'participants' && <InstructorParticipantsView />}
                        {activeView === 'attendance' && <InstructorAttendanceView />}
                        {activeView === 'notes' && <InstructorNotesView />}
                        {activeView === 'results_scores' && <Gradebook instructorId={user?.id || ''} />}
                        {activeView === 'assessments' && <ManageSessionView sessionId={sessionId || todaySession?.id || ''} onBack={() => router.push('/dashboard')} />}
                        {activeView === 'documents' && <InstructorDocumentsView />}
                        {activeView === 'planned-activities' && <InstructorActivitiesView />}
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
            <ControlCenter
                isOpen={isControlCenterOpen}
                onClose={() => setIsControlCenterOpen(false)}
            />
        </div>
    );
}
