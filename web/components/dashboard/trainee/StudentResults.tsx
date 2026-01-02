"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import {
    FileText,
    Award,
    Printer,
    Download,
    ChevronDown,
    ChevronUp,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

export default function StudentResults() {
    const { profile } = useAuth();
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedExam, setExpandedExam] = useState<string | null>(null);

    useEffect(() => {
        if (!profile) return;

        const fetchResults = async () => {
            setLoading(true);

            // Fetch all marks for the student, including Exam and Course details
            const { data } = await supabase
                .from('marks')
                .select(`
                    *,
                    exams ( id, name, start_date, academic_sessions(year) ),
                    courses ( title_en, code )
                `)
                .eq('student_id', profile.id)
                .order('created_at', { ascending: false });

            if (data) {
                // Group by Exam
                const grouped: Record<string, any> = {};
                data.forEach((mark: any) => {
                    const examId = mark.exams?.id;
                    if (!examId) return;

                    if (!grouped[examId]) {
                        grouped[examId] = {
                            id: examId,
                            name: mark.exams.name,
                            session: mark.exams.academic_sessions?.year,
                            date: mark.exams.start_date,
                            marks: [],
                            totalObtained: 0,
                            grandTotal: 0
                        };
                    }
                    grouped[examId].marks.push(mark);
                    grouped[examId].totalObtained += mark.total_marks;
                    grouped[examId].grandTotal += 100; // Assuming 100 per subject
                });

                const groupValues = Object.values(grouped);
                setResults(groupValues);

                // Auto-expand the most recent one
                if (groupValues.length > 0) {
                    setExpandedExam(groupValues[0].id);
                }
            }
            setLoading(false);
        };

        fetchResults();
    }, [profile]);

    const handlePrint = (examId: string) => {
        // Simple print implementation
        // In a real app, you might render a hidden printable div or use jspdf
        const printContent = document.getElementById(`report-card-${examId}`);
        if (printContent) {
            const originalContents = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload(); // Reload to restore state (brute force fix for React state loss on body replacement)
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Award className="h-6 w-6 text-blue-500" /> Exam Results
            </h2>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            ) : results.length === 0 ? (
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-12 text-center">
                    <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-400">No Results Available</h3>
                    <p className="text-sm text-gray-500 mt-2">Marksheets will appear here once exams are graded.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {results.map((exam: any) => (
                        <motion.div
                            key={exam.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden"
                        >
                            <div
                                onClick={() => setExpandedExam(expandedExam === exam.id ? null : exam.id)}
                                className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                                        <Award className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{exam.name}</h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                                            Session {exam.session} &bull; {new Date(exam.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden md:block">
                                        <div className="text-2xl font-black text-white">
                                            {((exam.totalObtained / exam.grandTotal) * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-bold uppercase">Average Score</div>
                                    </div>
                                    {expandedExam === exam.id ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
                                </div>
                            </div>

                            {expandedExam === exam.id && (
                                <div className="border-t border-white/5 p-6 bg-black/20" id={`report-card-${exam.id}`}>
                                    {/* Printable Header - hidden usually, visible on print if scoped css used, but here simpler */}
                                    <div className="flex justify-between items-end mb-6">
                                        <div>
                                            <div className="text-2xl font-black text-white tracking-widest uppercase">Official Transcript</div>
                                            <div className="text-sm text-gray-400 mt-1">Ref: {exam.id.slice(0, 8).toUpperCase()}</div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handlePrint(exam.id); }}
                                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold text-white transition-colors print:hidden"
                                        >
                                            <Printer className="h-4 w-4" /> Print Results
                                        </button>
                                    </div>

                                    <table className="w-full text-left text-sm mb-6">
                                        <thead>
                                            <tr className="border-b border-white/10 text-gray-500 text-xs uppercase tracking-widest">
                                                <th className="py-3 px-4">Subject Code</th>
                                                <th className="py-3 px-4">Subject Title</th>
                                                <th className="py-3 text-center">Theory</th>
                                                <th className="py-3 text-center">Practical</th>
                                                <th className="py-3 text-right px-4">Total Marks</th>
                                                <th className="py-3 text-center px-4">Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {exam.marks.map((m: any) => {
                                                const percentage = m.total_marks; // Assuming out of 100
                                                let grade = 'F';
                                                let color = 'text-red-500';

                                                if (percentage >= 80) { grade = 'A+'; color = 'text-emerald-500'; }
                                                else if (percentage >= 70) { grade = 'A'; color = 'text-emerald-400'; }
                                                else if (percentage >= 60) { grade = 'B'; color = 'text-blue-400'; }
                                                else if (percentage >= 50) { grade = 'C'; color = 'text-yellow-400'; }
                                                else if (percentage >= 40) { grade = 'D'; color = 'text-orange-400'; }

                                                return (
                                                    <tr key={m.id}>
                                                        <td className="py-3 px-4 text-gray-400 font-mono">{m.courses.code || '---'}</td>
                                                        <td className="py-3 px-4 text-white font-bold">{m.courses.title_en}</td>
                                                        <td className="py-3 text-center text-gray-400">{m.theory_marks}</td>
                                                        <td className="py-3 text-center text-gray-400">{m.practical_marks}</td>
                                                        <td className="py-3 text-right px-4 text-white font-bold">{m.total_marks}</td>
                                                        <td className={`py-3 text-center px-4 font-black ${color}`}>{grade}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    <div className="flex justify-end border-t border-white/10 pt-4">
                                        <div className="text-right">
                                            <div className="text-sm text-gray-400">Total Marks Obtained</div>
                                            <div className="text-3xl font-black text-white">{exam.totalObtained} <span className="text-lg text-gray-500 font-medium">/ {exam.grandTotal}</span></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
