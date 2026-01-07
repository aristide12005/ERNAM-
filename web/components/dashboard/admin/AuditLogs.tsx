"use client";

import { useTranslations } from 'next-intl';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Activity,
    Search,
    Filter,
    Calendar,
    Clock,
    User,
    ArrowRightCircle,
    RotateCcw,
    FileSearch,
    Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuditLog {
    id: string;
    action: string;
    target_resource: string;
    timestamp: string;
    user_id: string;
}

export default function AuditLogs() {
    const t = useTranslations('AuditLogs');
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100);

        if (!error && data) setLogs(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target_resource.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-12">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Activity className="h-6 w-6 text-indigo-500" /> {t('title')}
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={fetchLogs}
                        className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg border border-white/10 transition-all"
                    >
                        <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2 transition-all">
                        <Download className="h-3 w-3" /> {t('export_logs')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative md:col-span-3">
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white"
                    />
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
                </div>
                <button className="bg-[#1A1A1A] border border-white/10 rounded-xl px-4 flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                    <Filter className="h-4 w-4" /> {t('filter_range')}
                </button>
            </div>

            <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-white/5 text-gray-500 uppercase text-[10px] font-black tracking-widest border-b border-white/5">
                                <th className="px-6 py-4">{t('table.event_time')}</th>
                                <th className="px-6 py-4">{t('table.actor')}</th>
                                <th className="px-6 py-4">{t('table.action')}</th>
                                <th className="px-6 py-4">{t('table.resource_id')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <AnimatePresence>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Clock className="h-8 w-8 text-indigo-500 animate-pulse" />
                                                <p className="text-gray-500 italic">{t('states.streaming')}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2 text-gray-500">
                                                <FileSearch className="h-10 w-10 opacity-20" />
                                                <p className="italic">{t('states.no_events')}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="hover:bg-white/5 transition-colors group border-l-2 border-transparent hover:border-indigo-500"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-mono text-xs">{new Date(log.timestamp).toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-gray-500 font-mono italic">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-300">
                                                    <User className="h-3 w-3 text-gray-500" />
                                                    <span className="text-xs uppercase font-bold tracking-tighter">{t('system_internal')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <ArrowRightCircle className="h-4 w-4 text-emerald-500" />
                                                    <span className="text-white font-bold">{log.action}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <code className="bg-black/40 text-gray-400 px-2 py-1 rounded text-[10px] border border-white/5">
                                                    {log.target_resource}
                                                </code>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
