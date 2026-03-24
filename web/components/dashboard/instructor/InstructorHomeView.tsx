"use client";

import React, { useState } from 'react';
import { ComposedChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Line, CartesianGrid } from 'recharts';
import { MoreHorizontal, Users, FileText, TrendingUp } from 'lucide-react';

/* ---- Subtle menu trigger (3-dot) ---- */
const MenuBtn = () => (
    <button className="p-1.5 text-slate-300 hover:text-slate-500 rounded-lg hover:bg-slate-100 transition-all" aria-label="More options">
        <MoreHorizontal className="w-4 h-4" />
    </button>
);

/* ---- Badge component ---- */
const StatusBadge = ({ status }: { status: string }) => {
    const isPublished = status === 'Published';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${
            isPublished
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-amber-50 text-amber-700 border border-amber-100'
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {status}
        </span>
    );
};

export default function InstructorHomeView({ session, stats }: { session: any, stats: any }) {
    const [reportRange, setReportRange] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

    /* ====== Data Mapping ====== */
    const totalParticipants = stats?.participants || 0;
    const totalPending = stats?.pendingAssmts || 0;
    const totalMaterials = stats?.materials || 0;
    const totalCompleted = totalParticipants - totalPending;

    // Document store table
    const documentRows = [
        { id: 'DOC-001', name: 'Module 1 – Intro', type: 'PDF', size: '2.3 MB', status: 'Published' },
        { id: 'DOC-002', name: 'Module 2 – Core', type: 'PDF', size: '4.1 MB', status: 'Published' },
        { id: 'DOC-003', name: 'Assessment Guide', type: 'DOCX', size: '1.8 MB', status: 'Draft' },
        { id: 'DOC-004', name: 'Certificate Temp...', type: 'PDF', size: '0.5 MB', status: 'Published' },
        { id: 'DOC-005', name: 'Final Review', type: 'PDF', size: '3.2 MB', status: 'Draft' },
    ];

    // Attendance trend
    const attendanceDataMap = {
        weekly: [
            { name: 'Week 1', present: 3, absent: 2, rate: 8.15 },
            { name: 'Week 2', present: 5, absent: 1, rate: 35 },
            { name: 'Week 3', present: 7, absent: 2, rate: 55 },
            { name: 'Week 4', present: 6, absent: 3, rate: 75.25 },
        ],
        monthly: [
            { name: 'Sep', present: 22, absent: 5, rate: 78.5 },
            { name: 'Oct', present: 25, absent: 3, rate: 89.2 },
            { name: 'Nov', present: 24, absent: 4, rate: 85.7 },
            { name: 'Dec', present: 20, absent: 8, rate: 71.4 },
        ],
        yearly: [
            { name: '2023', present: 240, absent: 45, rate: 84.2 },
            { name: '2024', present: 280, absent: 30, rate: 90.3 },
            { name: '2025', present: 295, absent: 20, rate: 93.6 },
        ]
    };
    const currentAttendanceData = attendanceDataMap[reportRange];
    const courseTitle = session?.training_standard?.title || 'Training Overview';

    /* ====== Design Tokens ====== */
    // Premium card: pure white, subtle border, generous padding, large radius
    const card = "bg-white border border-slate-100 rounded-[1.75rem] shadow-sm relative overflow-hidden";
    const cardPadding = "p-8";
    // Card animate-in
    const cardAnimated = `${card} ${cardPadding} animate-in fade-in slide-in-from-bottom-4 fill-mode-both`;

    /* ====== Metric Card Data ====== */
    const metrics = [
        {
            icon: <Users className="w-5 h-5" />,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            label: 'Total Trainees',
            value: totalParticipants ? totalParticipants.toLocaleString() : '30,000',
            trend: '+4.2% this month',
            trendUp: true,
        },
        {
            icon: <FileText className="w-5 h-5" />,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
            label: 'Documents',
            value: totalMaterials ? totalMaterials.toLocaleString() : '32',
            trend: '5 added this week',
            trendUp: true,
        },
        {
            icon: <TrendingUp className="w-5 h-5" />,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            label: 'Completion Rate',
            value: totalParticipants > 0 ? `${Math.round((totalCompleted / totalParticipants) * 100)}%` : '—',
            trend: 'up from last month',
            trendUp: true,
        },
    ];

    return (
        <div className="space-y-6 w-full">

            {/* ─── SECTION HEADER ─────────────────────────────────── */}
            <div className="flex items-center justify-between" style={{ animationDelay: '0ms' }}>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Overview</p>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{courseTitle}</h1>
                </div>
            </div>

            {/* ─── TOP METRICS ROW ────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {metrics.map((m, i) => (
                    <div
                        key={i}
                        className={`${cardAnimated} hover:shadow-md hover:-translate-y-px transition-all duration-300 cursor-default`}
                        style={{ animationDelay: `${(i + 1) * 80}ms` }}
                    >
                        {/* Decorative top gradient strip */}
                        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-400 opacity-60" />
                        <div className="flex justify-between items-start mb-6">
                            <div className={`w-11 h-11 rounded-2xl ${m.bg} ${m.color} flex items-center justify-center shrink-0`}>
                                {m.icon}
                            </div>
                            <MenuBtn />
                        </div>
                        <p className="text-[13px] font-semibold text-slate-400 mb-1 uppercase tracking-widest">{m.label}</p>
                        <p className="text-4xl font-black text-slate-900 leading-none">{m.value}</p>
                        <p className="text-xs font-semibold text-slate-400 mt-3">{m.trend}</p>
                    </div>
                ))}
            </div>

            {/* ─── ATTENDANCE QUICK SUMMARY (Wide Card) ──────────── */}
            <div className={`${cardAnimated} hover:shadow-md transition-all duration-300`} style={{ animationDelay: '360ms' }}>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Latest Session</p>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Attendance Summary</h3>
                    </div>
                    <MenuBtn />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {/* Last class */}
                    <div>
                        <p className="text-xs font-bold text-slate-400 mb-4 tracking-tight">Last class · Sat, Jan 31</p>
                        <div className="flex justify-between mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Present</span>
                            <span className="text-xs font-bold text-slate-800">75%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden mb-4">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: '75%' }} />
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Absent</span>
                            <span className="text-xs font-bold text-rose-600">25%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full bg-rose-400 rounded-full transition-all duration-500" style={{ width: '25%' }} />
                        </div>
                    </div>
                    {/* Today */}
                    <div>
                        <p className="text-xs font-bold text-slate-400 mb-4 tracking-tight">Today · Tue, Feb 3</p>
                        <div className="flex justify-between mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Present</span>
                            <span className="text-xs font-bold text-slate-400">—</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '0%' }} />
                        </div>
                        <p className="mt-6 text-sm text-slate-400 italic">Session not started yet.</p>
                    </div>
                </div>
            </div>

            {/* ─── BOTTOM 2-COL: Table + Chart ────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Document Store */}
                <div className={`${cardAnimated}`} style={{ animationDelay: '440ms' }}>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Library</p>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Document Store</h3>
                        </div>
                        <MenuBtn />
                    </div>
                    <div className="overflow-x-auto -mx-1">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="pb-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Document</th>
                                    <th className="pb-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Type</th>
                                    <th className="pb-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Size</th>
                                    <th className="pb-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {documentRows.map((doc, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50/60 transition-colors cursor-pointer">
                                        <td className="py-3.5 flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 ${
                                                ['bg-blue-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500', 'bg-teal-500'][idx % 5]
                                            }`}>
                                                {doc.name.charAt(0)}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-800 truncate max-w-[150px]">{doc.name}</span>
                                        </td>
                                        <td className="py-3.5 text-sm text-slate-400 font-medium">{doc.type}</td>
                                        <td className="py-3.5 text-sm text-slate-400 font-medium">{doc.size}</td>
                                        <td className="py-3.5 text-right">
                                            <StatusBadge status={doc.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Attendance Trend Chart */}
                <div className={`${cardAnimated}`} style={{ animationDelay: '520ms' }}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Analytics</p>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Attendance Trend</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={reportRange}
                                onChange={(e) => setReportRange(e.target.value as any)}
                                className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 font-bold cursor-pointer transition-colors hover:border-slate-300"
                            >
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                            <MenuBtn />
                        </div>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-5 mb-5">
                        {[
                            { color: '#bfdbfe', label: 'Present' },
                            { color: '#3b82f6', label: 'Absent' },
                        ].map((l, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{l.label}</span>
                            </div>
                        ))}
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 border-t-2 border-dashed border-slate-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rate</span>
                        </div>
                    </div>
                    <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={currentAttendanceData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barGap={3}>
                                <CartesianGrid vertical={false} strokeDasharray="2 4" stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }}
                                    dy={8}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(59,130,246,0.04)' }}
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        padding: '12px 16px'
                                    }}
                                />
                                <Bar dataKey="present" fill="#bfdbfe" radius={[6, 6, 0, 0]} barSize={28} />
                                <Bar dataKey="absent" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={28} />
                                <Line
                                    type="monotone"
                                    dataKey="rate"
                                    stroke="#64748b"
                                    strokeWidth={2}
                                    strokeDasharray="4 3"
                                    dot={{ r: 4, fill: '#fff', stroke: '#64748b', strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}
