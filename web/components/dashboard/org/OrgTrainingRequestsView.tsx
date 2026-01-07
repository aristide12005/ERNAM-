"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/providers/AuthProvider';
import { FileText, Plus, Clock, CheckCircle, XCircle, Calendar, Users } from 'lucide-react';

type TrainingRequest = {
    id: string;
    standard_id: string; // Relation to training_standards
    requested_dates: string;
    participants_count: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    notes?: string;
    // joined fields
    standard?: { title: string; code: string; };
};

export default function OrgTrainingRequestsView() {
    const t = useTranslations('OrgAdmin.requests');
    const { profile } = useAuth();
    const [requests, setRequests] = useState<TrainingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [newRequest, setNewRequest] = useState({
        standard_id: '',
        preferred_start_date: '',
        preferred_end_date: '',
        pax: 1,
        notes: ''
    });
    const [standards, setStandards] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (profile?.organization_id) {
            fetchRequests();
            fetchStandards();
        }
    }, [profile?.organization_id]);

    const fetchRequests = async () => {
        setLoading(true);
        // Assuming 'training_requests' table exists with organization_id
        const { data, error } = await supabase
            .from('training_requests')
            .select(`
                *,
                standard:training_standards(title, code)
            `)
            .eq('organization_id', profile?.organization_id)
            .order('created_at', { ascending: false });

        if (!error && data) setRequests(data as any);
        setLoading(false);
    };

    const fetchStandards = async () => {
        const { data } = await supabase.from('training_standards').select('id, title, code').eq('active', true);
        if (data) setStandards(data);
    };

    const handleSubmit = async () => {
        if (!newRequest.standard_id || !newRequest.preferred_start_date || !newRequest.preferred_end_date) return;
        setIsSubmitting(true);



        // Real insertion
        const { error } = await supabase.from('training_requests').insert({
            organization_id: profile?.organization_id,
            training_standard_id: newRequest.standard_id,
            // Core fields
            preferred_start_date: newRequest.preferred_start_date,
            preferred_end_date: newRequest.preferred_end_date,
            requested_participant_count: newRequest.pax,
            notes: newRequest.notes,
            status: 'pending',
            requested_by: profile?.id
        });

        setIsSubmitting(false);

        if (error) {
            alert("Failed to submit request: " + error.message);
        } else {
            alert(t('success'));
            setIsModalOpen(false);
            setNewRequest({ standard_id: '', preferred_start_date: '', preferred_end_date: '', pax: 1, notes: '' }); // Reset form
            fetchRequests();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-indigo-600" />
                        {t('title')}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">{t('subtitle')}</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all"
                >
                    <Plus className="h-4 w-4" />
                    {t('request_training')}
                </button>
            </div>

            {loading ? (
                <div className="space-y-4 animate-pulse">
                    {[1, 2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">{t('title')}</h3>
                    <p className="text-slate-500">No requests found. Start by requesting a training slot.</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">{t('table.standard')}</th>
                                <th className="px-6 py-4">{t('table.period')}</th>
                                <th className="px-6 py-4">{t('table.participants')}</th>
                                <th className="px-6 py-4">{t('table.status')}</th>
                                <th className="px-6 py-4 text-right">{t('table.created_at')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {requests.map((r) => (
                                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{r.standard?.title || 'Unknown Standard'}</div>
                                        <div className="text-xs text-slate-500 font-mono">{r.standard?.code}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">
                                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                                            {r.preferred_start_date} <span className="text-slate-400">→</span> {r.preferred_end_date}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-slate-400" />
                                            <span className="font-bold text-slate-900">{r.requested_participant_count}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${r.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            r.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                                'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {r.status === 'approved' ? <CheckCircle className="h-3 w-3" /> :
                                                r.status === 'rejected' ? <XCircle className="h-3 w-3" /> :
                                                    <Clock className="h-3 w-3" />}
                                            {t(`status.${r.status}`)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-slate-500">
                                        {new Date(r.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Request Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">{t('modal.title')}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    {t('modal.select_standard')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    value={newRequest.standard_id}
                                    onChange={e => setNewRequest({ ...newRequest, standard_id: e.target.value })}
                                >
                                    <option value="">-- Select Standard --</option>
                                    {standards.map(s => (
                                        <option key={s.id} value={s.id}>{s.code} — {s.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                        {t('modal.start_date')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={newRequest.preferred_start_date}
                                        onChange={e => setNewRequest({ ...newRequest, preferred_start_date: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                        {t('modal.end_date')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={newRequest.preferred_end_date}
                                        onChange={e => setNewRequest({ ...newRequest, preferred_end_date: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    {t('modal.pax_count')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newRequest.pax}
                                    onChange={e => setNewRequest({ ...newRequest, pax: parseInt(e.target.value) })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">{t('modal.pax_helper')}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('modal.notes')}</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                                    value={newRequest.notes}
                                    placeholder="Operational constraints, urgency..."
                                    onChange={e => setNewRequest({ ...newRequest, notes: e.target.value })}
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-4 py-2 rounded-lg font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                {t('modal.cancel')}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!newRequest.standard_id || !newRequest.preferred_start_date || !newRequest.preferred_end_date || isSubmitting}
                                className="flex-1 px-4 py-2 rounded-lg font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting && <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {t('modal.submit')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
