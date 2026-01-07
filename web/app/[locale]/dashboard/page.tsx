"use client";

import { useAuth } from '@/components/providers/AuthProvider';
import { useTranslations } from 'next-intl';
import ParticipantDashboard from '@/components/dashboard/participant/ParticipantDashboard';
import InstructorDashboard from '@/components/dashboard/instructor/InstructorDashboard';
import OrgAdminDashboard from '@/components/dashboard/org/OrgAdminDashboard';
import ErnamAdminDashboard from '@/components/dashboard/admin/ErnamAdminDashboard';

export default function DashboardPage() {
    const t = useTranslations('Common');
    const { profile, loading, signOut } = useAuth();

    if (loading) return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                {t('loading')}
            </div>
        </div>
    );

    // Role-Based Routing
    if (profile?.role === 'participant') return <ParticipantDashboard />;
    if (profile?.role === 'instructor') return <InstructorDashboard />;
    if (profile?.role === 'org_admin') return <OrgAdminDashboard />;
    if (profile?.role === 'ernam_admin') return <ErnamAdminDashboard />;

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-900 text-white p-4 text-center">
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <h1 className="text-2xl font-bold mb-2 text-red-400">Access Denied</h1>
                <p className="text-gray-400 text-sm">Your account exists, but your role profile is missing or unauthorized.</p>
                <div className="mt-2 text-xs font-mono text-gray-500 bg-black/30 p-2 rounded">
                    Role: {profile?.role || 'Unknown / Missing Profile'}
                </div>
            </div>

            <button
                onClick={() => signOut()}
                className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
            >
                Sign Out & Return to Login
            </button>
        </div>
    );
}
