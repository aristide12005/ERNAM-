"use client";

import { useTranslations } from 'next-intl';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Search, Building2, MapPin, Calendar, ShieldCheck, MoreHorizontal, Loader2 } from 'lucide-react';

type Organization = {
    id: string;
    name: string;
    type: string;
    country: string;
    status: 'approved' | 'suspended' | 'pending';
    approved_at: string;
    contact_email?: string;
};

export default function OrganizationsView() {
    const t = useTranslations('OrganizationsView');
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            if (data) setOrganizations(data as any);
        } catch (error: any) {
            console.error("Error fetching organizations:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.country?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // State for selected organization to manage
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

    // If an organization is selected, show the Command Center
    if (selectedOrgId) {
        // Dynamic import to avoid circular dependencies if any, though likely fine here.
        // But better to simply return the component.
        const ManageOrganizationView = require('./ManageOrganizationView').default;
        return <ManageOrganizationView orgId={selectedOrgId} onBack={() => setSelectedOrgId(null)} />;
    }


    const handleApprove = async (orgId: string) => {
        if (!confirm("Are you sure you want to approve this organization and its admin?")) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('/api/admin/approve-organization', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    org_id: orgId,
                    adminId: session?.user?.id
                })
            });

            const resData = await response.json();
            if (!response.ok) throw new Error(resData.error);

            // Refresh list
            fetchOrganizations();
            alert("Organization approved successfully!");
        } catch (err: any) {
            alert(`Approval Failed: ${err.message}`);
        }
    };

    const handleDecline = async (orgId: string) => {
        if (!confirm("Are you sure you want to DECLINE this organization? This will suspend the account.")) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('/api/admin/decline-organization', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    org_id: orgId,
                    adminId: session?.user?.id
                })
            });

            const resData = await response.json();
            if (!response.ok) throw new Error(resData.error);

            fetchOrganizations();
            alert("Organization declined.");
        } catch (err: any) {
            alert(`Decline Failed: ${err.message}`);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Building2 className="text-blue-500" />
                        {t('title')}
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-40 bg-white/5 rounded-xl border border-white/5" />
                    ))}
                </div>
            ) : filteredOrgs.length === 0 ? (
                <div className="text-center py-20 bg-[#141414] rounded-xl border border-white/5">
                    <ShieldCheck className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-300">{t('no_orgs_title')}</h3>
                    <p className="text-gray-500">
                        {searchTerm ? t('no_orgs_desc_search') : t('no_orgs_desc_empty')}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOrgs.map((org) => (
                        <div key={org.id} className="group bg-[#141414] border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.02] rounded-xl p-5 transition-all duration-200 shadow-sm hover:shadow-lg relative overflow-hidden">

                            {/* Accent Line */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                                    <Building2 className="h-6 w-6" />
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${org.status === 'approved'
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                    }`}>
                                    {org.status.toUpperCase()}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-1 truncate pr-2" title={org.name}>
                                {org.name}
                            </h3>
                            <div className="text-sm text-gray-500 capitalize mb-4">
                                {org.type} {t('org_suffix')}
                            </div>

                            <div className="space-y-2 text-sm text-gray-400 border-t border-white/5 pt-4">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-600" />
                                    <span>{org.country || 'International'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-600" />
                                    <span>{t('since', { date: new Date(org.approved_at || Date.now()).toLocaleDateString() })}</span>
                                </div>
                            </div>

                            <div className="mt-5 flex gap-2">
                                {org.status === 'pending' ? (
                                    <div className="flex w-full gap-2">
                                        <button
                                            onClick={() => handleApprove(org.id)}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-emerald-900/20"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleDecline(org.id)}
                                            className="px-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 py-2 rounded-lg text-sm font-bold transition-colors"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setSelectedOrgId(org.id)}
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm font-medium transition-colors border border-white/5"
                                    >
                                        {t('manage')}
                                    </button>
                                )}
                                <button className="p-2 bg-transparent text-gray-500 hover:text-white transition-colors">
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
