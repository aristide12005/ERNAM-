'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Plus,
    Trash2,
    Edit2,
    CheckCircle,
    X,
    FileText,
    Clock,
    Eye,
    EyeOff,
    Loader2,
    BookOpen
} from 'lucide-react';
import MarkEntry from './MarkEntry';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTranslations } from 'next-intl';

export default function ExamManagement() {
    const t = useTranslations('AdminDashboard');
    const { profile } = useAuth();
    const [exams, setExams] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedExamForGrading, setSelectedExamForGrading] = useState<any>(null); // New state

    // Form State
    const [newItem, setNewItem] = useState({
        name: '',
        session_id: '',
        start_date: '',
        end_date: '',
        is_published: false
    });

    const fetchData = async () => {
        setLoading(true);
        const [eRes, sRes] = await Promise.all([
            supabase.from('exams').select('*, academic_sessions(year)').order('start_date', { ascending: false }),
            supabase.from('academic_sessions').select('*').order('year', { ascending: false })
        ]);

        if (eRes.data) setExams(eRes.data);
        if (sRes.data) setSessions(sRes.data);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('exams').insert(newItem);
        if (!error) {
            setIsCreateOpen(false);
            setNewItem({ name: '', session_id: '', start_date: '', end_date: '', is_published: false });
            fetchData();
        } else {
            alert("Error: " + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('delete_confirm'))) return;
        const { error } = await supabase.from('exams').delete().eq('id', id);
        if (!error) fetchData();
    };

    const togglePublish = async (exam: any) => {
        const { error } = await supabase.from('exams').update({ is_published: !exam.is_published }).eq('id', exam.id);
        if (!error) fetchData();
    };

    if (selectedExamForGrading) {
        return <MarkEntry exam={selectedExamForGrading} onBack={() => setSelectedExamForGrading(null)} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-blue-500" /> {t('exam_management_title')}
                </h2>
                {profile?.role === 'admin' && (
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
                    >
                        <Plus className="h-4 w-4" /> {t('schedule_exam_button')}
                    </button>
                )}
            </div>

            <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                        <p className="text-gray-500 italic">{t('loading_exams')}</p>
                    </div>
                ) : exams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <Calendar className="h-12 w-12 text-gray-600 mb-4" />
                        <h3 className="text-lg font-bold text-gray-400">{t('no_exams')}</h3>
                        <p className="text-sm text-gray-500 mt-1">{t('no_exams_desc')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-white/5 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-white/5">
                                    <th className="px-6 py-4">{t('exam_name_col')}</th>
                                    <th className="px-6 py-4">{t('session_col')}</th>
                                    <th className="px-6 py-4">{t('schedule_col')}</th>
                                    <th className="px-6 py-4">{t('status_col')}</th>
                                    <th className="px-6 py-4 text-right">{t('actions_col')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {exams.map((exam) => (
                                    <motion.tr
                                        key={exam.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-white/5 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white text-base">{exam.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-white/5 rounded text-xs font-mono text-blue-300 border border-blue-500/20">
                                                {exam.academic_sessions?.year}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-xs">
                                            <div className="flex flex-col gap-1">
                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t('start_label')}: {new Date(exam.start_date).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t('end_label')}: {new Date(exam.end_date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                disabled={profile?.role !== 'admin'}
                                                onClick={() => profile?.role === 'admin' && togglePublish(exam)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tight border transition-all ${exam.is_published
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                                                    : 'bg-gray-500/10 text-gray-500 border-white/10 hover:bg-gray-500/20'
                                                    } ${profile?.role !== 'admin' ? 'cursor-default opacity-80' : ''}`}>
                                                {exam.is_published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                                {exam.is_published ? t('published') : t('draft')}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedExamForGrading(exam)}
                                                    className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors border border-transparent hover:border-blue-500/20"
                                                    title={t('enter_marks_tooltip')}
                                                >
                                                    <BookOpen className="h-4 w-4" />
                                                </button>
                                                {profile?.role === 'admin' && (
                                                    <button
                                                        onClick={() => handleDelete(exam.id)}
                                                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                                        title={t('delete_exam_tooltip')}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#141414] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white">{t('schedule_new_exam_title')}</h3>
                                <button onClick={() => setIsCreateOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('exam_name_label')}</label>
                                    <input required value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none" placeholder={t('exam_name_placeholder')} />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('academic_session_label')}</label>
                                    <select required value={newItem.session_id} onChange={e => setNewItem({ ...newItem, session_id: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none">
                                        <option value="">{t('select_session')}</option>
                                        {sessions.map(s => <option key={s.id} value={s.id}>{s.year}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('start_date_label')}</label>
                                        <input required type="date" value={newItem.start_date} onChange={e => setNewItem({ ...newItem, start_date: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('end_date_label')}</label>
                                        <input required type="date" value={newItem.end_date} onChange={e => setNewItem({ ...newItem, end_date: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                                    <input type="checkbox" id="publish" checked={newItem.is_published} onChange={e => setNewItem({ ...newItem, is_published: e.target.checked })} className="w-4 h-4 rounded border-gray-500 text-blue-600 focus:ring-blue-500 bg-gray-700" />
                                    <label htmlFor="publish" className="text-sm font-bold text-white cursor-pointer select-none">{t('publish_immediately')}</label>
                                </div>

                                <button disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mt-4 disabled:opacity-50">
                                    {t('schedule_exam_submit')}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
