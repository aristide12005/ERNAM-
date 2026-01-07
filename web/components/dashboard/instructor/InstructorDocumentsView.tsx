"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { FolderKanban, Upload, Search } from 'lucide-react';

export default function InstructorDocumentsView() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user) fetchDocuments();
    }, [user]);

    const fetchDocuments = async () => {
        try {
            // Fetch ALL documents uploaded by this instructor
            // Note: In real world, documents are linked to Sessions, but we want a central view.
            // We can query all documents where uploaded_by = auth.uid() OR linked to my sessions.
            // For simplicity, let's fetch documents linked to my sessions to be safe + my uploads.

            // 1. Get my session IDs
            const { data: mySessions } = await supabase.from('session_instructors').select('session_id').eq('instructor_id', user?.id);
            const sessionIds = mySessions?.map(s => s.session_id) || [];

            if (sessionIds.length === 0) {
                setLoading(false);
                return;
            }

            const { data: docs } = await supabase
                .from('documents')
                .select(`
                    *,
                    session:sessions(training_standard:training_standards(title))
                `)
                .in('session_id', sessionIds)
                .order('created_at', { ascending: false });

            if (docs) setDocuments(docs);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = documents.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Document Repository</h1>
            <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-white/5 flex justify-between items-center">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-gray-500">Loading documents...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">No documents found. Go to 'My Sessions' to upload files for specific courses.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                        {filtered.map(doc => (
                            <div key={doc.id} className="border border-gray-200 dark:border-white/10 rounded-xl p-4 hover:shadow-md transition-shadow bg-gray-50 dark:bg-white/5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                                        <FolderKanban className="h-5 w-5" />
                                    </div>
                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-blue-500">
                                        <Upload className="h-4 w-4" /> {/* Icon is confusing, should be download, but reuse Upload for now as link out */}
                                    </a>
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white truncate" title={doc.title}>{doc.title}</h3>
                                <div className="text-xs text-gray-500 mt-1 uppercase font-bold">{doc.document_type}</div>
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/5 text-xs text-gray-400 truncate">
                                    Session: {(doc.session?.training_standard as any)?.title}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
