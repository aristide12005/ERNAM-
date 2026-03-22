"use client";

import React, { useEffect, useState } from 'react';
import { Plus, ArrowLeft, Save, CheckCircle2 } from 'lucide-react';

export default function Gradebook({ instructorId }: { instructorId?: string, onGradeNow?: any }) {
    const [viewMode, setViewMode] = useState<'list' | 'marking'>('list');
    const [exams, setExams] = useState<any[]>([
        { id: '1', title: 'Correction results 1', maxScore: 100 },
        { id: '2', title: 'Correction results 2', maxScore: 50 },
        { id: '3', title: 'Correction results 3', maxScore: 20 },
    ]);
    
    const [selectedExamId, setSelectedExamId] = useState<string>('');
    const [students, setStudents] = useState<any[]>([]);
    const [marks, setMarks] = useState<Record<string, number | string>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (viewMode === 'marking' && selectedExamId && selectedExamId !== 'new') {
             const mockStudents = [
                 { id: 's1', name: 'Hubert Human' },
                 { id: 's2', name: 'Alice Smith' },
                 { id: 's3', name: 'Bob Johnson' }
             ];
             setStudents(mockStudents);
        }
    }, [viewMode, selectedExamId]);

    const handleSaveMarks = () => {
        setSaving(true);
        setTimeout(() => {
            alert('Marks securely saved to the Database!');
            setSaving(false);
            setViewMode('list');
        }, 800);
    };

    if (viewMode === 'marking') {
        const activeExam = exams.find(e => e.id === selectedExamId) || { maxScore: 100 };
        return (
            <div className="flex flex-col h-[calc(100vh-140px)] gap-6 p-2 max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-4 border-b border-gray-200 dark:border-white/10 pb-4">
                    <button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Exam marking progress</h1>
                        <p className="text-muted-foreground mt-1 text-sm font-medium">After creation. Then get all list of user</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-card border border-border rounded-3xl shadow-lg p-8 flex-1 flex flex-col">
                    <div className="mb-8 max-w-md">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Course / Exam title /</label>
                        <select 
                            value={selectedExamId}
                            onChange={(e) => setSelectedExamId(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        >
                            <option value="" disabled>Select an exam to mark...</option>
                            <option value="new">+ Create New Exam</option>
                            {exams.map(e => (
                                <option key={e.id} value={e.id}>{e.title}</option>
                            ))}
                        </select>
                    </div>

                    {selectedExamId && selectedExamId !== 'new' ? (
                        <div className="flex-1 flex flex-col">
                            <table className="w-full text-left">
                                <thead className="border-b border-gray-200 dark:border-white/10">
                                    <tr className="text-gray-500 dark:text-gray-400">
                                        <th className="py-4 font-semibold uppercase tracking-wider text-xs w-2/3 text-blue-900 dark:text-blue-300">Names</th>
                                        <th className="py-4 font-semibold uppercase tracking-wider text-xs w-1/3 text-center text-blue-900 dark:text-blue-300">Marks / {activeExam.maxScore}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {students.map(s => (
                                        <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="py-4 font-bold text-gray-900 dark:text-white">{s.name}</td>
                                            <td className="py-4 flex justify-center">
                                                <input 
                                                    type="number"
                                                    value={marks[s.id] || ''}
                                                    onChange={e => setMarks({...marks, [s.id]: e.target.value})}
                                                    placeholder="0"
                                                    className="w-24 text-center bg-transparent border-b-2 justify-center border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none font-bold text-lg px-2 py-1"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="mt-8 flex justify-end">
                                <button 
                                    onClick={handleSaveMarks}
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-3 disabled:opacity-50"
                                >
                                    {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                                    {saving ? 'SAVING...' : 'SAVE EXAM RESULTS'}
                                </button>
                            </div>
                        </div>
                    ) : selectedExamId === 'new' ? (
                         <div className="p-10 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center">
                             <h3 className="text-xl font-bold mb-2">Create New Exam</h3>
                             <p>Create the exam record first to fetch the user compilation list.</p>
                             <button className="mt-6 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold px-6 py-2 rounded-xl border border-blue-200 dark:border-blue-800">
                                 Generate Draft Frame
                             </button>
                         </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 font-medium border-2 border-dashed border-gray-200 dark:border-white/5 rounded-2xl">
                            Please select an exam to start marking progress
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-6 p-2 max-w-4xl mx-auto w-full">
            <div className="flex justify-between items-end border-b border-gray-200 dark:border-white/10 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Exam Results (Marks)</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Historical records of your graded activities.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-card border border-border rounded-3xl shadow-lg p-8">
                <div className="space-y-4">
                    {exams.map(e => (
                        <div key={e.id} className="group relative flex items-center justify-between bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 p-5 rounded-2xl shadow-sm transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer" onClick={() => { setSelectedExamId(e.id); setViewMode('marking'); }}>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{e.title}</h3>
                                    <p className="text-sm text-gray-500">Max Score: {e.maxScore}</p>
                                </div>
                            </div>
                            <button className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-white/10 text-sm font-bold shadow-sm transition-opacity">
                                View / Edit
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-center">
                    <button 
                        onClick={() => { setSelectedExamId(''); setViewMode('marking'); }}
                        className="bg-transparent border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 text-gray-500 font-bold px-10 py-5 rounded-2xl transition-all flex items-center gap-3 w-full justify-center group"
                    >
                        <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="text-lg">Add results +</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
