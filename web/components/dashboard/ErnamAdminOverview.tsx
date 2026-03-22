/* eslint-disable react-hooks/exhaustive-deps, react-hooks/rules-of-hooks, @typescript-eslint/ban-ts-comment, react/no-unescaped-entities, react-hooks/immutability, @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import {
    Activity,
    Calendar,
    Users,
    FileText,
    Award,
    Plus,
    Clock,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    MoreVertical
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { cn } from "@/lib/utils";

// --- Types ---
type KpiStats = {
    activeSessions: number;
    upcomingSessions: number;
    pendingApplications: number;
    expiringCertificates: number;
    totalParticipants: number;
};

type AuditLog = {
    id: string;
    created_at: string;
    action: string;
    entity_type: string;
    status: string; // inferred or added
    actor: { full_name: string } | null;
};

// --- Mock Data for Charts (Fallback) ---
const CHART_DATA = [
    { name: 'Jan', enrolled: 40, certified: 24 },
    { name: 'Feb', enrolled: 30, certified: 13 },
    { name: 'Mar', enrolled: 20, certified: 98 },
    { name: 'Apr', enrolled: 27, certified: 39 },
    { name: 'May', enrolled: 18, certified: 48 },
    { name: 'Jun', enrolled: 23, certified: 38 },
];

const PIE_DATA = [
    { name: 'Approved', value: 400 },
    { name: 'Pending', value: 300 },
];

const COLORS = ['#1D4ED8', '#93C5FD']; // Blue-600, Blue-300

export default function ErnamAdminOverview() {
    const { profile } = useAuth();

    const [stats, setStats] = useState<KpiStats>({
        activeSessions: 0,
        upcomingSessions: 0,
        pendingApplications: 0,
        expiringCertificates: 0,
        totalParticipants: 0
    });

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // 1. Sessions
            const { count: activeCount } = await supabase
                .from('sessions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            const { count: upcomingCount } = await supabase
                .from('sessions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'planned');

            // 2. Applications (Trainer applications)
            const { count: pendingApps } = await supabase
                .from('applications')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            // 3. Certificates (Mock logic for 'expiring' for now w/ simple count)
            const { count: expiringCount } = await supabase
                .from('certificates')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'valid'); // In real app, filter by date < NOW() + 90

            // 4. Trainees
            const { count: partCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'trainee');

            setStats({
                activeSessions: activeCount || 0,
                upcomingSessions: upcomingCount || 0,
                pendingApplications: pendingApps || 0,
                expiringCertificates: expiringCount || 0,
                totalParticipants: partCount || 0
            });

            // 5. Audit Logs
            const { data: logData } = await supabase
                .from('audit_logs')
                .select('*, actor:users(full_name)')
                .order('created_at', { ascending: false })
                .limit(10);

            // @ts-ignore - Supabase type inference tricky with nested relations sometimes
            setLogs(logData || []);

            setLoading(false);
        };

        fetchData();
    }, []);

    // Helper: KPI Card Component
    const KpiCard = ({ title, value, icon: Icon, colorClass }: any) => (
        <div className="bg-white dark:bg-card p-6 rounded-lg shadow-sm border border-gray-100 dark:border-border hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10 group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
                </div>
                <span className={`text-2xl font-bold text-gray-900 dark:text-foreground`}>
                    {value}
                </span>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {title}
            </h3>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* 2. Top Grid: KPI + Dynamics Chart + Asset Shares */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Left: Balance style KPI */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <div className="backdrop-blur-xl bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-2xl h-full flex flex-col justify-between hover:bg-white/10 transition-all">
                        <div>
                            <p className="text-white/40 text-[10px] font-black tracking-widest mb-3 uppercase">Total Network Reach</p>
                            <div className="flex items-center gap-3">
                                <span className="text-4xl font-bold text-white tracking-tighter">
                                    {stats.totalParticipants.toLocaleString()}
                                </span>
                                <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-emerald-500/20">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>+16.3%</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 space-y-4">
                            <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Quick View</p>
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-white/40">Active</span>
                                <span className="text-white">{stats.activeSessions}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-white/40">Pending</span>
                                <span className="text-white">{stats.pendingApplications}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center: Dynamics of the balance (Bar Chart) */}
                <div className="lg:col-span-6 backdrop-blur-xl bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-lg text-white tracking-tight">Trainee Dynamics</h3>
                        <button className="text-white/20 hover:text-white transition-colors p-1"><MoreVertical className="w-5 h-5" /></button>
                    </div>
                    <div className="flex-1 w-full min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={CHART_DATA}>
                                <XAxis 
                                    dataKey="name" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tick={{fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold'}}
                                />
                                <Tooltip
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    contentStyle={{ backgroundColor: 'rgba(15, 1, 33, 0.9)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar 
                                    dataKey="enrolled" 
                                    fill="rgba(255,255,255,0.1)" 
                                    radius={[4, 4, 4, 4]} 
                                    barSize={14} 
                                    background={{ fill: 'transparent' }}
                                />
                                <Bar 
                                    dataKey="certified" 
                                    fill="#F43F5E" // Vibrant Rose/Red from mockup
                                    radius={[4, 4, 0, 0]} 
                                    barSize={2} 
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right: Shares of assets (Role/Type Distribution) */}
                <div className="lg:col-span-3 backdrop-blur-xl bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-lg text-white tracking-tight">Access Distribution</h3>
                        <button className="text-white/20 hover:text-white transition-colors p-1"><MoreVertical className="w-5 h-5" /></button>
                    </div>
                    <div className="space-y-6">
                        {[
                            { name: 'Admins', value: 12, total: 100, color: 'from-indigo-500 to-purple-600' },
                            { name: 'Trainers', value: 36, total: 100, color: 'from-blue-500 to-indigo-600' },
                            { name: 'Trainees', value: 52, total: 100, color: 'from-emerald-400 to-teal-500' },
                        ].map((asset) => (
                            <div key={asset.name} className="space-y-3">
                                <div className="flex justify-between text-[11px] font-bold tracking-tight">
                                    <span className="text-white/40 uppercase tracking-widest">{asset.name}</span>
                                    <span className="text-white">{asset.value}%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className={cn("h-full rounded-full transition-all duration-1000 bg-gradient-to-r", asset.color)} 
                                        style={{ width: `${asset.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Recent Activity Table */}
            <div className="mt-8 backdrop-blur-xl bg-white/5 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-white tracking-tight">Real-time Activity</h3>
                    <div className="flex items-center gap-6">
                        <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-white/20">
                            <span className="text-white border-b-2 border-white pb-1 cursor-pointer">Daily</span>
                            <span className="cursor-pointer hover:text-white transition-colors">Weekly</span>
                            <span className="cursor-pointer hover:text-white transition-colors">Monthly</span>
                        </div>
                        <button className="bg-white text-black px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all shadow-lg shadow-white/10 active:scale-95">
                            Filter
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-5">Timestamp</th>
                                <th className="px-8 py-5">Actor</th>
                                <th className="px-8 py-5">Action</th>
                                <th className="px-8 py-5 text-right">Status</th>
                                <th className="px-8 py-5 text-right">Event</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.map((log) => (
                                <tr key={log.id} className="group hover:bg-white/[0.04] transition-colors">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 font-bold text-[10px]">
                                                {log.entity_type.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-white text-xs">{new Date(log.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-white/40 font-medium text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                            {log.actor?.full_name || 'System'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className="text-white font-bold text-xs uppercase tracking-tight">{log.action}</span>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                            Success
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <button className="text-blue-400 text-xs font-bold hover:underline transition-all">
                                            Details →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 8. Footer */}
            <footer className="text-center py-8 text-xs text-white/20 border-t border-white/5 mt-12">
                ERNAM – Secure Aviation Network Environment | All rights reserved
            </footer>
        </div>
    );
}
