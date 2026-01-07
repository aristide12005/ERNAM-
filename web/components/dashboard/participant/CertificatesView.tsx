"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FileText, Download, Award, Calendar } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion } from 'framer-motion';

type Certificate = {
    id: string;
    certificate_number: string;
    issue_date: string;
    expiry_date: string;
    status: 'valid' | 'expired' | 'revoked';
    training_standard: {
        code: string;
        title: string;
    };
    session: {
        end_date: string;
    };
};

export default function CertificatesView() {
    const { user } = useAuth();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) fetchCertificates();
    }, [user?.id]);

    const fetchCertificates = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('certificates')
            .select(`
                id,
                certificate_number,
                issue_date,
                expiry_date,
                status,
                training_standard:training_standards(code, title),
                session:sessions(end_date)
            `)
            .eq('participant_id', user?.id)
            .order('issue_date', { ascending: false });

        if (data) {
            setCertificates(data as any);
        }
        setLoading(false);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Certifications</h1>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                    {[1, 2].map(i => (
                        <div key={i} className="h-40 bg-gray-200 rounded-xl" />
                    ))}
                </div>
            ) : participants.length === 0 && certificates.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                    <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No Certificates Yet</h3>
                    <p className="text-gray-500">Complete a training session to earn your first certificate.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {certificates.map((cert) => (
                        <motion.div
                            key={cert.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border boundary-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <Award className="h-32 w-32" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs font-bold text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded">
                                        {cert.training_standard.code}
                                    </span>
                                    <span className={`
                                        px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                        ${cert.status === 'valid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
                                    `}>
                                        {cert.status}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                                    {cert.training_standard.title}
                                </h3>
                                <p className="text-sm text-gray-500 font-mono mb-6">
                                    #{cert.certificate_number}
                                </p>

                                <div className="space-y-2 text-sm text-gray-600 mb-6">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Issued</span>
                                        <span className="font-medium">{new Date(cert.issue_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Expires</span>
                                        <span className="font-medium text-orange-600">{new Date(cert.expiry_date).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <button className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-2.5 rounded-lg font-medium transition-colors">
                                    <Download className="h-4 w-4" /> Download PDF
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Helper to fix typescript error in "participants.length" above (copy paste error)
const participants: any[] = []; 
