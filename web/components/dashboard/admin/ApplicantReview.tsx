"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    CheckCircle,
    XCircle,
    Calendar,
    Eye,
    Trash2,
    Loader2,
    FileText,
    Download
} from 'lucide-react';

interface Applicant {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    status: string;
    submitted_at: string;
    previous_result: string;
    applied_department: any; // Join with departments
}

export default function ApplicantReview() {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const fetchApplicants = async () => {
        setLoading(true);
        // Ensure to select department name if relation exists
        // Note: Supabase join syntax depends on foreign key setup
        const query = supabase
            .from('applicants')
            .select(`
                *,
                applied_department ( name )
            `)
            .order('submitted_at', { ascending: false });

        const { data, error } = await query;
        if (!error && data) {
            setApplicants(data as any);
        } else if (error) {
            console.error(error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchApplicants();
    }, []);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('applicants')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            fetchApplicants();
        } else {
            alert("Failed to update status: " + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this application?")) return;

        const { error } = await supabase
            .from('applicants')
            .delete()
            .eq('id', id);

        if (!error) fetchApplicants();
    };

    const filteredApplicants = applicants.filter(app => {
        const matchesSearch = app.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FileText className="h-6 w-6 text-blue-500" /> Admissions Review
                </h2>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none md:w-64">
                        <input
                            type="text"
                            placeholder="Search applicant..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                        />
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-[#1A1A1A] border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none text-white cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="enrolled">Enrolled</option>
                    </select>
                </div>
            </div>

            <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-white/5">
                                <th className="px-6 py-4">Applicant</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Applied Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <AnimatePresence>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
                                            <p className="text-gray-500 italic">Loading applications...</p>
                                        </td>
                                    </tr>
                                ) : filteredApplicants.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                                            No applications found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredApplicants.map((app) => (
                                        <motion.tr
                                            key={app.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="hover:bg-white/5 transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 font-bold">
                                                        {app.full_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-bold">{app.full_name}</div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                                            {app.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-300">
                                                {app.applied_department?.name || 'General'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tight border ${app.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                        app.status === 'enrolled' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                            app.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                                'bg-red-500/10 text-red-500 border-red-500/20'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(app.submitted_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {app.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(app.id, 'approved')}
                                                                className="p-2 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-colors border border-transparent hover:border-emerald-500/20"
                                                                title="Approve Application"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                                                className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                                                title="Reject Application"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {app.status === 'approved' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(app.id, 'enrolled')}
                                                            className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors border border-transparent hover:border-blue-500/20"
                                                            title="Mark as Enrolled"
                                                        >
                                                            <Users className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(app.id)}
                                                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                                        title="Delete Application"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
