"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PieChart, ShieldCheck, AlertCircle } from 'lucide-react';

export default function OrgValidityView() {
    const t = useTranslations('OrgAdmin.certificates'); // Reusing certs translations for now

    // Placeholder for visual analytics
    // In a real implementation this would fetch stats and render charts using Recharts or similar

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-purple-600" />
                Validity Tracking
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                    <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Compliance Rate</h3>
                    <p className="text-4xl font-black text-emerald-600 mt-2">98%</p>
                    <p className="text-xs text-emerald-700 mt-1">Excellent standing</p>
                </div>
                <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                    <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider">At Risk</h3>
                    <p className="text-4xl font-black text-amber-600 mt-2">3</p>
                    <p className="text-xs text-amber-700 mt-1">Certificates expiring in 90 days</p>
                </div>
                <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                    <h3 className="text-sm font-bold text-red-800 uppercase tracking-wider">Non-Compliant</h3>
                    <p className="text-4xl font-black text-red-600 mt-2">1</p>
                    <p className="text-xs text-red-700 mt-1">Action required immediately</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <PieChart className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900">Compliance Analytics</h3>
                <p className="text-slate-500 mb-6">Detailed visual breakdown of certification validity across departments.</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold">
                    <AlertCircle className="h-4 w-4" />
                    Feature coming in next update
                </div>
            </div>
        </div>
    );
}
