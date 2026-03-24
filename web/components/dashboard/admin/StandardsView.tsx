"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    BookOpen,
    Clock,
    CheckCircle,
    XCircle,
    Loader2
} from "lucide-react";
import StandardFormModal from "@/components/dashboard/admin/StandardFormModal";

type TrainingStandard = {
    id: string;
    code: string;
    title: string;
    description: string;
    validity_months: number;
    active: boolean;
    details: any;
};

export default function StandardsView() {
    const [standards, setStandards] = useState<TrainingStandard[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStandard, setEditingStandard] = useState<TrainingStandard | null>(null);

    // Fetch Standards
    const fetchStandards = async () => {
        setLoading(true);
        let query = supabase.from('training_standards').select('*').order('code', { ascending: true });

        if (searchQuery) {
            query = query.or(`code.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
        }

        const { data, error } = await query;
        if (!error && data) {
            setStandards(data);
        }
        setLoading(false);
    };

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStandards();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this standard? This might affect existing sessions.')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const response = await fetch(`/api/admin/manage-standard?id=${id}&adminId=${session?.user?.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setStandards(prev => prev.filter(s => s.id !== id));
            } else {
                const err = await response.json();
                throw new Error(err.error || 'Failed to delete standard');
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleEdit = (standard: TrainingStandard) => {
        setEditingStandard(standard);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingStandard(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        Training Standards
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Manage course templates, validity periods, and requirements.
                    </p>
                </div>

                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Create Standard
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search standards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
            </div>

            {/* Standards Table */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/30 text-muted-foreground uppercase tracking-wider text-xs font-semibold border-b border-border">
                            <tr>
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">Title</th>
                                <th className="px-6 py-4">Validity</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                    </td>
                                </tr>
                            ) : standards.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                        No standards found.
                                    </td>
                                </tr>
                            ) : (
                                standards.map((std) => (
                                    <tr key={std.id} className="hover:bg-muted/10 transition-colors group">
                                        <td className="px-6 py-4 font-mono font-medium text-blue-600">
                                            {std.code}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {std.title}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                {std.validity_months} months
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {std.active ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                                    <XCircle className="w-3 h-3" />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => handleEdit(std)}
                                                    className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all active:scale-95 shadow-sm border border-blue-100/50"
                                                    title="Edit Standard"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(std.id)}
                                                    className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all active:scale-95 shadow-sm border border-red-100/50"
                                                    title="Delete Standard"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <StandardFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchStandards(); // Refresh list
                }}
                standardToEdit={editingStandard}
            />
        </div>
    );
}
