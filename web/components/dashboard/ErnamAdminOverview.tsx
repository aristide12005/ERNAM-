"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
    TrendingUp
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
    const t = useTranslations('AdminDashboard');
    const { profile } = useAuth();
    // const supabase = createClient(); // REPLACED: using singleton imported above

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

            // 2. Applications
            const { count: pendingApps } = await supabase
                .from('applications')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            // 3. Certificates (Mock logic for 'expiring' for now w/ simple count)
            const { count: expiringCount } = await supabase
                .from('certificates')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'valid'); // In real app, filter by date < NOW() + 90

            // 4. Participants
            const { count: partCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'participant');

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
        <div className="min-h-screen bg-gray-50/50 dark:bg-background p-8 space-y-8 animate-in fade-in duration-500">

            {/* 1. Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {t('welcome', { name: profile?.full_name || 'Admin' })}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* 7. Quick Actions (Floating Top Right in Design) */}
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all text-sm font-medium">
                        <Plus className="w-4 h-4" />
                        {t('quick_actions.create_standard')}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-card border border-border hover:bg-gray-50 dark:hover:bg-accent text-foreground rounded-lg shadow-sm transition-all text-sm font-medium">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        {t('quick_actions.schedule_session')}
                    </button>
                </div>
            </div>

            {/* 4. KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <KpiCard
                    title={t('kpi.active_sessions')}
                    value={stats.activeSessions}
                    icon={Activity}
                    colorClass="bg-green-500 text-green-600"
                />
                <KpiCard
                    title={t('kpi.upcoming_sessions')}
                    value={stats.upcomingSessions}
                    icon={Calendar}
                    colorClass="bg-blue-500 text-blue-600"
                />
                <KpiCard
                    title={t('kpi.pending_applications')}
                    value={stats.pendingApplications}
                    icon={FileText}
                    colorClass="bg-orange-500 text-orange-600"
                />
                <KpiCard
                    title={t('kpi.expiring_certificates')}
                    value={stats.expiringCertificates}
                    icon={Award}
                    colorClass="bg-red-500 text-red-600"
                />
                <KpiCard
                    title={t('kpi.total_participants')}
                    value={stats.totalParticipants}
                    icon={Users}
                    colorClass="bg-purple-500 text-purple-600"
                />
            </div>

            {/* 5. Graphs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-96">

                {/* Left: Participant Trends */}
                <div className="lg:col-span-2 bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-border flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            {t('charts.participant_trends')}
                        </h3>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={CHART_DATA}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="enrolled" fill="#1D4ED8" radius={[4, 4, 0, 0]} barSize={30} />
                                <Bar dataKey="certified" fill="#93C5FD" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right: Application Status */}
                <div className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-border flex flex-col">
                    <h3 className="font-semibold text-lg text-foreground mb-6">
                        {t('charts.app_status')}
                    </h3>
                    <div className="flex-1 w-full min-h-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={PIE_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {PIE_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text Stub */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-foreground">
                                    {(stats.pendingApplications / (stats.totalParticipants || 1) * 100).toFixed(0)}%
                                </span>
                                <span className="text-xs text-muted-foreground uppercase">Pending</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center gap-4 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-700"></div>
                            <span className="text-muted-foreground">{t('charts.approved')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-300"></div>
                            <span className="text-muted-foreground">{t('charts.pending')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. Recent Activity Table */}
            <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center bg-gray-50/50 dark:bg-accent/10">
                    <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-500" />
                        {t('activity.title')}
                    </h3>
                    <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 uppercase tracking-wider">
                        View All Log
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-accent/20 text-muted-foreground uppercase tracking-wider text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">{t('activity.date')}</th>
                                <th className="px-6 py-4">{t('activity.actor')}</th>
                                <th className="px-6 py-4">{t('activity.action')}</th>
                                <th className="px-6 py-4">{t('activity.type')}</th>
                                <th className="px-6 py-4">{t('activity.status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-border">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-accent/10 transition-colors">
                                    <td className="px-6 py-4 font-medium text-foreground">
                                        {new Date(log.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-blue-600 font-medium">
                                        {log.actor?.full_name || 'System'}
                                    </td>
                                    <td className="px-6 py-4 text-foreground">
                                        {log.action}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-accent text-gray-600 dark:text-gray-300 text-xs font-medium">
                                            {log.entity_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-green-600 font-medium text-xs">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            Success
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground italic">
                                        No recent activity recorded.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 8. Footer */}
            <footer className="text-center py-8 text-xs text-muted-foreground border-t border-border mt-12">
                {t('footer_legal')}
            </footer>
        </div>
    );
}
