"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/providers/AuthProvider';
import { Award, Download, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

type Certificate = {
    id: string;
    certificate_code: string;
    issue_date: string;
    expiry_date: string;
    recipient: { full_name: string };
    training_session: {
        standard: { title: string }
    };
    status: 'valid' | 'expiring' | 'expired';
};

export default function OrgCertificatesView() {
    const t = useTranslations('OrgAdmin.certificates');
    const { profile } = useAuth();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'valid' | 'expiring' | 'expired'>('all');

    useEffect(() => {
        if (profile?.organization_id) {
            fetchCertificates();
        }
    }, [profile?.organization_id]);

    const fetchCertificates = async () => {
        setLoading(true);
        // Fetch certs where recipient belongs to this org
        const { data: users } = await supabase
            .from('profiles')
            .select('id')
            .eq('organization_id', profile?.organization_id);

        if (!users || users.length === 0) {
            setCertificates([]);
            setLoading(false);
            return;
        }

        const userIds = users.map(u => u.id);

        const { data } = await supabase
            .from('certificates')
            .select(`
                id, certificate_code, issue_date, expiry_date,
                recipient:profiles!recipient_user_id(full_name),
                training_session:training_sessions!session_id(
                    standard:training_standards(title)
                )
            `)
            .in('recipient_user_id', userIds)
            .order('issue_date', { ascending: false });

        if (data) {
            // Calculate status dynamically
            const now = new Date();
            const threeMonthsFromNow = new Date();
            threeMonthsFromNow.setMonth(now.getMonth() + 3);

            const processed = data.map((cert: any) => {
                const expiry = new Date(cert.expiry_date);
                let status: 'valid' | 'expiring' | 'expired' = 'valid';

                if (expiry < now) status = 'expired';
                else if (expiry < threeMonthsFromNow) status = 'expiring';

                return { ...cert, status };
            });

            setCertificates(processed as any);
        }
        setLoading(false);
    };

    const filtered = certificates.filter(c => filter === 'all' || c.status === filter);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Award className="h-6 w-6 text-emerald-600" />
                        {t('title')}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">{t('subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
                    >
                        {t('filters.valid')} / {t('filters.expired')}
                    </button>
                    <button
                        onClick={() => setFilter('expiring')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${filter === 'expiring' ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-500 ring-offset-1' : 'bg-white text-amber-600 hover:bg-amber-50 border border-amber-200'}`}
                    >
                        {t('filters.expiring')}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <Award className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No Certificates Found</h3>
                    <p className="text-slate-500">Certificates issued to your staff will appear here.</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">{t('table.recipient')}</th>
                                <th className="px-6 py-4">{t('table.code')}</th>
                                <th className="px-6 py-4">{t('table.issue_date')}</th>
                                <th className="px-6 py-4 text-center">{t('table.expiry_date')}</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{c.recipient?.full_name}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{c.training_session?.standard?.title}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">
                                        {c.certificate_code}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {new Date(c.issue_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-bold text-slate-700">{new Date(c.expiry_date).toLocaleDateString()}</span>
                                            {c.status === 'expiring' && (
                                                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase mt-1">Expiring Soon</span>
                                            )}
                                            {c.status === 'expired' && (
                                                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase mt-1">Expired</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase flex items-center justify-end gap-1 ml-auto">
                                            <Download className="h-4 w-4" />
                                            {t('download_pdf')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
