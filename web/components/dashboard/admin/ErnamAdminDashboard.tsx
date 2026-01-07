"use client";

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import OrganizationsView from '@/components/dashboard/admin/OrganizationsView';
import StandardsView from '@/components/dashboard/admin/StandardsView';
import SessionsView from '@/components/dashboard/admin/SessionsView';
import ApplicationsView from '@/components/dashboard/admin/ApplicationsView';
import UserManagement from '@/components/dashboard/admin/UserManagement';
import TrainingRequestsView from '@/components/dashboard/admin/TrainingRequestsView';
import AuditLogs from '@/components/dashboard/admin/AuditLogs';
import AdminSettings from '@/components/dashboard/admin/AdminSettings';
import InstructorsView from '@/components/dashboard/admin/InstructorsView';
import ParticipantsView from '@/components/dashboard/admin/ParticipantsView';
import CertificatesView from '@/components/dashboard/admin/CertificatesView';
import ControlCenter from '@/components/dashboard/ControlCenter';
import ErnamAdminOverview from '@/components/dashboard/ErnamAdminOverview';

import { useRouter, useSearchParams } from 'next/navigation';

export default function ErnamAdminDashboard() {
    const t = useTranslations();
    const { user, profile } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeView = searchParams.get('view') || 'dashboard';

    // UI State for Control Center
    const [isControlCenterOpen, setIsControlCenterOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Sidebar managed by DashboardLayoutClient -> layout.tsx */}

            <div className="flex-1 relative">
                {/* Header: Sticky, Blurry, Semantically Colored */}
                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-8 py-4 flex justify-between items-center border-b border-border">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold text-foreground capitalize">
                            {/* TODO: Translating view names would be better here */}
                            {activeView.replace('-', ' ')}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Clickable Profile Header -> Triggers Control Center */}
                        <button
                            onClick={() => setIsControlCenterOpen(true)}
                            className="flex items-center gap-3 pl-4 border-l border-border outline-none group"
                        >
                            <div className="text-right hidden sm:block">
                                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest group-hover:text-primary transition-colors">
                                    ERNAM Admin
                                </div>
                                <div className="text-sm font-bold text-foreground uppercase italic tracking-tighter group-hover:text-primary/80 transition-colors">
                                    {profile?.full_name}
                                </div>
                            </div>

                            {/* Circle Avatar */}
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border-2 border-transparent group-hover:border-primary transition-all shadow-sm">
                                {profile?.full_name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="p-0"> {/* Removed padding here to let Overview handle its own */}
                    <AnimatePresence mode="wait">
                        {activeView === 'dashboard' && (
                            <motion.div
                                key="dashboard"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <ErnamAdminOverview />
                            </motion.div>
                        )}
                        {activeView === 'organizations' && <OrganizationsView />}
                        {activeView === 'standards' && <StandardsView />}
                        {activeView === 'sessions' && <SessionsView />}
                        {activeView === 'training_requests' && <TrainingRequestsView />}
                        {activeView === 'applications' && <ApplicationsView />}
                        {activeView === 'users' && <UserManagement />}
                        {activeView === 'logs' && <AuditLogs />}
                        {activeView === 'settings' && <AdminSettings />}

                        {/* New Dedicated Views */}
                        {activeView === 'instructors' && <InstructorsView />}
                        {activeView === 'participants' && <ParticipantsView />}
                        {activeView === 'certificates' && <CertificatesView />}
                        {activeView === 'validity_tracking' && <CertificatesView />}

                        {/* Profile Fallback */}
                        {activeView === 'profile' && (
                            <div className="max-w-2xl mx-auto mt-8 bg-card p-8 rounded-2xl border border-border">
                                <h2 className="text-xl font-bold text-foreground mb-6">My Profile</h2>
                                <AdminSettings />
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* The Windows 11 Style Control Center */}
                <ControlCenter
                    isOpen={isControlCenterOpen}
                    onClose={() => setIsControlCenterOpen(false)}
                />
            </div>
        </div>
    );
}
