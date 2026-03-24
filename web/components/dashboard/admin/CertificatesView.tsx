"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Search, Award, AlertTriangle, CheckCircle, Clock, FileText, Download, Loader2 } from 'lucide-react';

// Mock data type until backend is ready
type Certificate = {
    id: string;
    recipient_name: string;
    course_name: string;
    issue_date: string;
    expiry_date: string;
    status: 'valid' | 'expiring' | 'expired' | 'revoked';
    reference_id: string;
};

export default function CertificatesView() {
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<'all' | 'valid' | 'expiring' | 'expired'>('all');

    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCertificates = async () => {
            const { data, error } = await supabase.from('certificates').select(`
                id,
                certificate_number,
                issue_date,
                expiry_date,
                status,
                participant:users!participant_id(full_name),
                standard:training_standards(title)
            `);

            if (data && !error) {
                const mapped = data.map((c: any) => ({
                    id: c.id,
                    recipient_name: c.participant?.full_name || 'Unknown',
                    course_name: c.standard?.title || 'Unknown',
                    issue_date: c.issue_date || '-',
                    expiry_date: c.expiry_date || '-',
                    status: c.status,
                    reference_id: c.certificate_number
                }));
                setCertificates(mapped);
            }
            setLoading(false);
        };
        fetchCertificates();
    }, []);

    const filtered = certificates.filter(c =>
        (filter === 'all' || c.status === filter) &&
        (c.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.course_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const activeCount = certificates.filter(c => c.status === 'valid').length;
    const expiringCount = certificates.filter(c => c.status === 'expiring').length;
    const expiredCount = certificates.filter(c => c.status === 'expired' || c.status === 'revoked').length;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Award className="text-orange-500" />
                        Certificate Management
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Monitor and verify professional certifications
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filter === 'all' ? 'bg-white text-black border-white' : 'text-gray-400 border-white/10 hover:border-white/30'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('expiring')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filter === 'expiring' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500' : 'text-gray-400 border-white/10 hover:border-yellow-500/30'}`}
                    >
                        Expiring
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#141414] border border-white/5 p-6 rounded-xl flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{activeCount}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Active</div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-white/5 p-6 rounded-xl flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{expiringCount}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Expiring Soon</div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-white/5 p-6 rounded-xl flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{expiredCount}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Expired</div>
                    </div>
                </div>
            </div>

            <div className="bg-[#141414] border border-white/5 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search by recipient or course..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/20 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500 outline-none"
                        />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Recipient</th>
                            <th className="px-6 py-4">Course</th>
                            <th className="px-6 py-4">Issued</th>
                            <th className="px-6 py-4">Validity</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="py-20 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto mb-4" />
                                    <div className="text-gray-400 text-sm">Loading security registry...</div>
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-20 text-center">
                                    <FileText className="h-10 w-10 text-gray-700 mx-auto mb-3" />
                                    <div className="text-gray-400 text-sm">No registered certificates found</div>
                                </td>
                            </tr>
                        ) : filtered.map((c) => (
                            <tr key={c.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-white text-sm">{c.recipient_name}</div>
                                    <div className="text-xs text-gray-500">{c.reference_id}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-300">{c.course_name}</td>
                                <td className="px-6 py-4 text-sm text-gray-400">{c.issue_date}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${c.status === 'valid' ? 'bg-emerald-500' :
                                                c.status === 'expiring' ? 'bg-yellow-500' : 'bg-red-500'
                                            }`} />
                                        <span className={`text-xs font-medium uppercase tracking-wider ${c.status === 'valid' ? 'text-emerald-500' :
                                                c.status === 'expiring' ? 'text-yellow-500' : 'text-red-500'
                                            }`}>
                                            {c.expiry_date}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-gray-400 hover:text-white transition-colors" title="Download">
                                        <Download className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
