'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    FileText,
    Plus,
    Search,
    Download,
    TrendingUp,
    Users,
    Upload,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTranslations } from 'next-intl';

interface Assignment {
    id: string;
    title: string;
    course_id: string;
    max_score: number;
    due_date?: string;
    file_url?: string;
    courses?: { title_en: string };
}

interface GradebookProps {
    instructorId: string;
    onGradeNow: (submissionId: string) => void;
}

export default function Gradebook({ instructorId, onGradeNow }: GradebookProps) {
    const t = useTranslations('InstructorDashboard');
    const [activeTab, setActiveTab] = useState<'assignments' | 'grading' | 'analytics'>('assignments');
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [courses, setCourses] = useState<{ id: string, title_en: string }[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [grades, setGrades] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // New Assignment Form
    const [showNewModal, setShowNewModal] = useState(false);
    const [newAssign, setNewAssign] = useState({ title: '', course_id: '', max_score: 100, due_date: '', file: null as File | null });

    const fetchData = async () => {
        setLoading(true);
        // Courses (Fetch via course_staff)
        // 1. Get course IDs for this instructor
        const { data: staffData } = await supabase
            .from('course_staff')
            .select('course_id, courses(id, title_en)')
            .eq('user_id', instructorId);

        const myCourses = staffData?.map((item: any) => item.courses) || [];
        setCourses(myCourses);

        // Assignments
        const { data: assignData } = await supabase.from('assignments').select('*, courses(title_en)');
        if (assignData) {
            // Filter assignments to only those from my courses (client side or enhance query)
            const myCourseIds = myCourses.map(c => c.id);
            setAssignments(assignData.filter(a => myCourseIds.includes(a.course_id)));
        }

        // Students (Anyone enrolled in instructor's courses)
        const courseIds = myCourses.map(c => c.id);
        if (courseIds.length > 0) {
            const { data: enrollData } = await supabase
                .from('enrollments')
                .select('user_id, profiles(full_name, email)')
                .in('course_id', courseIds);
            if (enrollData) setStudents(enrollData);
        } else {
            setStudents([]);
        }

        // Grades
        const { data: gradeData } = await supabase.from('grades').select('*');
        if (gradeData) setGrades(gradeData);

        setLoading(false);
    };

    useEffect(() => {
        if (instructorId) fetchData();
    }, [instructorId]);

    const handleCreateAssignment = async () => {
        if (!newAssign.title || !newAssign.course_id) return;

        let fileUrl = '';
        if (newAssign.file) {
            const fileExt = newAssign.file.name.split('.').pop();
            const fileName = `assignments/${Date.now()}.${fileExt}`;
            const { data, error: uploadError } = await supabase.storage.from('resources').upload(fileName, newAssign.file);
            if (uploadError) {
                console.error('Upload Error:', uploadError);
                alert(`Upload failed: ${uploadError.message}`);
                return;
            }
            if (data) {
                const { data: url } = supabase.storage.from('resources').getPublicUrl(fileName);
                fileUrl = url.publicUrl;
            }
        }

        const { error } = await supabase.from('assignments').insert({
            title: newAssign.title,
            course_id: newAssign.course_id,
            max_score: newAssign.max_score,
            due_date: newAssign.due_date,
            file_url: fileUrl
        });

        if (!error) {
            setShowNewModal(false);
            fetchData();
            // Notify students logic would go here
        }
    };

    const exportToExcel = () => {
        const data = students.map(s => {
            const row: any = { Student: s.profiles.full_name };
            assignments.forEach(a => {
                const g = grades.find(gr => gr.student_id === s.user_id && gr.assignment_id === a.id);
                row[a.title] = g ? g.score : '-';
            });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Grades");
        XLSX.writeFile(wb, "Gradebook_Export.xlsx");
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('gradebook_title')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{t('gradebook_desc')}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={exportToExcel}
                        className="bg-secondary hover:bg-muted text-foreground text-sm font-bold px-5 py-2.5 rounded-xl border border-border flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Download className="h-4 w-4" /> {t('export')}
                    </button>
                    <button
                        onClick={() => setShowNewModal(true)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Plus className="h-5 w-5" /> {t('new_assignment')}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-card border border-border rounded-xl w-fit">
                {[
                    { id: 'assignments', label: t('assignments_tab'), icon: FileText },
                    { id: 'grading', label: t('grading_tab'), icon: Users },
                    { id: 'analytics', label: t('analytics_tab'), icon: TrendingUp },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                            : 'text-muted-foreground hover:bg-muted'
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
                {loading ? (
                    <div className="p-20 text-center animate-pulse">{t('loading_data')}</div>
                ) : (
                    <div className="p-6">
                        {activeTab === 'assignments' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {assignments.map(a => (
                                    <div key={a.id} className="p-5 rounded-2xl border border-border bg-secondary/20 hover:border-primary/30 transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{a.courses?.title_en}</span>
                                        </div>
                                        <h3 className="font-bold text-foreground mb-1">{a.title}</h3>
                                        <p className="text-xs text-muted-foreground mb-4">{t('max_score')}: {a.max_score} pts</p>

                                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                <span className="text-xs text-muted-foreground">12/15 {t('graded_count')}</span>
                                            </div>
                                            {a.file_url && (
                                                <a href={a.file_url} target="_blank" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                                    <Download className="h-3 w-3" /> PDF
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {assignments.length === 0 && (
                                    <div className="col-span-full py-20 text-center">
                                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                        <p className="text-muted-foreground">{t('no_assignments')}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'grading' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-secondary/30">
                                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase sticky left-0 bg-secondary">{t('student_col')}</th>
                                            {assignments.map(a => (
                                                <th key={a.id} className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase min-w-[150px]">{a.title}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {students.map(s => (
                                            <tr key={s.user_id} className="hover:bg-muted/30">
                                                <td className="px-6 py-4 font-bold text-foreground sticky left-0 bg-card border-r border-border">{s.profiles.full_name}</td>
                                                {assignments.map(a => {
                                                    const g = grades.find(gr => gr.student_id === s.user_id && gr.assignment_id === a.id);
                                                    return (
                                                        <td key={a.id} className="px-6 py-4">
                                                            <div className={`p-2 rounded-lg text-center font-bold text-sm ${g ? 'bg-primary/5 text-primary border border-primary/10' : 'bg-muted/50 text-muted-foreground border border-transparent'
                                                                }`}>
                                                                {g ? `${g.score}/${a.max_score}` : 'N/A'}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* New Assignment Modal */}
            <AnimatePresence>
                {showNewModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-6"
                        >
                            <h2 className="text-xl font-bold text-foreground mb-6">{t('create_assignment')}</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">{t('title_label')}</label>
                                    <input
                                        type="text"
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder={t('title_placeholder')}
                                        value={newAssign.title}
                                        onChange={e => setNewAssign({ ...newAssign, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">{t('course_label')}</label>
                                    <select
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={newAssign.course_id}
                                        onChange={e => setNewAssign({ ...newAssign, course_id: e.target.value })}
                                    >
                                        <option value="">{t('select_course')}</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.title_en}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">{t('max_score')}</label>
                                        <input
                                            type="number"
                                            className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            value={newAssign.max_score}
                                            onChange={e => setNewAssign({ ...newAssign, max_score: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">{t('due_date')}</label>
                                        <input
                                            type="date"
                                            className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            value={newAssign.due_date}
                                            onChange={e => setNewAssign({ ...newAssign, due_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">{t('attachment')}</label>
                                    <label className="w-full border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
                                        <Upload className="h-6 w-6 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">{newAssign.file ? newAssign.file.name : t('upload_placeholder')}</span>
                                        <input type="file" className="hidden" onChange={e => setNewAssign({ ...newAssign, file: e.target.files?.[0] || null })} />
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowNewModal(false)}
                                    className="flex-1 bg-secondary hover:bg-muted text-foreground font-bold py-3 rounded-xl transition-all"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={handleCreateAssignment}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl shadow-lg shadow-primary/20 transition-all"
                                >
                                    {t('create')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
