"use client";

import { useAuth } from '@/components/providers/AuthProvider';
import { LogOut, RefreshCw, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function PendingPage() {
    const t = useTranslations('Pending');
    const { profile, refreshProfile, signOut } = useAuth();

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-background to-background z-0 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-lg p-8 bg-card border border-amber-500/20 rounded-2xl shadow-2xl text-center"
            >
                <div className="h-20 w-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-amber-500/20">
                    <Clock className="h-10 w-10 text-amber-500 animate-pulse" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">{t('title')}</h1>
                <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                    {t.rich('thank_you', { name: profile?.full_name ?? 'Student' })}
                    <br />
                    {t.rich('request_received', { role: profile?.role ?? 'Student' })}
                    <br /><br />
                    {t('security_notice')}
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => refreshProfile()}
                        className="w-full py-3 bg-secondary hover:bg-secondary/80 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-white/5"
                    >
                        <RefreshCw className="h-4 w-4" /> {t('check_status')}
                    </button>

                    <button
                        onClick={() => signOut()}
                        className="w-full py-3 text-red-400 hover:text-red-300 hover:bg-red-950/30 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut className="h-4 w-4" /> {t('sign_out')}
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 text-xs text-gray-600">
                    ID: {profile?.id?.slice(0, 8)}... • {t('queue_position')}
                </div>
            </motion.div>
        </div>
    );
}
