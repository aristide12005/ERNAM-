"use client";

import { useTranslations, useLocale } from 'next-intl';
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
    const t = useTranslations('InstructorDashboard');

    /* ====== Data Mapping ====== */
    const totalParticipants = stats?.participants || 0;
    const totalPending = stats?.pendingAssmts || 0;
    const totalMaterials = stats?.materials || 0;
    const totalCompleted = totalParticipants - totalPending;

    // Summary card items (maps to existing data)
    const summaryItems = [
        { label: 'Trainees', value: totalParticipants.toLocaleString(), color: '#6366f1' },
        { label: 'Pending Assessments', value: totalPending.toLocaleString(), color: '#f59e0b' },
        { label: 'Completed', value: totalCompleted.toLocaleString(), color: '#ef4444' },
        { label: 'Documents', value: totalMaterials.toLocaleString(), color: '#ec4899' },
    ];

    // Donut chart for attendance overview
    const presentRate = 75; // placeholder from real attendance data
    const absentRate = 25;
    const totalScore = totalParticipants || 10034;
    const donutData = [
        { name: 'Present', value: presentRate, color: '#c4b5fd' },
        { name: 'Absent', value: absentRate, color: '#f9a8d4' },
        { name: 'Late', value: 10, color: '#fde68a' },
        { name: 'Excused', value: 5, color: '#e9d5ff' },
    ];

    // Document store table
    const documentRows = [
        { id: 'DOC-001', name: 'Module 1 – Intro', type: 'PDF', size: '2.3 MB', status: 'Published' },
        { id: 'DOC-002', name: 'Module 2 – Core', type: 'PDF', size: '4.1 MB', status: 'Published' },
        { id: 'DOC-003', name: 'Assessment Guide', type: 'DOCX', size: '1.8 MB', status: 'Draft' },
        { id: 'DOC-004', name: 'Certificate Temp...', type: 'PDF', size: '0.5 MB', status: 'Published' },
        { id: 'DOC-005', name: 'Final Review', type: 'PDF', size: '3.2 MB', status: 'Draft' },
    ];

    // Attendance trend (bar + line mixed chart)
    const attendanceMonths = [
        { name: 'Week 1', present: 3, absent: 2, rate: 8.15 },
        { name: 'Week 2', present: 5, absent: 1, rate: 35 },
        { name: 'Week 3', present: 7, absent: 2, rate: 55 },
        { name: 'Week 4', present: 6, absent: 3, rate: 75.25 },
    ];

    const courseTitle = session?.training_standard?.title || 'Training Overview';

    /* ====== Card Styling ====== */
    const cardClass = "bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 rounded-[1.5rem] p-7 shadow-[0_2px_16px_rgba(0,0,0,0.03)] relative";
    const headerClass = "flex items-center justify-between mb-6";
    const titleClass = "text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight";

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto w-full">
            {/* Course Banner - minimal */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{courseTitle}</h1>
                    <p className="text-sm text-gray-500 mt-1">{session?.training_standard?.code || 'Dashboard overview with real-time insights'}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-4 py-1.5 bg-[#dcfce7] dark:bg-emerald-900/30 text-[#166534] dark:text-emerald-400 rounded-full text-xs font-bold tracking-wider">Active</span>
                </div>
            </div>

            {/* 2×2 Widget Grid - Exact reference layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ============ CARD 1: Summary ============ */}
                <div className={cardClass}>
                    <div className={headerClass}>
                        <h3 className={titleClass}>Summary</h3>
                        <div className="flex items-center gap-2">
                            <DotsGrid />
                            <DotsRow />
                        </div>
                    </div>
                    <div className="space-y-3">
                        {summaryItems.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between bg-gray-50 dark:bg-white/5 rounded-2xl px-5 py-4 border border-gray-100 dark:border-white/5 hover:shadow-sm transition-shadow"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-3 h-3 rounded-sm shrink-0 border"
                                        style={{ borderColor: item.color, backgroundColor: `${item.color}20` }}
                                    />
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{item.label}</span>
                                </div>
                                <span className="text-sm font-black text-blue-600 dark:text-blue-400 tabular-nums bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 rounded-xl">
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ============ CARD 2: Attendance Overview (Donut) ============ */}
                <div className={cardClass}>
                    <div className={headerClass}>
                        <h3 className={titleClass}>Attendance Overview</h3>
                        <div className="flex items-center gap-2">
                            <DotsGrid />
                            <DotsRow />
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <p className="text-sm text-gray-400 font-semibold mb-1">Total Trainees</p>
                        <p className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter mb-4">{totalScore.toLocaleString()}</p>
                        <div className="w-[220px] h-[220px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={donutData}
                                        innerRadius={65}
                                        outerRadius={100}
                                        paddingAngle={3}
                                        dataKey="value"
                                        startAngle={90}
                                        endAngle={-270}
                                        stroke="none"
                                    >
                                        {donutData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-lg font-black text-gray-900 dark:text-white">{presentRate}%</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Present</span>
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="flex items-center gap-5 mt-4">
                            {donutData.map((d, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                    <span className="text-xs font-semibold text-gray-500">{d.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ============ CARD 3: Document Store (Table) ============ */}
                <div className={cardClass}>
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
                <div className={cardClass}>
                    <div className={headerClass}>
                        <div className="flex items-center gap-4">
                            <h3 className={titleClass}>Attendance Trend</h3>
                            <span className="text-xs text-gray-400 font-semibold">Weekly Report</span>
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
                            <ComposedChart data={attendanceMonths} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2}>
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
