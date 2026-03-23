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
            className="fixed top-0 left-0 right-0 z-[100] bg-blue-600/30 backdrop-blur-xl text-white shadow-[0_4px_20px_rgba(0,0,0,0.1)] border-b border-white/10"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-white/5 to-indigo-500/10 pointer-events-none" />
            
            <div className="relative px-6 h-14 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                        <UserCog className="h-4 w-4 text-blue-200" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Impersonation Mode</span>
                    </div>
                    
                    <div className="h-4 w-px bg-white/10 hidden sm:block" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                        <div className="text-sm font-black tracking-tight flex items-center gap-2">
                             <span className="opacity-60 font-medium">Acting as</span> {impersonator.full_name}
                        </div>
                        <span className="hidden sm:inline opacity-30">├óΓÇö┬Å</span>
                        <div className="text-[11px] font-bold text-blue-100/70 tracking-tight">
                            Viewing: <span className="text-white">{profile.full_name}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-200">Real-Time Sync</span>
                    </div>
                    
                    <button
                        onClick={stopImpersonation}
                        className="bg-white text-blue-700 hover:bg-blue-50 px-5 py-2 rounded-xl text-[11px] font-black shadow-xl shadow-blue-900/20 transition-all flex items-center gap-2 active:scale-95 uppercase tracking-widest"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        Stop Viewing
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
