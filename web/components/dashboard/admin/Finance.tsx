"use client";

import { useTranslations } from 'next-intl';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    CreditCard,
    Download,
    Calendar,
    BarChart3,
    ArrowDownRight
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';

export default function Finance() {
    const t = useTranslations('Finance');
    const [stats, setStats] = useState({
        totalRevenue: 0,
        pendingRevenue: 0,
        growthRate: 15.4,
        averageEnrollmentFee: 450000
    });

    const [transactions] = useState([
        { id: 'T1', trainee: 'Ahmed Fall', amount: 450000, date: '2024-03-20', status: 'completed' },
        { id: 'T2', trainee: 'Ibrahima Diallo', amount: 350000, date: '2024-03-19', status: 'pending' },
        { id: 'T3', trainee: 'Mariama Sey', amount: 500000, date: '2024-03-18', status: 'completed' },
        { id: 'T4', trainee: 'Omar Kane', amount: 200000, date: '2024-03-17', status: 'failed' },
    ]);

    const revenueData = [
        { name: 'Jan', revenue: 1200000, enrollments: 12 },
        { name: 'Feb', revenue: 1500000, enrollments: 18 },
        { name: 'Mar', revenue: 2100000, enrollments: 25 },
        { name: 'Apr', revenue: 1800000, enrollments: 20 },
        { name: 'May', revenue: 2500000, enrollments: 30 },
        { name: 'Jun', revenue: 3200000, enrollments: 38 },
    ];

    return (
        <div className="space-y-8 pb-12">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-emerald-500" /> {t('title')}
                </h2>
                <button className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2 transition-all">
                    <Download className="h-3 w-3" /> {t('export_report')}
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#1A1A1A] border border-white/5 p-6 rounded-2xl space-y-2">
                    <div className="flex justify-between items-start">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('kpi.total_revenue')}</p>
                        <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-md">
                            <TrendingUp className="h-3 w-3" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">$12.4M</div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" /> +24%
                    </div>
                </div>

                <div className="bg-[#1A1A1A] border border-white/5 p-6 rounded-2xl space-y-2">
                    <div className="flex justify-between items-start">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('kpi.pending_collections')}</p>
                        <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-md">
                            <CreditCard className="h-3 w-3" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">$850K</div>
                    <p className="text-[10px] text-gray-500">{t('kpi.active_invoices', { count: 14 })}</p>
                </div>

                <div className="bg-[#1A1A1A] border border-white/5 p-6 rounded-2xl space-y-2">
                    <div className="flex justify-between items-start">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('kpi.avg_course_fee')}</p>
                        <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md">
                            <BarChart3 className="h-3 w-3" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">$45.2K</div>
                    <div className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
                        <ArrowDownRight className="h-3 w-3" /> -2.4% {t('kpi.this_month')}
                    </div>
                </div>

                <div className="bg-[#1A1A1A] border border-white/5 p-6 rounded-2xl space-y-2">
                    <div className="flex justify-between items-start">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('kpi.enrollment_growth')}</p>
                        <div className="p-1.5 bg-purple-500/10 text-purple-500 rounded-md">
                            <BarChart3 className="h-3 w-3" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">15.4%</div>
                    <p className="text-[10px] text-gray-500">{t('kpi.target')}: 20%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-[#141414] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">{t('charts.revenue_forecast')}</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="name" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#555" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '10px' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Enrollment Distribution */}
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">{t('charts.enrollment_mix')}</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="name" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px' }}
                                    cursor={{ fill: '#ffffff05' }}
                                />
                                <Bar dataKey="enrollments" radius={[4, 4, 0, 0]}>
                                    {revenueData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3B82F6' : '#1D4ED8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t('transactions.title')}</h3>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors border border-white/10">
                            <Filter className="h-4 w-4 text-gray-500" />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                        <thead>
                            <tr className="bg-white/5 text-gray-500 uppercase font-black tracking-widest border-b border-white/5">
                                <th className="px-6 py-4">{t('transactions.headers.trainee')}</th>
                                <th className="px-6 py-4">{t('transactions.headers.amount')}</th>
                                <th className="px-6 py-4">{t('transactions.headers.date')}</th>
                                <th className="px-6 py-4">{t('transactions.headers.status')}</th>
                                <th className="px-6 py-4 text-right">{t('transactions.headers.invoice')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transactions.map((t) => (
                                <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-white">{t.trainee}</td>
                                    <td className="px-6 py-4 text-emerald-500 font-mono">${t.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-gray-500 font-mono">{t.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight border ${t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            t.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                            {t(`transactions.status.${t.status}` as any) || t.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-blue-500 hover:text-white transition-colors">
                                            <Download className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Simple Filter Icon fallback
function Filter({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    );
}
