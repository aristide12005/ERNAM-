"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FileText, Download, Award, Calendar } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

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
    const { profile } = useAuth();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);

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
            .eq('participant_id', profile?.id)
            .order('issue_date', { ascending: false });

        if (data) {
            setCertificates(data as any);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (profile?.id) fetchCertificates();
    }, [profile?.id]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Certifications</h1>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-white/50 rounded-[32px] border border-gray-100" />
                    ))}
                </div>
            ) : certificates.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50" />
                    <div className="relative z-10">
                        <div className="h-20 w-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 mx-auto border border-gray-100 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                            <Award className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">No Certificates Yet</h3>
                        <p className="text-gray-500 max-w-xs mx-auto font-medium">Earn credentials by completing your assigned training modules.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {certificates.map((cert) => (
                        <motion.div
                            key={cert.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-gray-200 rounded-[32px] p-8 shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 transition-all relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none group-hover:scale-110 duration-700">
                                <Award className="h-40 w-40 text-blue-900" />
                            </div>
 
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-8">
                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-widest border border-blue-100/50">
                                        {cert.training_standard.code}
                                    </span>
                                    <span className={`
                                        px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border
                                        ${cert.status === 'valid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}
                                    `}>
                                        {cert.status}
                                    </span>
                                </div>
 
                                <div className="flex-1 space-y-2">
                                    <h3 className="text-2xl font-black text-gray-900 leading-[1.2] group-hover:text-blue-700 transition-colors tracking-tight line-clamp-2">
                                        {cert.training_standard.title}
                                    </h3>
                                    <p className="text-[10px] text-gray-400 font-black tracking-widest uppercase">
                                        REGISTRY ID: {cert.certificate_number}
                                    </p>
                                </div>
 
                                <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        <span>Issued On</span>
                                        <span className="text-gray-900">{format(new Date(cert.issue_date), 'MMM d, yyyy')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        <span>valid until</span>
                                        <span className="text-orange-600">{format(new Date(cert.expiry_date), 'MMM d, yyyy')}</span>
                                    </div>
                                </div>
 
                                <button className="mt-8 w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:-translate-y-0.5 shadow-xl shadow-black/5 active:scale-95">
                                    <Download className="h-4 w-4" /> Download e-Cert
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
