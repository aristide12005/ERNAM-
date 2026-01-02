'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    PieChart,
    FileText,
    Download,
    Upload,
    Trash2,
    Plus,
    Briefcase,
    FileSearch,
    ChevronRight,
    Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface UserDocument {
    id: string;
    title: string;
    file_url: string;
    file_type: string;
    category: string;
    created_at: string;
}

export default function Reports({ userId }: { userId: string }) {
    const t = useTranslations('InstructorDashboard');
    const [docs, setDocs] = useState<UserDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');

    const fetchDocs = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('user_documents')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (data) setDocs(data);
        setLoading(false);
    };

    useEffect(() => {
        if (userId) fetchDocs();
    }, [userId]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `personal/${userId}/${Date.now()}.${fileExt}`;

        const { data, error: uploadError } = await supabase.storage.from('resources').upload(fileName, file);
        if (uploadError) {
            console.error('Upload Error:', uploadError);
            alert(`Upload failed: ${uploadError.message}`);
            return;
        }

        if (data) {
            const { data: url } = supabase.storage.from('resources').getPublicUrl(fileName);
            const { error: insertError } = await supabase.from('user_documents').insert({
                user_id: userId,
                title: file.name,
                file_url: url.publicUrl,
                file_type: fileExt,
                category: 'general'
            });
            if (insertError) {
                console.error('Insert Error:', insertError);
                alert(`Saving document info failed: ${insertError.message}`);
            }
            fetchDocs();
        }
    };

    const categories = [
        { id: 'all', label: t('all_documents'), icon: Briefcase },
        { id: 'grades', label: t('grade_reports'), icon: FileText },
        { id: 'course', label: t('course_items'), icon: PieChart },
        { id: 'notes', label: t('personal_notes'), icon: FileSearch },
    ];

    const filteredDocs = activeCategory === 'all'
        ? docs
        : docs.filter(d => d.category === activeCategory);

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('reports_title')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{t('reports_desc')}</p>
                </div>
                <label className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold px-6 py-3 rounded-xl shadow-lg shadow-primary/20 cursor-pointer flex items-center gap-2 transition-all active:scale-95">
                    <Upload className="h-5 w-5" /> {t('upload_document')}
                    <input type="file" className="hidden" onChange={handleUpload} />
                </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Filters */}
                <div className="lg:col-span-1 space-y-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${activeCategory === cat.id
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                : 'bg-card border border-border text-muted-foreground hover:border-primary/50 hover:bg-muted'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <cat.icon className="h-5 w-5" />
                                <span className="text-sm font-bold">{cat.label}</span>
                            </div>
                            <ChevronRight className={`h-4 w-4 transition-transform ${activeCategory === cat.id ? 'rotate-90' : ''}`} />
                        </button>
                    ))}
                </div>

                {/* Document Grid */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex gap-4 items-center bg-card p-4 rounded-xl border border-border">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder={t('search_docs')}
                                className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                            {[1, 2, 3, 4].map(i => <div key={i} className="bg-card h-24 rounded-xl border border-border"></div>)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredDocs.map((doc) => (
                                <div key={doc.id} className="bg-card border border-border p-4 rounded-xl flex items-center justify-between group hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-secondary rounded-xl flex items-center justify-center text-primary">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground line-clamp-1">{doc.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-bold">{doc.file_type}</span>
                                                <span className="text-[10px] text-muted-foreground font-medium">{new Date(doc.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a href={doc.file_url} target="_blank" className="p-2 hover:bg-muted rounded-lg text-primary transition-colors">
                                            <Download className="h-5 w-5" />
                                        </a>
                                        <button className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors">
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {filteredDocs.length === 0 && (
                                <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-xl opacity-40">
                                    <FileSearch className="h-12 w-12 mx-auto mb-3" />
                                    <p>{t('no_docs')}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Report Generators Section */}
                    <div className="pt-8 border-t border-border">
                        <h2 className="text-lg font-bold text-foreground mb-4">{t('quick_reports')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-xl shadow-blue-900/40 relative overflow-hidden group">
                                <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform">
                                    <PieChart className="h-32 w-32" />
                                </div>
                                <h3 className="font-bold mb-1">{t('class_grade_summary')}</h3>
                                <p className="text-xs text-blue-100 mb-6">{t('class_grade_desc')}</p>
                                <button className="bg-white text-blue-700 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-50 transition-colors">
                                    <Plus className="h-4 w-4" /> {t('generate_report')}
                                </button>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-2xl text-white shadow-xl shadow-emerald-900/40 relative overflow-hidden group">
                                <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform">
                                    <FileText className="h-32 w-32" />
                                </div>
                                <h3 className="font-bold mb-1">{t('attendance_report')}</h3>
                                <p className="text-xs text-emerald-100 mb-6">{t('attendance_desc')}</p>
                                <button className="bg-white text-emerald-700 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-50 transition-colors">
                                    <Plus className="h-4 w-4" /> {t('generate_report')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
