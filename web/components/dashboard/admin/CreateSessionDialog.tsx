"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, Calendar, MapPin, Users, Save, Loader2, AlertCircle } from "lucide-react";

type CreateSessionDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

export default function CreateSessionDialog({ isOpen, onClose, onSuccess }: CreateSessionDialogProps) {
    const [loading, setLoading] = useState(false);
    const [standards, setStandards] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        standard_id: "",
        location: "ERNAM Main Hall",
        start_date: "",
        end_date: "",
        status: "planned"
    });

    // Fetch Standards on Open
    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                // 1. Get Active Standards
                const { data: stds } = await supabase
                    .from('training_standards')
                    .select('id, title, code')
                    .eq('active', true)
                    .order('title');

                if (stds) setStandards(stds);
            };
            fetchData();
            // Reset form
            setFormData({
                standard_id: "",
                location: "ERNAM Main Hall",
                start_date: "",
                end_date: "",
                status: "planned"
            });
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Basic Validation
            if (!formData.standard_id || !formData.start_date || !formData.end_date) {
                throw new Error("Please fill in all required fields.");
            }

            if (new Date(formData.start_date) > new Date(formData.end_date)) {
                throw new Error("End date cannot be before start date.");
            }

            // 1. Prepare Session Payload
            const sessionPayload = {
                training_standard_id: formData.standard_id,
                location: formData.location,
                start_date: new Date(formData.start_date).toISOString(),
                end_date: new Date(formData.end_date).toISOString(),
                status: formData.status
            };

            // 2. Insert Session via API (Bypass RLS)
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch('/api/admin/create-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...sessionPayload,
                    adminId: session?.user?.id
                })
            });

            const resData = await response.json();

            if (!response.ok) {
                throw new Error(resData.error || "Failed to create session.");
            }

            // Success
            onSuccess();
            onClose();

        } catch (err: any) {
            console.error("Create Session Error:", err);
            setError(err.message || "Failed to create session.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background w-full max-w-lg rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/5">
                    <h2 className="text-lg font-bold text-foreground">Create Training Session</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Standard Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Training Standard *</label>
                        <select
                            required
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20"
                            value={formData.standard_id}
                            onChange={(e) => setFormData({ ...formData, standard_id: e.target.value })}
                        >
                            <option value="">Select a Course...</option>
                            {standards.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.code} - {s.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Dates Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Start Date *</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">End Date *</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 flex justify-end gap-3 border-t border-border mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all text-sm font-bold disabled:opacity-50"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Create Session
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
