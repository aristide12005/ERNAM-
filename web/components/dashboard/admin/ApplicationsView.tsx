"use client";

import { useTranslations } from 'next-intl';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle, XCircle, Search, Building2, User } from 'lucide-react';

type Application = {
    id: string;
    application_type: 'organization';
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    organization_name: string;
    // Strict Columns
    applicant_name: string;
    applicant_email: string;
    applicant_phone: string;
    organization_country: string;
    details: {
        message: string;
        org_type?: string;
    };
};

export default function ApplicationsView() {
    const t = useTranslations('ApplicationsView');
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .eq('application_type', 'organization') // Strict: Only organization requests
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Fetch Error:", error.message);
        }

        if (data) setApplications(data as any);
        setLoading(false);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6">{t('title')}</h1>

            {loading ? (
                <div className="space-y-4 animate-pulse">
                    {[1, 2].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl border border-white/5" />)}
                </div>
            ) : applications.length === 0 ? (
                <div className="text-center py-20 bg-[#141414] rounded-xl border border-white/5">
                    <Search className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-300">{t('no_apps_title')}</h3>
                    <p className="text-gray-500">{t('no_apps_desc')}</p>
                </div>
            ) : (
                <div className="rounded-xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-gray-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">{t('headers.org_name')}</th>
                                <th className="px-6 py-4">{t('headers.applicant')}</th>
                                <th className="px-6 py-4">{t('headers.country')}</th>
                                <th className="px-6 py-4">{t('headers.status')}</th>
                                <th className="px-6 py-4 text-right">{t('headers.action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-[#141414]">
                            {applications.map((app) => (
                                <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                                        <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg">
                                            <Building2 className="h-4 w-4" />
                                        </div>
                                        {app.organization_name}
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">
                                        <div className="flex flex-col">
                                            <span className="text-white">{app.applicant_name}</span>
                                            <span className="text-xs text-gray-500">{app.applicant_email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">
                                        {app.organization_country || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                            {t('status.pending_review')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelectedApp(app)}
                                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                                        >
                                            {t('review')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
            }

            {/* Review Dialog */}
            {
                selectedApp && (
                    <ReviewApplicationDialog
                        application={selectedApp}
                        onClose={() => setSelectedApp(null)}
                        onSuccess={() => {
                            setSelectedApp(null);
                            fetchApplications();
                        }}
                    />
                )
            }
        </div >
    );
}
