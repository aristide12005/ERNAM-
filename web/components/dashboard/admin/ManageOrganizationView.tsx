"use client";

import React, { useState, useEffect } from "react";
import {
    Building2, Users, Calendar, ShieldCheck,
    Settings, LogOut, ArrowLeft, MoreHorizontal,
    Search, Mail, Phone, MapPin
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// Placeholder for now - normally would accept orgId as prop
export default function ManageOrganizationView({ orgId, onBack }: { orgId: string, onBack: () => void }) {
    const [activeTab, setActiveTab] = useState<'overview' | 'admins' | 'staff' | 'sessions'>('overview');
    const [org, setOrg] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [admins, setAdmins] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);

    useEffect(() => {
        if (orgId) fetchOrgDetails();
    }, [orgId]);

    useEffect(() => {
        if (orgId && activeTab === 'admins') fetchAdmins();
    }, [orgId, activeTab]);

    useEffect(() => {
        if (orgId && activeTab === 'sessions') fetchSessions();
    }, [orgId, activeTab]);

    const fetchOrgDetails = async () => {
        setLoading(true);
        const { data } = await supabase.from('organizations').select('*').eq('id', orgId).single();
        if (data) setOrg(data);
        setLoading(false);
    };

    const fetchAdmins = async () => {
        const { data } = await supabase.from('users').select('*').eq('organization_id', orgId).eq('role', 'org_admin');
        if (data) setAdmins(data);
    };

    const fetchSessions = async () => {
        // Fetch sessions where this organization has participants
        const { data, error } = await supabase
            .from('sessions')
            .select('*, training_standards(title), session_participants!inner(organization_id)')
            .eq('session_participants.organization_id', orgId)
            .limit(20);

        if (error) {
            console.error("Error fetching org sessions:", error);
        } else if (data) {
            setSessions(data as any);
        }
    };

    const handleReactivate = async () => {
        if (!confirm("Are you sure you want to RE-ACTIVATE this organization?")) return;
        setLoading(true);
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

            await fetchOrgDetails(); // Refresh
            alert("Organization re-activated successfully!");
        } catch (err: any) {
            alert(`Re-activation Failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Loading Organization Command Center...</div>;
    if (!org) return <div className="p-10 text-center text-red-500">Organization not found.</div>;

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
            {/* 1. Header Command Bar */}
            <div className="h-16 border-b border-white/10 flex items-center px-6 justify-between bg-[#111]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600/20 p-2 rounded-lg text-blue-500">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-none">{org.name}</h1>
                            <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                                <span className={`w-2 h-2 rounded-full ${org.status === 'approved' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                                <span className="capitalize">{org.status} Entity</span>
                                <span className="text-gray-600">•</span>
                                <span className="uppercase tracking-wider">{org.type}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {org.status === 'rejected' && (
                        <button
                            onClick={handleReactivate}
                            className="px-4 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                        >
                            <ShieldCheck className="w-4 h-4" /> Re-Active
                        </button>
                    )}
                    <button className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-all flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Config
                    </button>
                </div>
            </div>

            {/* 2. Navigation Tabs */}
            <div className="border-b border-white/10 px-6 bg-[#111]">
                <div className="flex gap-6">
                    <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={ShieldCheck}>Overview</TabButton>
                    <TabButton active={activeTab === 'admins'} onClick={() => setActiveTab('admins')} icon={Users}>Admins</TabButton>
                    <TabButton active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} icon={Users}>Staff Registry</TabButton>
                    <TabButton active={activeTab === 'sessions'} onClick={() => setActiveTab('sessions')} icon={Calendar}>Training Sessions</TabButton>
                </div>
            </div>

            {/* 3. Main Content Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-black">
                {activeTab === 'overview' && (
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* KPIs */}
                        <div className="grid grid-cols-3 gap-4">
                            <KpiCard title="Total Staff" value="--" icon={Users} trend="+0%" />
                            <KpiCard title="Active Sessions" value="--" icon={Calendar} trend="Active" />
                            <KpiCard title="Compliance Score" value="100%" icon={ShieldCheck} intent="good" />
                        </div>

                        {/* Details */}
                        <div className="bg-[#111] rounded-xl border border-white/10 p-6">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-gray-500" /> Organization Profile
                            </h3>
                            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                <DetailItem label="Official Name" value={org.name} />
                                <DetailItem label="Entity Type" value={org.type} />
                                <DetailItem label="Country of Registration" value={org.country || 'N/A'} />
                                <DetailItem label="Approval Date" value={new Date(org.approved_at || Date.now()).toLocaleDateString()} />
                            </div>
                        </div>

                        <div className="bg-[#111] rounded-xl border border-white/10 p-6">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Mail className="w-5 h-5 text-gray-500" /> Contact Information
                            </h3>
                            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                <DetailItem label="Primary Email" value={org.contact_email || 'N/A'} />
                                <DetailItem label="Phone" value={org.contact_phone || 'N/A'} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'admins' && (
                    <div className="max-w-5xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Organization Administrators</h2>
                            {/* Invitation logic requires edge function usually */}
                            <button className="px-4 py-2 bg-blue-600/20 text-blue-500 text-sm font-medium rounded-lg cursor-not-allowed" title="Invite flow coming soon">
                                Invite New Admin
                            </button>
                        </div>

                        <div className="bg-[#111] rounded-xl border border-white/10 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-gray-400 uppercase text-xs font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {admins.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">No administrators found.</td>
                                        </tr>
                                    ) : (
                                        admins.map((admin) => (
                                            <tr key={admin.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
                                                        {admin.full_name?.charAt(0)}
                                                    </div>
                                                    {admin.full_name}
                                                </td>
                                                <td className="px-6 py-4 text-gray-400">{admin.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${admin.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                        }`}>
                                                        {admin.status || 'Active'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">{new Date(admin.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'sessions' && (
                    <div className="max-w-5xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Training Sessions</h2>
                            {/* Create button could invoke global create modal passed as prop */}
                        </div>

                        <div className="bg-[#111] rounded-xl border border-white/10 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-gray-400 uppercase text-xs font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Title</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Start Date</th>
                                        <th className="px-6 py-4">Location</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {sessions.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">No sessions found for this organization.</td>
                                        </tr>
                                    ) : (
                                        sessions.map((session) => (
                                            <tr key={session.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-medium text-white">
                                                    {session.training_standards?.title || "Untitled Session"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${session.status === 'completed' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                        session.status === 'planned' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                                                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                        }`}>
                                                        {session.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">{new Date(session.start_date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-gray-500">{session.location || 'N/A'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Placeholders for others */}
                {activeTab === 'staff' && (
                    <div className="max-w-5xl mx-auto bg-[#111] rounded-xl border border-white/10 p-12 text-center text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-700" />
                        <h3 className="text-xl font-bold text-gray-300 mb-2">Staff Registry</h3>
                        <p className="max-w-md mx-auto">This module will track all employees associated with {org.name}, including their specific training records and compliance status.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Helpers ---

function TabButton({ children, active, onClick, icon: Icon }: any) {
    return (
        <button
            onClick={onClick}
            className={`
                h-12 border-b-2 px-1 text-sm font-medium flex items-center gap-2 transition-colors
                ${active ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-white'}
            `}
        >
            {Icon && <Icon className="w-4 h-4" />}
            {children}
        </button>
    );
}

function KpiCard({ title, value, icon: Icon, trend, intent = 'neutral' }: any) {
    return (
        <div className="bg-[#111] border border-white/10 p-5 rounded-xl">
            <div className="flex justify-between items-start mb-2">
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">{title}</span>
                {Icon && <Icon className="w-4 h-4 text-gray-600" />}
            </div>
            <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{value}</span>
                {trend && <span className={`text-xs mb-1 ${intent === 'good' ? 'text-emerald-500' : 'text-gray-500'}`}>{trend}</span>}
            </div>
        </div>
    );
}

function DetailItem({ label, value }: any) {
    return (
        <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">{label}</label>
            <div className="text-base text-gray-200 font-medium">{value}</div>
        </div>
    );
}
