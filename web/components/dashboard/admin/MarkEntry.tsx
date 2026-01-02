'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Save,
    Search,
    User,
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MarkEntryProps {
    exam: any;
    onBack: () => void;
}

export default function MarkEntry({ exam, onBack }: MarkEntryProps) {
    const t = useTranslations('AdminDashboard');
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [marks, setMarks] = useState<Record<string, { theory: number, practical: number }>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Fetch courses available for this session/structure
    // For simplicity, we fetch all active courses. 
    // Ideally, this should filter by the exam's session or associated batches.
    useEffect(() => {
        const fetchCourses = async () => {
            const { data } = await supabase.from('courses').select('id, title_en, code, departments(name)').eq('status', 'active');
            if (data) setCourses(data);
        };
        fetchCourses();
    }, []);

    // Fetch students and existing marks when course is selected
    useEffect(() => {
        if (!selectedCourse) return;

        const fetchData = async () => {
            setLoading(true);

            // 1. Fetch students enrolled in this course
            // Note: In a full system, you might filter by Batch matching the Exam's Session
            const { data: enrollments } = await supabase
                .from('enrollments')
                .select('user_id, profiles:profiles(id, full_name, student_details(roll_number))')
                .eq('course_id', selectedCourse)
                .eq('status', 'active');

            // 2. Fetch existing marks for this exam + course
            const { data: existingMarks } = await supabase
                .from('marks')
                .select('*')
                .eq('exam_id', exam.id)
                .eq('course_id', selectedCourse);

            if (enrollments) {
                const studentsList = enrollments.map((en: any) => ({
                    id: en.profiles.id,
                    name: en.profiles.full_name,
                    roll: en.profiles.student_details?.roll_number || 'N/A'
                }));
                setStudents(studentsList);

                // Initialize marks state
                const marksMap: any = {};
                // Default to 0 based on existing
                studentsList.forEach(s => {
                    const found = existingMarks?.find(m => m.student_id === s.id);
                    marksMap[s.id] = found ? { theory: found.theory_marks, practical: found.practical_marks } : { theory: 0, practical: 0 };
                });
                setMarks(marksMap);
            }
            setLoading(false);
        };

        fetchData();
    }, [selectedCourse, exam.id]);

    const handleMarkChange = (studentId: string, type: 'theory' | 'practical', value: string) => {
        const numVal = parseInt(value) || 0;
        setMarks(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [type]: numVal
            }
        }));
    };

    const handleSave = async () => {
        if (!selectedCourse) return;
        setSaving(true);

        const upsertData = students.map(s => ({
            exam_id: exam.id,
            course_id: selectedCourse,
            student_id: s.id,
            theory_marks: marks[s.id]?.theory || 0,
            practical_marks: marks[s.id]?.practical || 0,
            // total and grade can be calculated by DB trigger or here
            total_marks: (marks[s.id]?.theory || 0) + (marks[s.id]?.practical || 0)
        }));

        const { error } = await supabase.from('marks').upsert(upsertData, { onConflict: 'exam_id,course_id,student_id' });

        if (error) {
            alert(t('save_error') + error.message);
        } else {
            alert(t('marks_saved'));
        }
        setSaving(false);
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5 text-white" />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-white">{t('mark_entry_title', { name: exam.name })}</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{t('academic_session_label')}: {exam.academic_sessions?.year}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Course Selection */}
                <div className="md:col-span-1 space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">{t('select_subject')}</label>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                        {courses.map(course => (
                            <button
                                key={course.id}
                                onClick={() => setSelectedCourse(course.id)}
                                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedCourse === course.id
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <div className="font-bold text-sm">{course.title_en}</div>
                                <div className="text-[10px] opacity-70">{course.code} &bull; {course.departments?.name || t('general_dept')}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mark Entry Table */}
                <div className="md:col-span-3 bg-[#141414] border border-white/5 rounded-2xl p-6 min-h-[500px] relative">
                    {!selectedCourse ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <ArrowLeft className="h-8 w-8 mb-2 opacity-50" />
                            <p>{t('select_subject_desc')}</p>
                        </div>
                    ) : loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-white">{t('student_list')} <span className="text-gray-500 text-xs ml-2">{t('enrolled_count', { count: students.length })}</span></h3>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    {t('save_marks')}
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-white/5 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-white/5">
                                            <th className="px-4 py-3">{t('roll_no')}</th>
                                            <th className="px-4 py-3">{t('student_name')}</th>
                                            <th className="px-4 py-3 w-32">{t('theory_max')}</th>
                                            <th className="px-4 py-3 w-32">{t('practical_max')}</th>
                                            <th className="px-4 py-3 w-24">{t('total')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {students.map(student => (
                                            <tr key={student.id} className="hover:bg-white/5">
                                                <td className="px-4 py-3 font-mono text-gray-500">{student.roll}</td>
                                                <td className="px-4 py-3 font-bold text-white">{student.name}</td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        min="0" max="100"
                                                        value={marks[student.id]?.theory || ''}
                                                        onChange={(e) => handleMarkChange(student.id, 'theory', e.target.value)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-center font-mono focus:border-blue-500 outline-none transition-colors"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        min="0" max="100"
                                                        value={marks[student.id]?.practical || ''}
                                                        onChange={(e) => handleMarkChange(student.id, 'practical', e.target.value)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-center font-mono focus:border-blue-500 outline-none transition-colors"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 font-black text-blue-400 text-right">
                                                    {(marks[student.id]?.theory || 0) + (marks[student.id]?.practical || 0)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
