"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import {
    Award,
    Download,
    ExternalLink,
    ShieldCheck,
    Trophy,
    Search,
    FileText,
    Star
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Certifications() {
    const { user } = useAuth();
    const [certs, setCerts] = useState<any[]>([]);

    useEffect(() => {
        // Mocking certifications for now
        setCerts([
            { id: 1, title: 'Private Pilot License (Theory)', date: '2023-11-15', issuer: 'ERNAM Aviation Authority', level: 'Level 1', serial: 'ERNAM-2023-449', status: 'verified' },
            { id: 2, title: 'Meteorology Advanced Cert', date: '2024-01-20', issuer: 'WMO Regional Office', level: 'Level 2', serial: 'WMO-SN-8820', status: 'verified' },
        ]);
    }, []);

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Award className="h-6 w-6 text-amber-500" /> Digital Credentials
                    </h2>
                    <p className="text-sm text-slate-500">View and download your verified training certificates.</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <div className="px-4 py-2 text-xs font-black text-blue-600 uppercase tracking-widest bg-white rounded-lg shadow-sm">
                        Verified Gallery
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Featured Certificate Card */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-900/40 border border-white/5">
                    <div className="relative z-10 flex flex-col h-full justify-between gap-12">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                <ShieldCheck className="h-8 w-8 text-blue-400" />
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Official Credential</div>
                                <div className="text-xl font-bold italic tracking-tighter uppercase underline decoration-blue-500 underline-offset-4">ERNAM Digital Twin</div>
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-blue-300 font-bold mb-2 uppercase tracking-widest">Distinction Award</div>
                            <h3 className="text-2xl font-bold mb-4">Aeronautical Meteorology Specialist</h3>
                            <div className="flex items-center gap-6 text-[10px] text-white/60 font-medium uppercase tracking-widest">
                                <span>Issued: Mar 2024</span>
                                <span>Ref: ERN-MET-4929</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                                <Download className="h-4 w-4" /> DOWNLOAD PDF
                            </button>
                            <button className="px-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 flex items-center justify-center">
                                <ExternalLink className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <Award className="absolute -right-16 -top-16 h-80 w-80 text-white/5 -rotate-12" />
                </div>

                {/* Achievement Gallery */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Recent Accomplishments</h3>
                    <div className="space-y-3">
                        {certs.map((c) => (
                            <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-400 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20">
                                        <Trophy className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{c.title}</h4>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Issue Date: {c.date}</div>
                                    </div>
                                </div>
                                <button className="p-2 text-slate-400 group-hover:text-blue-600 transition-colors">
                                    <Download className="h-5 w-5" />
                                </button>
                            </div>
                        ))}

                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center">
                            <Star className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">3 modules to next certificate</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Verification Registry Search */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 italic">Certificate Verification Registry</h4>
                        <p className="text-xs text-slate-500">Public verification for employers and aviation authorities.</p>
                    </div>
                </div>
                <div className="relative w-full md:w-80">
                    <input
                        type="text"
                        placeholder="Enter Serial Number..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                </div>
            </div>
        </div>
    );
}
