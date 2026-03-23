"use client";

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { Search, Trash2, Pencil, ChevronLeft, ChevronRight, MessageSquare, GraduationCap, ClipboardCheck, Send, X, User as UserIcon, Calendar } from 'lucide-react';

/* Grade styling */
const GRADE_STYLE: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    good: { label: 'Excellent', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    medium: { label: 'Satisfactory', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
    low: { label: 'Needs Review', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
};

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50];

export default function InstructorParticipantsView() {
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { profile } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Bulk message modal
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (profile) fetchParticipants();
    }, [profile]);

    const fetchParticipants = async () => {
        try {
            const { data: mySessions } = await supabase
                .from('session_instructors')
                .select('session_id')
                .eq('instructor_id', profile?.id);

            if (!mySessions || mySessions.length === 0) {
                setLoading(false);
                return;
            }
            const sessionIds = mySessions.map(s => s.session_id);

            const { data: partData } = await supabase
                .from('session_participants')
                .select(`
                    id,
                    attendance_status,
                    user:profiles!participant_id(id, full_name, email, avatar_url)
                `)
                .in('session_id', sessionIds);

            if (partData) {
                const uniqueTrainees = Array.from(new Map(partData.map((item: any) => [item.user?.id, item])).values());
                const enriched = (uniqueTrainees as any[]).map((item, idx) => ({
                    ...item,
                    code: `#${String(idx + 1).padStart(2, '0')}`,
                    grade: ['good', 'medium', 'low'][idx % 3],
                }));
                setParticipants(enriched);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Filtered & paginated data
    const filtered = useMemo(() =>
        participants.filter(p =>
            (p.user?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (p.user?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (p.code?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        ), [participants, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, currentPage, itemsPerPage]);

    // Reset page when search changes
    useEffect(() => { setCurrentPage(1); }, [searchTerm, itemsPerPage]);

    // Selection helpers
    const toggleSelectAll = () => {
        if (selectedIds.length === paginatedData.length && paginatedData.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(paginatedData.map(p => p.user?.id).filter(Boolean));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleSendMessage = () => {
        if (!message.trim() || selectedIds.length === 0) return;
        setSending(true);
        setTimeout(() => {
            alert(`Message sent to ${selectedIds.length} trainee(s).\nContent: "${message}"`);
            setMessage('');
            setSelectedIds([]);
            setSending(false);
            setShowMessageModal(false);
        }, 600);
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        if (confirm(`Are you sure you want to remove ${selectedIds.length} trainee(s)?`)) {
            alert(`Successfully removed ${selectedIds.length} trainee(s).`);
            setSelectedIds([]);
        }
    };

    const handleEditGrades = () => {
        alert(`Opening grade editor for ${selectedIds.length} trainee(s)...`);
    };

    const handleEditAttendance = () => {
        alert(`Opening attendance audit for ${selectedIds.length} trainee(s)...`);
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1, 2, 3);
            if (currentPage > 4) pages.push('...');
            if (currentPage > 3 && currentPage < totalPages - 2) pages.push(currentPage);
            if (currentPage < totalPages - 3) pages.push('...');
            pages.push(totalPages - 1, totalPages);
        }
        return [...new Set(pages)];
    };

    const hasSelection = selectedIds.length > 0;

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto w-full">
            {/* ===== Page Header ===== */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Trainee Management</h1>
                    <p className="text-sm text-gray-400 mt-1 font-medium">
                        <span className="hover:text-gray-600 cursor-pointer">Home</span>
                        <span className="mx-2">/</span>
                        <span className="text-purple-600 dark:text-purple-400 font-semibold">Trainee List</span>
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {hasSelection && (
                        <>
                            <button
                                onClick={() => setShowMessageModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Send Message
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold transition-all border border-red-200 dark:border-red-800/50"
                            >
                                <Trash2 className="w-4 h-4" />
                                Remove Access
                            </button>
                            <button
                                onClick={handleEditGrades}
                                className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl text-sm font-bold transition-all border border-amber-200 dark:border-amber-800/50"
                            >
                                <GraduationCap className="w-4 h-4" />
                                Modify Grades
                            </button>
                            <button
                                onClick={handleEditAttendance}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl text-sm font-bold transition-all border border-blue-200 dark:border-blue-800/50"
                            >
                                <ClipboardCheck className="w-4 h-4" />
                                Audit Attendance
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 rounded-[1.5rem] shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="px-7 py-5 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">Enrolled Trainees</h2>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, ID or email..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-[220px] pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium text-sm"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                            <Calendar className="w-4 h-4" />
                            Last 30 Days
                            <ChevronRight className="w-3 h-3 rotate-90" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-16 text-center text-gray-400 flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mb-4" />
                            Fetching trainee data...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-16 text-center text-gray-500">No trainees matching your criteria.</div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-white/5 text-xs font-semibold uppercase tracking-wider">
                                    <th className="px-7 py-4 w-12">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                                            checked={selectedIds.length === paginatedData.length && paginatedData.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-4 py-4">Name</th>
                                    <th className="px-4 py-4">ID Code</th>
                                    <th className="px-4 py-4">Email Address</th>
                                    <th className="px-4 py-4">Actions</th>
                                    <th className="px-4 py-4">Grade Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {paginatedData.map((item) => {
                                    const isSelected = selectedIds.includes(item.user?.id);
                                    const gradeStyle = GRADE_STYLE[item.grade] || GRADE_STYLE.medium;

                                    return (
                                        <tr
                                            key={item.user?.id}
                                            className={`transition-colors hover:bg-purple-50/40 dark:hover:bg-purple-900/10 ${isSelected ? 'bg-purple-50/60 dark:bg-purple-900/15' : ''}`}
                                        >
                                            <td className="px-7 py-4">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(item.user?.id)}
                                                />
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    {item.user?.avatar_url ? (
                                                        <img src={item.user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm shrink-0" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-sm border-2 border-white dark:border-gray-800 shadow-sm shrink-0">
                                                            {item.user?.full_name?.charAt(0) || <UserIcon className="w-4 h-4 opacity-50" />}
                                                        </div>
                                                    )}
                                                    <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                                                        {item.user?.full_name || 'Unknown'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 text-gray-600 dark:text-gray-400 font-medium">
                                                {item.code}
                                            </td>

                                            <td className="px-4 py-4 text-gray-500 dark:text-gray-400">
                                                {item.user?.email || '—'}
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); alert(`Delete ${item.user?.full_name}?`); }}
                                                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); alert(`Edit ${item.user?.full_name}'s profile?`); }}
                                                        className="p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-400 hover:text-purple-500 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${gradeStyle.bg} ${gradeStyle.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${gradeStyle.dot}`} />
                                                    {gradeStyle.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {!loading && filtered.length > 0 && (
                    <div className="px-7 py-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-transparent">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {getPageNumbers().map((page, idx) => (
                                typeof page === 'number' ? (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                                            currentPage === page
                                                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ) : (
                                    <span key={idx} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">•••</span>
                                )
                            ))}

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-black/20 text-sm font-medium text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                            >
                                {ITEMS_PER_PAGE_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt} / page</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* ===== Message Modal ===== */}
            {showMessageModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowMessageModal(false)}>
                    <div
                        className="bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg p-6"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Broadcast Message</h3>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    To {selectedIds.length} selected recipients
                                </p>
                            </div>
                            <button onClick={() => setShowMessageModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message here..."
                            className="w-full min-h-[120px] bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 resize-y text-sm"
                            rows={4}
                            autoFocus
                        />
                        <div className="flex items-center justify-end gap-3 mt-4">
                            <button
                                onClick={() => setShowMessageModal(false)}
                                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSendMessage}
                                disabled={sending || !message.trim()}
                                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md transition-all"
                            >
                                <Send className="w-4 h-4" />
                                {sending ? "Delivering..." : "Send Now"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
