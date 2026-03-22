"use client";

import { useAuth } from '@/components/providers/AuthProvider';
import { motion } from 'framer-motion';
import { UserCog, LogOut, ShieldAlert } from 'lucide-react';

export default function ImpersonationBanner() {
    const { impersonator, profile, stopImpersonation } = useAuth();

    if (!impersonator || !profile) return null;

    return (
        <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-2xl border-b border-white/10"
        >
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                        <UserCog className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <span className="text-xs font-bold text-blue-100 uppercase tracking-widest">Acting As:</span>
                        <span className="text-sm font-black tracking-tight">{profile.full_name}</span>
                        <span className="hidden sm:inline text-blue-300/50">|</span>
                        <span className="text-[10px] text-blue-200/80 font-medium">Logged in as {impersonator.full_name}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                        <ShieldAlert className="h-3 w-3 text-amber-300" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">Session Audited</span>
                    </div>
                    
                    <button
                        onClick={stopImpersonation}
                        className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-1.5 rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-2 active:scale-95"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        EXIT SESSION
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
