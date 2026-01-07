"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

type Application = {
    id: string;
    application_type: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    review_notes?: string;
};

export default function OrgApplicationsView() {
    const { user } = useAuth();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) fetchApplications();
    }, [user?.id]);

    const fetchApplications = async () => {
        setLoading(true);
        // Find my org apps. Assuming applicant_user_id is the submitter (Org Admin)
        const { data } = await supabase
            .from('applications')
            .select('*')
            .eq('applicant_user_id', user?.id)
            .order('created_at', { ascending: false });

        if (data) setApplications(data as any);
        setLoading(false);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Application History</h1>

            {loading ? (
                <div className="space-y-4 animate-pulse">
                    {[1, 2].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
                </div>
            ) : applications.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No Applications</h3>
                    <p className="text-gray-500">You haven't submitted any applications recently.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {applications.map((app) => (
                        <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-gray-900 capitalize">{app.application_type} Application</h3>
                                <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase ${app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                        app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                    }`}>
                                    {app.status === 'approved' ? <CheckCircle className="h-3 w-3" /> :
                                        app.status === 'rejected' ? <XCircle className="h-3 w-3" /> :
                                            <Clock className="h-3 w-3" />}
                                    {app.status}
                                </span>
                            </div>
                            <div className="text-sm text-gray-500 mb-2">
                                Submitted on {new Date(app.created_at).toLocaleDateString()}
                            </div>
                            {app.review_notes && (
                                <div className="mt-4 bg-gray-50 p-3 rounded text-sm text-gray-600">
                                    <span className="font-bold block text-xs uppercase mb-1">Review Notes:</span>
                                    {app.review_notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
