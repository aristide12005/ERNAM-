"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Search,
    Filter,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    ChevronDown,
    Building2,
    Calendar,
    Users
} from 'lucide-react';

export default function TrainingRequestsView() {
    const t = useTranslations('Admin.requests');
    // const supabase = createClient(); // Removed
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Review Modal State
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        setFetchError(null);
        const { data, error } = await supabase
            .from('training_requests')
            .select(`
                *,
                organization:organizations(name, type),
                standard:training_standards(title, code)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching requests:', error);
            setFetchError(error.message);
        } else {
            setRequests(data || []);
        }
        setLoading(false);
    };

    const handleApprove = async () => {
        if (!selectedRequest) return;
        if (!confirm(t('review.confirm_approve'))) return;

        setIsProcessing(true);
        const { error } = await supabase
            .from('training_requests')
            .update({ status: 'approved' })
            .eq('id', selectedRequest.id);

        if (error) {
            console.error('Error approving:', error);
            alert('Failed to approve request');
        } else {
            setIsReviewOpen(false);
            fetchRequests();
        }
        setIsProcessing(false);
    };

    const handleReject = async () => {
        if (!selectedRequest || !rejectReason) return;

        setIsProcessing(true);
        // Note: Ideally we would save the rejection reason in a configured column or audit log.
        // For now, we just update the status as per current schema.
        const { error } = await supabase
            .from('training_requests')
            .update({ status: 'rejected' }) // In a fuller implementation, we'd add rejection_reason column
            .eq('id', selectedRequest.id);

        if (error) {
            console.error('Error rejecting:', error);
            alert('Failed to reject request');
        } else {
            setIsReviewOpen(false);
            setRejectReason('');
            fetchRequests();
        }
        setIsProcessing(false);
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'approved':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wider"><CheckCircle className="h-3.5 w-3.5" /> {t('status.approved')}</span>;
            case 'rejected':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wider"><XCircle className="h-3.5 w-3.5" /> {t('status.rejected')}</span>;
            case 'pending':
            default:
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wider animate-pulse"><Clock className="h-3.5 w-3.5" /> {t('status.pending')}</span>;
        }
    };

    const filteredRequests = requests.filter(r => {
        if (filterStatus !== 'all' && r.status !== filterStatus) return false;
        return true;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('title')}</h1>
                    <p className="text-slate-500">{t('subtitle')}</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <select
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer hover:border-indigo-300 transition-colors"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending Only</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    {fetchError && (
                        <div className="p-4 bg-red-50 text-red-600 border-b border-red-100 flex items-center gap-2">
                            <XCircle className="h-5 w-5" />
                            <span className="font-bold">Error loading requests:</span> {fetchError}
                        </div>
                    )}
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">{t('table.org')}</th>
                                <th className="px-6 py-4">{t('table.standard')}</th>
                                <th className="px-6 py-4">{t('table.pax')}</th>
                                <th className="px-6 py-4">{t('table.dates')}</th>
                                <th className="px-6 py-4">{t('table.status')}</th>
                                <th className="px-6 py-4 text-right">{t('table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-48"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-8"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded w-20"></div></td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                ))
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p>No requests found matching your filters.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{req.organization?.name || 'Unknown Org'}</div>
                                            <div className="text-xs text-slate-400 font-mono uppercase">{req.organization?.type}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-700">{req.standard?.title || 'Unknown Standard'}</div>
                                            <div className="text-xs text-slate-500 font-mono">{req.standard?.code}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                                <Users className="h-3.5 w-3.5 text-slate-400" />
                                                {req.requested_participant_count}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded w-fit text-slate-600">
                                                    {req.preferred_start_date} <span className="text-slate-400">→</span> {req.preferred_end_date}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={req.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedRequest(req);
                                                    setIsReviewOpen(true);
                                                }}
                                                className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Modal */}
            <AnimatePresence>
                {isReviewOpen && selectedRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row h-[600px]"
                        >
                            {/* Left: Request Info */}
                            <div className="md:w-1/2 bg-slate-50 p-8 border-r border-slate-200 overflow-y-auto">
                                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-indigo-600" />
                                    {t('review.request_details')}
                                </h3>

                                <div className="space-y-6">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">Organization</label>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{selectedRequest.organization?.name}</div>
                                                <div className="text-xs text-slate-500 uppercase">{selectedRequest.organization?.type}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">Training Requested</label>
                                        <div className="font-bold text-slate-900 text-lg mb-1">{selectedRequest.standard?.title}</div>
                                        <div className="text-sm text-slate-500 font-mono mb-3">{selectedRequest.standard?.code}</div>

                                        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Users className="h-4 w-4" />
                                                <span className="font-bold">{selectedRequest.requested_participant_count}</span> Pax
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Calendar className="h-4 w-4" />
                                                <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                                                    {selectedRequest.preferred_start_date} → {selectedRequest.preferred_end_date}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedRequest.notes && (
                                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                            <label className="text-[10px] uppercase font-bold text-amber-700/60 tracking-wider mb-2 block">Organization Notes</label>
                                            <p className="text-sm text-amber-900 italic">"{selectedRequest.notes}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="md:w-1/2 p-8 flex flex-col">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Decision</h3>
                                        <p className="text-sm text-slate-500">Authorize or reject this training request.</p>
                                    </div>
                                    <button onClick={() => setIsReviewOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                        <XCircle className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="flex-1 flex flex-col justify-center gap-6">
                                    {selectedRequest.status === 'pending' ? (
                                        <>
                                            <div className="space-y-3">
                                                <button
                                                    onClick={handleApprove}
                                                    disabled={isProcessing}
                                                    className="w-full group relative flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <CheckCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                    {t('review.approve')}
                                                </button>
                                                <p className="text-xs text-center text-emerald-600/70 font-medium">
                                                    This will formally authorize the training and allow session scheduling.
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs font-bold text-slate-300 uppercase tracking-widest my-2">
                                                <div className="h-px bg-slate-100 flex-1"></div>
                                                OR
                                                <div className="h-px bg-slate-100 flex-1"></div>
                                            </div>

                                            <div className="space-y-3">
                                                <textarea
                                                    value={rejectReason}
                                                    onChange={e => setRejectReason(e.target.value)}
                                                    placeholder={t('review.reject_placeholder')}
                                                    className="w-full bg-red-50/50 border border-red-100 focus:border-red-300 rounded-xl p-3 text-sm focus:ring-4 focus:ring-red-100 outline-none resize-none h-24 placeholder:text-red-300"
                                                ></textarea>
                                                <button
                                                    onClick={handleReject}
                                                    disabled={!rejectReason || isProcessing}
                                                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 hover:bg-red-50 hover:border-red-100 text-slate-400 hover:text-red-500 font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <XCircle className="h-5 w-5" />
                                                    {t('review.reject')}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100">
                                            {selectedRequest.status === 'approved' && (
                                                <>
                                                    <div className="mx-auto h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                                                        <CheckCircle className="h-8 w-8" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-900 mb-1">Approved</h3>
                                                    <p className="text-sm text-slate-500">This request has been authorized.</p>
                                                </>
                                            )}
                                            {selectedRequest.status === 'rejected' && (
                                                <>
                                                    <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
                                                        <XCircle className="h-8 w-8" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-900 mb-1">Rejected</h3>
                                                    <p className="text-sm text-slate-500">This request was declined.</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
