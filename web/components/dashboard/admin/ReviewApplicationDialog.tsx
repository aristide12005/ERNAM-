"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, CheckCircle, XCircle, Building2, User, Loader2, AlertCircle } from "lucide-react";

type ReviewApplicationDialogProps = {
    application: any;
    onClose: () => void;
    onSuccess: () => void;
};

export default function ReviewApplicationDialog({ application, onClose, onSuccess }: ReviewApplicationDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleApprove = async () => {
        setLoading(true);
        setError(null);

        try {
            // Get Current Admin Session
            const { data: { session } } = await supabase.auth.getSession();

            // Call API to Atomic Approve (Org + User + App)
            const response = await fetch('/api/admin/approve-organization', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    application_id: application.id,
                    adminId: session?.user?.id
                })
            });

            const resData = await response.json();

            if (!response.ok) {
                throw new Error(resData.error || "Failed to approve organization.");
            }

            // Success
            onSuccess();
            onClose();

        } catch (err: any) {
            console.error("Approval Error:", err);
            setError(err.message || "Failed to approve organization.");
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('applications')
            .update({ status: 'rejected' })
            .eq('id', application.id);

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            onSuccess();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#141414] w-full max-w-4xl rounded-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        Review Organization Application
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Left: Organization Info */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
                            Organization Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Official Name</label>
                                <div className="text-lg font-medium text-white flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-400" />
                                    {application.organization_name}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Type</label>
                                    <div className="text-sm text-gray-300 capitalize">{application.details.org_type || 'N/A'}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Country</label>
                                    <div className="text-sm text-gray-300">{application.organization_country}</div>
                                </div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                                <label className="text-xs text-gray-500 block mb-2">Message from Applicant</label>
                                <p className="text-sm text-gray-300 italic">"{application.details.message}"</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Applicant Info */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
                            Applicant Identity
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Full Name</label>
                                <div className="text-lg font-medium text-white flex items-center gap-2">
                                    <User className="w-5 h-5 text-purple-400" />
                                    {application.applicant_name}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Email (Official)</label>
                                <div className="text-sm text-gray-300 font-mono">{application.applicant_email}</div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Phone</label>
                                <div className="text-sm text-gray-300">{application.applicant_phone}</div>
                            </div>

                            {/* Security Notice */}
                            <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                                <h4 className="text-sm font-bold text-yellow-500 mb-1 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Authority Action
                                </h4>
                                <p className="text-xs text-gray-400">
                                    Approving this application will immediately create a legal <strong>Organization</strong> entity and invite this user as the <strong>Organization Admin</strong>. This action is logged.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 bg-white/5 flex items-center justify-between">
                    <div>
                        {error && (
                            <span className="text-sm text-red-500 flex items-center gap-2">
                                <XCircle className="w-4 h-4" /> {error}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleReject}
                            disabled={loading}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            Reject Application
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={loading}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Approve & Create Organization
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

import { ShieldCheck } from "lucide-react";
