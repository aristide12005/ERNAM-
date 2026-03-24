"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, Save, AlertCircle, Loader2 } from "lucide-react";

type StandardFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    standardToEdit?: any | null; // Pass null for create mode
};

export default function StandardFormModal({ isOpen, onClose, onSuccess, standardToEdit }: StandardFormModalProps) {

    // Form State
    const [formData, setFormData] = useState({
        code: "",
        title: "",
        description: "",
        validity_months: 24,
        active: true
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial Load for Edit Mode
    useEffect(() => {
        if (standardToEdit) {
            setFormData({
                code: standardToEdit.code,
                title: standardToEdit.title,
                description: standardToEdit.description || "",
                validity_months: standardToEdit.validity_months || 24,
                active: standardToEdit.active
            });
        } else {
            // Reset for create
            setFormData({
                code: "",
                title: "",
                description: "",
                validity_months: 24,
                active: true
            });
        }
        setError(null);
    }, [standardToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Validation: Check Code Uniqueness (Only on Create or if Code changed)
            // Use Client Side check for check, but rely on API for final insert
            if (!standardToEdit || standardToEdit.code !== formData.code) {
                const { count, error: countError } = await supabase
                    .from('training_standards')
                    .select('*', { count: 'exact', head: true })
                    .eq('code', formData.code);

                if (countError) {
                    // Ignore RLS errors on count, let API handle it
                    console.warn("Pre-check failed, proceeding to API", countError);
                } else if (count && count > 0) {
                    setError("This code already exists.");
                    setLoading(false);
                    return;
                }
            }

            // Prepare Payload
            const sessionObj = (await supabase.auth.getSession()).data.session;
            const payload = {
                id: standardToEdit?.id,
                code: formData.code,
                title: formData.title,
                description: formData.description,
                validity_months: parseInt(String(formData.validity_months), 10),
                active: formData.active
            };

            const response = await fetch('/api/admin/manage-standard', {
                method: standardToEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionObj?.access_token}` },
                body: JSON.stringify(payload)
            });

            const resData = await response.json();

            if (!response.ok) {
                throw new Error(resData.error || 'Failed to save standard');
            }

            // Success
            onSuccess();
            onClose();

        } catch (err: any) {
            console.error("Save Error:", err);
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background w-full max-w-lg rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-gray-50/50 dark:bg-muted/10">
                    <h2 className="text-lg font-bold text-foreground">
                        {standardToEdit ? "Edit Standard" : "Create New Standard"}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Code */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Standard Code</label>
                        <input
                            required
                            type="text"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase font-mono tracking-widest"
                            placeholder="e.g. B737-NG-T1"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        />
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Title / Course Name</label>
                        <input
                            required
                            type="text"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* Validity - Now Single Column */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Validity (Months)</label>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            value={formData.validity_months}
                            onChange={(e) => setFormData({ ...formData, validity_months: Number(e.target.value) })}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Description</label>
                        <textarea
                            rows={3}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-sm"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center gap-3">
                        <div
                            onClick={() => setFormData({ ...formData, active: !formData.active })}
                            className={`w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${formData.active ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${formData.active ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-sm font-medium text-foreground">Active</span>
                    </div>

                </form>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-gray-50/50 dark:bg-muted/10 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.code || !formData.title}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Standard
                    </button>
                </div>
            </div>
        </div>
    );
}
