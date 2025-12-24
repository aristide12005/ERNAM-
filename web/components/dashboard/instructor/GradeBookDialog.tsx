import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, Plus, FileText, Download, TrendingUp, Users, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Assignment {
    id: string;
    title: string;
    course_id: string;
    max_score: number;
    due_date: string;
    course?: { title: string };
}

interface GradeBox {
    [key: string]: number; // studentId_assignmentId -> score
}

export function GradeBookDialog({ isOpen, onClose, instructorId }: { isOpen: boolean; onClose: () => void; instructorId: string }) {
    const [activeTab, setActiveTab] = useState<'assignments' | 'grading' | 'analytics'>('grading');
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
    const [grades, setGrades] = useState<GradeBox>({});
    const [courses, setCourses] = useState<any[]>([]);

    // New Assignment State
    const [newAssign, setNewAssign] = useState({ title: '', course_id: '', max_score: 100, due_date: '' });

    useEffect(() => {
        if (isOpen) {
            fetchAllData();
        }
    }, [isOpen]);

    const fetchAllData = async () => {
        // 1. Fetch Courses for this Instructor (Assuming instructor is teaching all courses for now for simplicity, or we filter)
        const { data: courseData } = await supabase.from('courses').select('id, title');
        if (courseData) setCourses(courseData);

        // 2. Fetch Assignments
        const { data: assignData } = await supabase.from('assignments').select('*, course:courses(title)');
        if (assignData) setAssignments(assignData);

        // 3. Fetch Enrolled Students (Active)
        const { data: studData } = await supabase.from('enrollments')
            .select('user_id, status, student:profiles(id, full_name)')
            .eq('status', 'active');
        if (studData) setEnrolledStudents(studData);

        // 4. Fetch Grades
        const { data: gradeData } = await supabase.from('grades').select('*');
        if (gradeData) {
            const gradeMap: GradeBox = {};
            gradeData.forEach((g: any) => {
                gradeMap[`${g.student_id}_${g.assignment_id}`] = g.score;
            });
            setGrades(gradeMap);
        }
    };

    const handleCreateAssignment = async () => {
        if (!newAssign.title || !newAssign.course_id) return alert('Please fill required fields');
        const { error } = await supabase.from('assignments').insert(newAssign);
        if (error) alert(error.message);
        else {
            alert('Assignment Created!');
            fetchAllData();
            setNewAssign({ title: '', course_id: '', max_score: 100, due_date: '' });
        }
    };

    const handleGradeChange = (studentId: string, assignId: string, score: number) => {
        setGrades(prev => ({ ...prev, [`${studentId}_${assignId}`]: score }));
    };

    const saveGrades = async () => {
        // Upsert grades
        const updates = [];
        for (const key in grades) {
            const [studentId, assignId] = key.split('_');
            updates.push({
                student_id: studentId,
                assignment_id: assignId,
                score: grades[key]
            });
        }
        // supabase upsert needs conflict support or manual iterate
        // Simpler for prototype: Iterate and upsert
        for (const up of updates) {
            await supabase.from('grades').upsert(up, { onConflict: 'assignment_id,student_id' });
        }
        alert('Grades Saved Successfully!');
    };

    // Export Logic
    const exportExcel = () => {
        const wsBox = [];
        wsBox.push(['Student', ...assignments.map(a => a.title)]);
        enrolledStudents.forEach(s => {
            const row = [s.student.full_name];
            assignments.forEach(a => {
                row.push(grades[`${s.student.id}_${a.id}`] || '-');
            });
            wsBox.push(row);
        });
        const ws = XLSX.utils.aoa_to_sheet(wsBox);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Grades");
        XLSX.writeFile(wb, "Class_Grades.xlsx");
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text("Class Grade Report", 14, 15);

        const tableBody = enrolledStudents.map(s => {
            const row = [s.student.full_name];
            assignments.forEach(a => {
                row.push(grades[`${s.student.id}_${a.id}`]?.toString() || '-');
            });
            return row;
        });

        (doc as any).autoTable({
            head: [['Student', ...assignments.map(a => a.title)]],
            body: tableBody,
            startY: 20,
        });
        doc.save("Grade_Report.pdf");
    };

    // Analytics Data Prep
    const passFailData = assignments.map(a => {
        let pass = 0, fail = 0;
        enrolledStudents.forEach(s => {
            const score = grades[`${s.student.id}_${a.id}`];
            if (score !== undefined) {
                if (score >= 50) pass++; else fail++;
            }
        });
        return { name: a.title, Pass: pass, Fail: fail };
    });

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="bg-[#1a1d24] w-full max-w-5xl h-[85vh] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white">Gradebook & Assignments</h2>
                        <p className="text-xs text-muted-foreground">Manage ongoing evaluation</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                    <button onClick={() => setActiveTab('assignments')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'assignments' ? 'text-blue-400 border-b-2 border-blue-400 bg-white/5' : 'text-gray-400 hover:text-white'}`}>
                        <FileText className="h-4 w-4" /> Assignments
                    </button>
                    <button onClick={() => setActiveTab('grading')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'grading' ? 'text-amber-400 border-b-2 border-amber-400 bg-white/5' : 'text-gray-400 hover:text-white'}`}>
                        <Users className="h-4 w-4" /> Grading Sheet
                    </button>
                    <button onClick={() => setActiveTab('analytics')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'analytics' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-white/5' : 'text-gray-400 hover:text-white'}`}>
                        <TrendingUp className="h-4 w-4" /> Analytics
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-black/20">
                    {/* ASSIGNMENTS TAB */}
                    {activeTab === 'assignments' && (
                        <div className="space-y-6">
                            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                                <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Create New Assignment</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <input placeholder="Assignment Title" className="bg-black/40 border border-white/10 p-2 rounded text-sm text-white"
                                        value={newAssign.title} onChange={e => setNewAssign({ ...newAssign, title: e.target.value })} />
                                    <select className="bg-black/40 border border-white/10 p-2 rounded text-sm text-white"
                                        value={newAssign.course_id} onChange={e => setNewAssign({ ...newAssign, course_id: e.target.value })}>
                                        <option value="">Select Course...</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </select>
                                    <input type="number" placeholder="Max Score" className="bg-black/40 border border-white/10 p-2 rounded text-sm text-white"
                                        value={newAssign.max_score} onChange={e => setNewAssign({ ...newAssign, max_score: parseInt(e.target.value) })} />
                                    <button onClick={handleCreateAssignment} className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded flex items-center justify-center gap-2 text-sm">
                                        <Plus className="h-4 w-4" /> Create
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {assignments.map(a => (
                                    <div key={a.id} className="bg-secondary/40 p-4 rounded-lg border border-white/5">
                                        <h4 className="font-bold text-white">{a.title}</h4>
                                        <p className="text-xs text-muted-foreground">{a.course?.title}</p>
                                        <div className="mt-2 text-xs bg-white/10 inline-block px-2 py-1 rounded text-gray-300">Max: {a.max_score} pts</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* GRADING TAB */}
                    {activeTab === 'grading' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex gap-2">
                                    <button onClick={exportExcel} className="text-xs bg-green-700/50 hover:bg-green-600 text-green-100 border border-green-500/50 px-3 py-1.5 rounded flex items-center gap-2">
                                        <Download className="h-3 w-3" /> Export Excel
                                    </button>
                                    <button onClick={exportPDF} className="text-xs bg-red-700/50 hover:bg-red-600 text-red-100 border border-red-500/50 px-3 py-1.5 rounded flex items-center gap-2">
                                        <Download className="h-3 w-3" /> Export PDF
                                    </button>
                                </div>
                                <button onClick={saveGrades} className="bg-primary hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20">
                                    <Save className="h-4 w-4" /> Save Grades
                                </button>
                            </div>

                            <div className="overflow-x-auto border border-white/10 rounded-lg">
                                <table className="w-full text-sm text-left text-gray-300">
                                    <thead className="bg-white/5 text-xs uppercase font-bold text-gray-400">
                                        <tr>
                                            <th className="px-4 py-3 border-b border-white/10 sticky left-0 bg-[#252830]">Student</th>
                                            {assignments.map(a => (
                                                <th key={a.id} className="px-4 py-3 border-b border-white/10 min-w-[100px]">{a.title}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {enrolledStudents.map(s => (
                                            <tr key={s.user_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 font-bold text-white sticky left-0 bg-[#1a1d24] border-r border-white/10">{s.student.full_name}</td>
                                                {assignments.map(a => (
                                                    <td key={a.id} className="px-4 py-2 border-r border-white/5">
                                                        <input
                                                            type="number"
                                                            className="w-16 bg-black/30 border border-white/10 rounded px-2 py-1 text-center text-white focus:border-blue-500 focus:outline-none focus:bg-blue-500/10 transition-all"
                                                            value={grades[`${s.student.id}_${a.id}`] || ''}
                                                            onChange={(e) => handleGradeChange(s.student.id, a.id, parseInt(e.target.value))}
                                                            max={a.max_score}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ANALYTICS TAB */}
                    {activeTab === 'analytics' && (
                        <div className="h-full flex flex-col">
                            <h3 className="text-lg font-bold text-white mb-6">Performance Distribution</h3>
                            <div className="h-[400px] w-full bg-white/[0.02] rounded-xl border border-white/5 p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={passFailData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                        <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Bar dataKey="Pass" fill="#10b981" radius={[4, 4, 0, 0]} name="Passing (>50)" />
                                        <Bar dataKey="Fail" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failing (<50)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
