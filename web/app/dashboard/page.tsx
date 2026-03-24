"use client";

import { useAuth } from '@/components/providers/AuthProvider';
import ParticipantDashboard from '@/components/dashboard/participant/ParticipantDashboard';
import InstructorDashboard from '@/components/dashboard/instructor/InstructorDashboard';
import ErnamAdminDashboard from '@/components/dashboard/admin/ErnamAdminDashboard';

export default function DashboardPage() {
    const { profile, loading, signOut, refreshProfile } = useAuth();

    if (loading) return (
        <div className="h-screen w-full flex items-center justify-center bg-white text-gray-900">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                Loading Interface...
            </div>
        </div>
    );

    // Role-Based Routing — aligned with database role names
    if (profile?.role === 'participant' || profile?.role === 'trainee') return <ParticipantDashboard />;
    if (profile?.role === 'instructor' || profile?.role === 'trainer') return <InstructorDashboard />;
    if (profile?.role === 'ernam_admin' || profile?.role === 'org_admin' || profile?.role === 'admin') return <ErnamAdminDashboard />;

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 text-gray-900 p-4 text-center">
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl w-full max-w-md">
                <h1 className="text-2xl font-bold mb-2 text-red-400">Access Denied</h1>
                <p className="text-gray-400 text-sm">Your account exists, but your role profile is missing or unauthorized.</p>
                <div className="mt-4 text-xs font-mono text-gray-500 bg-black/30 p-3 rounded-xl border border-white/5 text-left break-all">
                    <div>User ID: {profile?.id || 'Loaded from Auth'}</div>
                    <div className="mt-1">Role: {profile?.role || 'Unknown / Missing Profile'}</div>
                    <div className="mt-1 opacity-50 italic">Status: {profile?.status || 'Unknown'}</div>
                </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                    onClick={async () => {
                        console.log("Retrying profile fetch...");
                        await refreshProfile();
                    }}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 transition-all shadow-lg active:scale-95"
                >
                    Retry Connection
                </button>
                
                <button
                    onClick={() => signOut()}
                    className="px-6 py-3 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-all border border-white/10"
                >
                    Sign Out & Return to Login
                </button>
            </div>
            
            <p className="mt-8 text-xs text-gray-500 uppercase tracking-widest font-bold opacity-50">
                ERNAM Digital Twin - Security Layer
            </p>
        </div>
    );
}
