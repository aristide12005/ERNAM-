"use client";

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, LayoutDashboard, Search } from 'lucide-react';

// Components
import NotificationsDialog from '@/components/dashboard/NotificationsDialog';
import ControlCenter from '@/components/dashboard/ControlCenter';
import OrgParticipantsView from './OrgParticipantsView';
import OrgTrainingRequestsView from './OrgTrainingRequestsView';
import OrgInstructorsView from './OrgInstructorsView';
import OrgSessionsView from './OrgSessionsView';
import OrgCertificatesView from './OrgCertificatesView';
import OrgProfileView from './OrgProfileView';
import OrgSettingsView from './OrgSettingsView';
import OrgValidityView from './OrgValidityView';

import { useSearchParams } from 'next/navigation';

export default function OrgAdminDashboard() {
    const t = useTranslations('OrgAdmin');
    const { user, profile } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [isControlCenterOpen, setIsControlCenterOpen] = useState(false);

    const searchParams = useSearchParams();
    const activeView = searchParams.get('view') || 'dashboard';

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Sidebar managed by layout */}

            <div className="flex-1 relative text-slate-900">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm px-8 py-4 flex justify-between items-center border-b border-slate-200/60 shadow-sm">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-slate-800 capitalize flex items-center gap-2">
                            {/* Simple mapping for view title */}
                            {activeView === 'dashboard' ? t('dashboard.title') :
                                activeView === 'participants' ? t('participants.title') :
                                    activeView === 'instructors' ? t('instructors.title') :
                                        activeView === 'training-requests' ? t('requests.title') :
                                            activeView === 'sessions' ? t('sessions.title') :
                                                activeView === 'certificates' ? t('certificates.title') :
                                                    activeView.replace(/-/g, ' ')}
                        </h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={() => setShowNotifications(true)} className="relative p-2 hover:bg-slate-100 rounded-full transition-colors group">
                            <Bell className="h-5 w-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                        </button>

                        {/* Interactive Profile Header */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsControlCenterOpen(true)}
                                className="flex items-center gap-3 pl-6 border-l border-slate-200 outline-none group"
                            >
                                <div className="text-right hidden sm:block">
                                    <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider group-hover:text-blue-700 transition-colors">
                                        Org Admin
                                    </div>
                                    <div className="text-sm font-bold text-slate-900 uppercase italic tracking-tighter group-hover:text-blue-600 transition-colors">
                                        {profile?.full_name}
                                    </div>
                                </div>

                                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border-2 border-transparent group-hover:border-blue-200 transition-all shadow-sm">
                                    {profile?.full_name?.charAt(0).toUpperCase() || 'A'}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Control Center Popup */}
                <ControlCenter
                    isOpen={isControlCenterOpen}
                    onClose={() => setIsControlCenterOpen(false)}
                />

                {/* Content Area */}
                <div className="p-8 max-w-7xl mx-auto pb-20">
                    <AnimatePresence mode="wait">
                        {activeView === 'dashboard' && (
                            <motion.div
                                key="dashboard"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-8"
                            >
                                {/* KPI Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('dashboard.active_staff')}</h3>
                                        <p className="text-3xl font-black text-slate-900">12</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('dashboard.active_sessions')}</h3>
                                        <p className="text-3xl font-black text-blue-600">3</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('dashboard.pending_requests')}</h3>
                                        <p className="text-3xl font-black text-indigo-600">1</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('dashboard.expiring_certs')}</h3>
                                        <p className="text-3xl font-black text-amber-500">2</p>
                                    </div>
                                </div>

                                {/* Recent Alerts */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                        <h3 className="font-bold text-slate-800">{t('dashboard.recent_alerts')}</h3>
                                        <button className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase">View All</button>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {[1, 2].map(i => (
                                            <div key={i} className="px-6 py-4 hover:bg-slate-50 transition-colors flex gap-4">
                                                <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                    <Bell className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">New Safety Directive Released</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">ERNAM Authority - 2 hours ago</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Views */}
                        {activeView === 'participants' && <OrgParticipantsView />}
                        {activeView === 'instructors' && <OrgInstructorsView />}
                        {activeView === 'training-requests' && <OrgTrainingRequestsView />}
                        {activeView === 'sessions' && <OrgSessionsView />}

                        {/* Certificates & Validity combined or separate depending on sidebar */}
                        {activeView === 'certificates' && <OrgCertificatesView />}
                        {activeView === 'validity-tracking' && <OrgValidityView />}

                        {activeView === 'organization' && <OrgProfileView />}
                        {activeView === 'settings' && <OrgSettingsView />}
                    </AnimatePresence>
                </div>
            </div>

            <NotificationsDialog
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                userId={user?.id || ''}
                onNavigate={(view) => { }}
            />
        </div>
    );
}
