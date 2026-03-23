"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, Upload, Save, AlertCircle, Loader2, FileText, Link as LinkIcon, Calendar, Plus } from "lucide-react";

type DocumentFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    documentToEdit?: any | null;
    onAddNewSession?: () => void;
};

export default function DocumentFormModal({ isOpen, onClose, onSuccess, documentToEdit, onAddNewSession }: DocumentFormModalProps) {

    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        session_id: "" as string | null,
        title: "",
        file_url: "",
        document_type: "material" as 'material' | 'assessment' | 'instruction',
    });
    const [uploadMode, setUploadMode] = useState<'link' | 'file'>('link');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadSessions();
        }
    }, [isOpen]);

    useEffect(() => {
        if (documentToEdit) {
            setFormData({
                session_id: documentToEdit.session_id,
                title: documentToEdit.title,
                file_url: documentToEdit.file_url,
                document_type: documentToEdit.document_type
            });
        } else {
            setFormData({
                session_id: null,
                title: "",
                file_url: "",
                document_type: "material"
            });
            setSelectedFile(null);
            setUploadMode('link');
        }
    }, [documentToEdit, isOpen]);

    async function loadSessions() {
        setFetchLoading(true);
        try {
            const { data } = await supabase
                .from('sessions')
                .select('id, training_standard:training_standards(code, title), start_date')
                .order('start_date', { ascending: false })
                .limit(50);
            setSessions(data || []);
        } catch (err) {
            console.error("Error loading sessions:", err);
        } finally {
            setFetchLoading(false);
        }
    }

    if (!isOpen) return null;

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `documents/${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from('resources')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('resources')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (err: any) {
            console.error("Upload error:", err);
            throw new Error(`Upload failed: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let finalFileUrl = formData.file_url;

            if (uploadMode === 'file' && selectedFile) {
                finalFileUrl = await handleFileUpload(selectedFile);
            }

            if (!finalFileUrl) throw new Error("Please provide a file or URL");

            const { data: { session: authSession } } = await supabase.auth.getSession();
            
            const payload = {
                id: documentToEdit?.id,
                session_id: formData.session_id || null, // Allow null for "No Assigned"
                title: formData.title,
                file_url: finalFileUrl,
                document_type: formData.document_type,
                uploaded_by: authSession?.user?.id
            };

            const response = await fetch('/api/admin/manage-document', {
                method: documentToEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const { error: sbError } = await supabase
                    .from('documents')
                    .upsert(payload);
                if (sbError) throw sbError;
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Save Document Error:", err);
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
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        {documentToEdit ? "Edit Document" : "Upload New Document"}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Target Session */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Associated Course / Session</label>
                            <button
                                type="button"
                                onClick={onAddNewSession}
                                className="flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
                            >
                                <Plus className="w-3 h-3" /> Create New
                            </button>
                        </div>
                        <select
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none text-sm font-semibold"
                            value={formData.session_id || ""}
                            onChange={(e) => setFormData({ ...formData, session_id: e.target.value || null })}
                        >
                            <option value="">No assigned course (Global)</option>
                            {sessions.map(s => (
                                <option key={s.id} value={s.id}>
                                    [{s.training_standard?.code}] {s.training_standard?.title} ({new Date(s.start_date).toLocaleDateString()})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Document Title</label>
                        <input
                            required
                            type="text"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="e.g. Flight Safety Manual v2"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* URL / File Selection */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">File Content</label>
                            <div className="flex bg-muted rounded-md p-0.5 border border-border">
                                <button
                                    type="button"
                                    onClick={() => setUploadMode('link')}
                                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${uploadMode === 'link' ? 'bg-background shadow-sm text-blue-600' : 'text-muted-foreground'}`}
                                > Link </button>
                                <button
                                    type="button"
                                    onClick={() => setUploadMode('file')}
                                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${uploadMode === 'file' ? 'bg-background shadow-sm text-blue-600' : 'text-muted-foreground'}`}
                                > Upload </button>
                            </div>
                        </div>

                        {uploadMode === 'link' ? (
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    required={uploadMode === 'link'}
                                    type="text"
                                    className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                    placeholder="https://external-storage.com/resource.pdf"
                                    value={formData.file_url}
                                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                                />
                            </div>
                        ) : (
                            <div className="relative group">
                                <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all ${selectedFile ? 'border-blue-500 bg-blue-50/50' : 'border-border bg-muted/20 hover:border-blue-400 hover:bg-blue-50/10'}`}>
                                    <div className="flex flex-col items-center justify-center pt-2">
                                        {selectedFile ? (
                                            <>
                                                <FileText className="w-6 h-6 text-blue-600 mb-1" />
                                                <p className="text-[10px] font-bold text-blue-800 truncate max-w-[200px]">{selectedFile.name}</p>
                                                <p className="text-[8px] text-blue-600/70">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-6 h-6 text-muted-foreground mb-1 group-hover:scale-110 transition-transform" />
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select file to upload</p>
                                                <p className="text-[8px] text-muted-foreground/60 mt-1 uppercase">PDF, DOCX, ZIP (MAX 20MB)</p>
                                            </>
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    />
                                </label>
                                {selectedFile && (
                                    <button 
                                        type="button"
                                        onClick={() => setSelectedFile(null)}
                                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Document Type</label>
                        <div className="flex bg-muted/50 p-1 rounded-lg border border-border gap-1">
                            {['material', 'assessment', 'instruction'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, document_type: t as any })}
                                    className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${formData.document_type === t ? 'bg-background shadow-sm text-blue-600 border border-blue-100' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-gray-50/50 dark:bg-muted/10 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" disabled={loading || uploading}> Cancel </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || uploading || (!selectedFile && !formData.file_url) || !formData.title}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all text-sm font-bold disabled:opacity-50"
                    >
                        {(loading || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
                        {uploading ? "Uploading..." : (documentToEdit ? "Update Document" : "Save Document")}
                    </button>
                </div>
            </div>
        </div>
    );
}
