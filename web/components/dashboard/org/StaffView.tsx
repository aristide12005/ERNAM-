"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Search, Mail, Phone, MoreVertical } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion } from 'framer-motion';

type StaffMember = {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    status: string;
    role: string;
};

export default function StaffView() {
    const { user } = useAuth();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [orgId, setOrgId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    // New Staff Form
    const [newStaff, setNewStaff] = useState({ full_name: '', email: '', phone: '' });

    useEffect(() => {
        if (user?.id) fetchOrgAndStaff();
    }, [user?.id]);

    const fetchOrgAndStaff = async () => {
        setLoading(true);
        // 1. Find my organization
        const { data: orgAdmin } = await supabase
            .from('organization_admins')
            .select('organization_id')
            .eq('user_id', user?.id)
            .single();

        if (orgAdmin) {
            setOrgId(orgAdmin.organization_id);

            // 2. Fetch staff in this org
            const { data: staffData } = await supabase
                .from('users')
                .select('*')
                .eq('organization_id', orgAdmin.organization_id)
                .order('created_at', { ascending: false });

            if (staffData) setStaff(staffData as any);
        }
        setLoading(false);
    };

    const handleAddStaff = async () => {
        if (!orgId) return;

        // Simple insert for now. In real app might be invite flow.
        const { error } = await supabase
            .from('users')
            .insert([{
                ...newStaff,
                role: 'participant',
                organization_id: orgId,
                status: 'approved' // Auto-approve own staff
            }]);

        if (error) {
            alert("Error adding staff: " + error.message);
        } else {
            setShowAddModal(false);
            setNewStaff({ full_name: '', email: '', phone: '' });
            fetchOrgAndStaff();
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Staff</h1>
                    <p className="text-gray-500">Manage employees registered under your organization.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Plus className="h-4 w-4" /> Add Staff Member
                </button>
            </div>

            {loading ? (
                <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
                </div>
            ) : staff.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                    <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No Staff Found</h3>
                    <p className="text-gray-500">Use the "Add Staff Member" button to register your team.</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase">Name</th>
                                <th className="px-6 py-4 font-bold uppercase">Contact</th>
                                <th className="px-6 py-4 font-bold uppercase">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {staff.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{member.full_name}</div>
                                        <div className="text-xs text-blue-600 font-mono">{member.role}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {member.email}</div>
                                        {member.phone && <div className="flex items-center gap-2 mt-1"><Phone className="h-3 w-3" /> {member.phone}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${member.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-gray-600">
                                            <MoreVertical className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Staff Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl w-full max-w-md p-6"
                    >
                        <h2 className="text-xl font-bold mb-4">Add Staff Member</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newStaff.full_name}
                                    onChange={e => setNewStaff({ ...newStaff, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newStaff.email}
                                    onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Phone (Optional)</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newStaff.phone}
                                    onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-8">
                            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-bold">Cancel</button>
                            <button onClick={handleAddStaff} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">Add Member</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
