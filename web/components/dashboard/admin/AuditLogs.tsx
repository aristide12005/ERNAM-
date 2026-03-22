"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
    Activity, Search, Filter, Calendar, Clock, User, 
    ArrowRightCircle, RotateCcw, FileSearch, Download, Ghost 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuditLog {
    id: string;
    action: string;
    target_resource: string;
    timestamp: string;
    user_id: string;
    impersonated_by?: string;
}

export default function AuditLogs() {
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
        <div className="p-6 md:p-12 space-y-8 min-h-screen bg-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                            <Activity className="h-6 w-6" />
                        </div>
                        System Audit Trail
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Real-time security and administrative logs</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchLogs}
                        className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl border border-slate-100 transition-all active:scale-95"
                    >
                        <RotateCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                        <Download className="h-4 w-4" /> Export Data
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative md:col-span-3">
                    <input
                        type="text"
                        placeholder="Search by action or resource..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-slate-100 rounded-[20px] py-4 pl-14 pr-6 text-sm font-bold tracking-tight focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-900 placeholder:text-slate-300 shadow-sm"
                    />
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                </div>
                <button className="bg-white border border-slate-100 rounded-[20px] px-6 flex items-center justify-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                    <Filter className="h-4 w-4" /> Filter Range
                </button>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-[#8E9296] text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                <th className="px-8 py-5 font-black uppercase tracking-widest">Timestamp</th>
                                <th className="px-8 py-5 font-black uppercase tracking-widest">Actor</th>
                                <th className="px-8 py-5 font-black uppercase tracking-widest">Action</th>
                                <th className="px-8 py-5 font-black uppercase tracking-widest">Context</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-24 text-center">
                                            <RotateCcw className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
                                            <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">Synchronizing Logs...</p>
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center gap-3 text-slate-300">
                                                <FileSearch className="h-12 w-12 opacity-20" />
                                                <p className="font-black text-xs uppercase tracking-widest italic italic">No matching activities found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-slate-50/50 transition-colors group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <Clock className="h-4 w-4 text-slate-300" />
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-900 font-bold text-xs">{new Date(log.timestamp).toLocaleDateString()}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium italic">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                                                        {log.impersonated_by ? <Ghost className="h-4 w-4 text-blue-600" /> : <User className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-black text-slate-900 uppercase tracking-tight">System Account</div>
                                                        {log.impersonated_by && (
                                                            <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-0.5 whitespace-nowrap">
                                                                ACT AS SESSION
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    <span className="text-slate-900 font-bold text-sm">{log.action}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <code className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-slate-200/50">
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
