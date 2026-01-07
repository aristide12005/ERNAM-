"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Award, AlertTriangle, CheckCircle, Clock, FileText, Download } from 'lucide-react';

// Mock data type until backend is ready
type Certificate = {
    id: string;
    recipient_name: string;
    course_name: string;
    issue_date: string;
    expiry_date: string;
    status: 'valid' | 'expiring' | 'expired';
    reference_id: string;
};

export default function CertificatesView() {
    const t = useTranslations('CertificatesView');
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<'all' | 'valid' | 'expiring' | 'expired'>('all');

    // Mock data generation
    const mockCertificates: Certificate[] = [
        { id: '1', recipient_name: 'Jean Dupont', course_name: 'Safety Management', issue_date: '2023-01-15', expiry_date: '2026-01-15', status: 'valid', reference_id: 'CERT-001' },
        { id: '2', recipient_name: 'Marie Curie', course_name: 'Advanced Aerodynamics', issue_date: '2021-05-20', expiry_date: '2024-05-20', status: 'expiring', reference_id: 'CERT-002' },
        { id: '3', recipient_name: 'Albert Einstein', course_name: 'Physics 101', issue_date: '2019-11-10', expiry_date: '2022-11-10', status: 'expired', reference_id: 'CERT-003' },
    ];

    const filtered = mockCertificates.filter(c =>
        (filter === 'all' || c.status === filter) &&
        (c.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.course_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Award className="text-orange-500" />
                        {t('title')}
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filter === 'all' ? 'bg-white text-black border-white' : 'text-gray-400 border-white/10 hover:border-white/30'}`}
                    >
                        {t('filters.all')}
                    </button>
                    <button
                        onClick={() => setFilter('expiring')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filter === 'expiring' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500' : 'text-gray-400 border-white/10 hover:border-yellow-500/30'}`}
                    >
                        {t('filters.expiring')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#141414] border border-white/5 p-6 rounded-xl flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">1,245</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">{t('stats.active')}</div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-white/5 p-6 rounded-xl flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">38</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">{t('stats.expiring_soon')}</div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-white/5 p-6 rounded-xl flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">12</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">{t('stats.expired')}</div>
                    </div>
                </div>
            </div>

            <div className="bg-[#141414] border border-white/5 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/20 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500 outline-none"
                        />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">{t('headers.recipient')}</th>
                            <th className="px-6 py-4">{t('headers.course')}</th>
                            <th className="px-6 py-4">{t('headers.issued')}</th>
                            <th className="px-6 py-4">{t('headers.validity')}</th>
                            <th className="px-6 py-4 text-right">{t('headers.action')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.map((c) => (
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
                                        <span className={`text-xs font-medium ${c.status === 'valid' ? 'text-emerald-500' :
                                                c.status === 'expiring' ? 'text-yellow-500' : 'text-red-500'
                                            }`}>
                                            {c.expiry_date}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-gray-400 hover:text-white transition-colors" title={t('download')}>
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
