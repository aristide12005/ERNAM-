"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, Save, AlertCircle, Loader2, Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

type SessionFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    sessionToEdit?: any | null;
};

export default function SessionFormModal({ isOpen, onClose, onSuccess, sessionToEdit }: SessionFormModalProps) {

    const [standards, setStandards] = useState<any[]>([]);
    const [instructors, setInstructors] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        training_standard_id: "",
        start_date: "",
        end_date: "",
        location: "",
        delivery_mode: "onsite" as 'onsite' | 'online',
        status: "planned",
        max_participants: 15,
        instructor_ids: [] as string[]
    });

    useEffect(() => {
        if (isOpen) {
            loadDependencies();
        }
    }, [isOpen]);

    useEffect(() => {
        if (sessionToEdit && standards.length > 0) {
            setFormData({
                training_standard_id: sessionToEdit.training_standard_id,
                start_date: format(new Date(sessionToEdit.start_date), "yyyy-MM-dd'T'HH:mm"),
                end_date: format(new Date(sessionToEdit.end_date), "yyyy-MM-dd'T'HH:mm"),
                location: sessionToEdit.location,
                delivery_mode: sessionToEdit.delivery_mode,
                status: sessionToEdit.status,
                max_participants: sessionToEdit.max_participants,
                instructor_ids: sessionToEdit.session_instructors?.map((si: any) => si.instructor_id) || []
            });
        } else if (!sessionToEdit) {
            setFormData({
                training_standard_id: "",
                start_date: "",
                end_date: "",
                location: "",
                delivery_mode: "onsite",
                status: "planned",
                max_participants: 15,
                instructor_ids: []
            });
        }
    }, [sessionToEdit, isOpen, standards]);

    async function loadDependencies() {
        setFetchLoading(true);
        try {
            const [stdRes, instRes] = await Promise.all([
                supabase.from('training_standards').select('id, code, title').eq('active', true).order('code'),
                supabase.from('users').select('id, full_name').eq('role', 'instructor').eq('status', 'approved').order('full_name')
            ]);
            setStandards(stdRes.data || []);
            setInstructors(instRes.data || []);
        } catch (err) {
            console.error("Error loading for session modal:", err);
        } finally {
            setFetchLoading(false);
        }
    }

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                id: sessionToEdit?.id,
                training_standard_id: formData.training_standard_id,
                start_date: new Date(formData.start_date).toISOString(),
                end_date: new Date(formData.end_date).toISOString(),
                location: formData.location,
                delivery_mode: formData.delivery_mode,
                status: formData.status,
                max_participants: formData.max_participants,
                instructor_ids: formData.instructor_ids
            };

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/admin/manage-session', {
                method: sessionToEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            const resData = await response.json();

            if (!response.ok) {
                throw new Error(resData.error || 'Failed to save session');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Save Session Error:", err);
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const toggleInstructor = (id: string) => {
        const current = [...formData.instructor_ids];
        const index = current.indexOf(id);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(id);
        }
        setFormData({ ...formData, instructor_ids: current });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background w-full max-w-2xl rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-gray-50/50 dark:bg-muted/10">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        {sessionToEdit ? "Edit Training Session" : "Schedule New Session"}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Training Standard Selection */}
                    <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Training Standard</label>
                        <select
                            required
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
                            value={formData.training_standard_id}
                            onChange={(e) => setFormData({ ...formData, training_standard_id: e.target.value })}
                        >
                            <option value="">Select a standard...</option>
                            {standards.map(s => (
                                <option key={s.id} value={s.id}>[{s.code}] {s.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Start Date & Time</label>
                            <input
                                required
                                type="datetime-local"
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>
                        {/* End Date */}
                        <div>
                            <label className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">End Date & Time</label>
                            <input
                                required
                                type="datetime-local"
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Location */}
                        <div>
                            <label className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    required
                                    type="text"
                                    className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="Room name or city"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                        </div>
                        {/* Delivery Mode */}
                        <div>
                            <label className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Delivery Mode</label>
                            <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, delivery_mode: 'onsite' })}
                                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${formData.delivery_mode === 'onsite' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                > Onsite </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, delivery_mode: 'online' })}
                                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${formData.delivery_mode === 'online' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                > Online </button>
                            </div>
                        </div>
                    </div>

                    {/* Instructor Selection */}
                    <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-wider flex justify-between">
                            <span>Assign Trainers</span>
                            <span className="text-[10px] text-blue-600 font-black">{formData.instructor_ids.length} Selected</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[150px] overflow-y-auto p-2 border border-border rounded-lg bg-muted/20">
                            {instructors.map(inst => (
                                <button
                                    key={inst.id}
                                    type="button"
                                    onClick={() => toggleInstructor(inst.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${formData.instructor_ids.includes(inst.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-background text-foreground border-border hover:border-blue-400'}`}
                                >
                                    <div className={`w-3 h-3 rounded-sm border ${formData.instructor_ids.includes(inst.id) ? 'bg-white' : 'border-current'}`} />
                                    <span className="truncate">{inst.full_name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Status */}
                        <div>
                            <label className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Status</label>
                            <select
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="planned">Planned</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        {/* Max Participants */}
                        <div>
                            <label className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Max Participants</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                value={formData.max_participants}
                                onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-gray-50/50 dark:bg-muted/10 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" disabled={loading}> Cancel </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.training_standard_id || !formData.start_date || !formData.end_date}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all text-sm font-bold disabled:opacity-50"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {sessionToEdit ? "Update Session" : "Schedule Session"}
                    </button>
                </div>
            </div>
        </div>
    );
}
