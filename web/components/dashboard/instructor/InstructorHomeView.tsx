"use client";

import React, { useState } from 'react';
import { ComposedChart, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Line, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { MoreHorizontal } from 'lucide-react';

/* ---- Reusable tiny icon for the 6-dot grid (:::) ---- */
const DotsGrid = () => (
    <button className="p-1.5 text-gray-300 hover:text-gray-500 transition-colors">
        <div className="grid grid-cols-3 gap-[3px] opacity-60">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="w-[3px] h-[3px] bg-current rounded-full" />
            ))}
        </div>
    </button>
);

/* ---- Reusable tiny icon for the 3-dot row (ooo) ---- */
const DotsRow = () => (
    <button className="p-1 text-gray-300 hover:text-gray-500 transition-colors">
        <MoreHorizontal className="w-4 h-4" />
    </button>
);

export default function InstructorHomeView({ session, stats }: { session: any, stats: any }) {
    const [reportRange, setReportRange] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

    /* ====== Data Mapping ====== */
    const totalParticipants = stats?.participants || 0;
    const totalPending = stats?.pendingAssmts || 0;
    const totalMaterials = stats?.materials || 0;
    const totalCompleted = totalParticipants - totalPending;

    // Top metrics variables adapted for new layout

    // Document store table
    const documentRows = [
        { id: 'DOC-001', name: 'Module 1 – Intro', type: 'PDF', size: '2.3 MB', status: 'Published' },
        { id: 'DOC-002', name: 'Module 2 – Core', type: 'PDF', size: '4.1 MB', status: 'Published' },
        { id: 'DOC-003', name: 'Assessment Guide', type: 'DOCX', size: '1.8 MB', status: 'Draft' },
        { id: 'DOC-004', name: 'Certificate Temp...', type: 'PDF', size: '0.5 MB', status: 'Published' },
        { id: 'DOC-005', name: 'Final Review', type: 'PDF', size: '3.2 MB', status: 'Draft' },
    ];

    // Attendance trend (bar + line mixed chart)
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

    /* ====== Card Styling ====== */
    const cardClass = "bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 rounded-[1.5rem] p-7 shadow-[0_2px_16px_rgba(0,0,0,0.03)] relative animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both";
    const headerClass = "flex items-center justify-between mb-6";
    const titleClass = "text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight";

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto w-full">

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
                {/* Total Trainees */}
                <div className={`${cardClass} flex flex-col justify-between hover:shadow-md transition-all`} style={{ animationDelay: '100ms' }}>
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 font-bold flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        </div>
                        <DotsGrid />
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400 mb-1 tracking-tight">Total Trainee</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{totalParticipants ? totalParticipants.toLocaleString() : '30,000'}</p>
                    </div>
                </div>

                {/* Attendance */}
                <div className={`${cardClass} xl:col-span-2 flex flex-col justify-between hover:shadow-md transition-all`} style={{ animationDelay: '200ms' }}>
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">Attendance</h3>
                        <DotsRow />
                    </div>
                    <div className="grid grid-cols-2 gap-8 lg:gap-12 w-full mt-auto">
                        <div className="w-full">
                            <p className="text-xs font-bold text-gray-400 mb-3 tracking-tight">Last class : Sat, Jan 31</p>
                            <div className="flex gap-4 mb-2 items-center">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Present</span>
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">75%</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Absent</span>
                                    <span className="text-xs font-bold text-red-500">25%</span>
                                </div>
                            </div>
                            <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                                <div className="bg-emerald-500" style={{ width: '75%' }}></div>
                                <div className="bg-red-500" style={{ width: '25%' }}></div>
                            </div>
                        </div>
                        <div className="w-full">
                            <p className="text-xs font-bold text-gray-400 mb-3 tracking-tight">Today: Tue, Feb 3</p>
                            <div className="flex gap-4 mb-2 items-center">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Present</span>
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">--%</span>
                                </div>
                            </div>
                            <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                                <div className="bg-emerald-500" style={{ width: '0%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Documents */}
                <div className={`${cardClass} flex flex-col justify-between hover:shadow-md transition-all`} style={{ animationDelay: '300ms' }}>
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-bold flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <DotsGrid />
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400 mb-1 tracking-tight">Total Documents</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{totalMaterials ? totalMaterials.toLocaleString() : '32'}</p>
                    </div>
                </div>
            </div>

            {/* Bottom 2-Column Grid for Table and Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ============ CARD 3: Document Store (Table) ============ */}
                <div className={cardClass} style={{ animationDelay: '400ms' }}>
                    <div className={headerClass}>
                        <h3 className={titleClass}>Document Store</h3>
                        <div className="flex items-center gap-2">
                            <DotsGrid />
                            <DotsRow />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-100 dark:border-white/5">
                                    <th className="pb-3">Document</th>
                                    <th className="pb-3">Type</th>
                                    <th className="pb-3">Size</th>
                                    <th className="pb-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {documentRows.map((doc, idx) => (
                                    <tr key={idx} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                                        <td className="py-3.5 flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${
                                                ['bg-indigo-500', 'bg-pink-500', 'bg-amber-500', 'bg-purple-500', 'bg-teal-500'][idx % 5]
                                            }`}>
                                                {doc.name.charAt(0)}
                                            </div>
                                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate max-w-[160px]">{doc.name}</span>
                                        </td>
                                        <td className="py-3.5 text-sm text-gray-500 font-medium">{doc.type}</td>
                                        <td className="py-3.5 text-sm text-gray-500 font-medium">{doc.size}</td>
                                        <td className="py-3.5 text-right">
                                            <span className={`text-sm font-bold ${
                                                doc.status === 'Published' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                                            }`}>{doc.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ============ CARD 4: Attendance Trend (Bar + Line) ============ */}
                <div className={cardClass} style={{ animationDelay: '500ms' }}>
                    <div className={headerClass}>
                        <div className="flex items-center gap-4">
                            <h3 className={titleClass}>Attendance Trend</h3>
                            <select
                                value={reportRange}
                                onChange={(e) => setReportRange(e.target.value as any)}
                                className="text-xs text-gray-500 bg-gray-50 dark:bg-[#252542] border border-gray-100 dark:border-white/10 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold cursor-pointer transition-colors"
                            >
                                <option value="weekly">Weekly Report</option>
                                <option value="monthly">Monthly Report</option>
                                <option value="yearly">Yearly Report</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            {[
                                { color: '#c4b5fd', label: 'Present' },
                                { color: '#7c3aed', label: 'Absent' },
                                { color: '#000', label: 'Rate', dashed: true }
                            ].map((l, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    {l.dashed ? (
                                        <div className="w-4 border-t-2 border-dashed border-gray-800 dark:border-white" />
                                    ) : (
                                        <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: l.color }} />
                                    )}
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{l.label}</span>
                                </div>
                            ))}
                            <DotsRow />
                        </div>
                    </div>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={currentAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
                                    domain={[0, 10]}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }}
                                />
                                <Bar dataKey="present" fill="#c4b5fd" radius={[6, 6, 0, 0]} barSize={32} />
                                <Bar dataKey="absent" fill="#7c3aed" radius={[6, 6, 0, 0]} barSize={32} />
                                <Line
                                    type="monotone"
                                    dataKey="rate"
                                    stroke="#1e1e1e"
                                    strokeWidth={2}
                                    dot={{ r: 5, fill: '#fff', stroke: '#1e1e1e', strokeWidth: 2 }}
                                    activeDot={{ r: 7, fill: '#dcfce7', stroke: '#16a34a', strokeWidth: 2 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
