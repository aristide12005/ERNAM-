'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    ArrowLeft,
    FileText,
    Download,
    CheckCircle,
    XCircle,
    Save,
    Star,
    MessageCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface GradingProps {
    submissionId: string;
    onBack: () => void;
}

export default function Grading({ submissionId, onBack }: GradingProps) {
    const [submission, setSubmission] = useState<any>(null);
    const [score, setScore] = useState<number>(0);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('submissions')
            .select('*, assignments(title, max_score), profiles:student_id(full_name)')
            .eq('id', submissionId)
            .single();

        if (data) {
            setSubmission(data);
            setScore(data.score || 0);
            setFeedback(data.feedback || '');
        }
        setLoading(false);
    };

    useEffect(() => {
        if (submissionId) fetchData();
    }, [submissionId]);

    const handleSaveGrade = async () => {
        setSaving(true);
        // 1. Update submission status to 'graded'
        const { error: subError } = await supabase
            .from('submissions')
            .update({ status: 'graded' })
            .eq('id', submissionId);

        // 2. Upsert Grade
        const { error: gradeError } = await supabase
            .from('grades')
            .upsert({
                student_id: submission.student_id,
                assignment_id: submission.assignment_id,
                score: score,
                feedback: feedback
            }, { onConflict: 'assignment_id,student_id' });

        // 3. Notify student
        await supabase.from('notifications').insert({
            user_id: submission.student_id,
            title: 'New Grade Posted',
            message: `You received a grade for ${submission.assignments.title}.`,
            type: 'success',
            action_link: `/dashboard?view=grades`
        });

        setSaving(false);
        if (!gradeError) onBack();
    };

    if (loading) return <div className="p-20 text-center">Loading submission...</div>;
    if (!submission) return <div className="p-20 text-center text-red-500">Submission not found.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-card rounded-xl border border-border text-muted-foreground transition-all active:scale-95">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Grade Submission</h1>
                    <p className="text-sm text-muted-foreground font-medium">{submission.assignments.title} — {submission.profiles.full_name}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Submission Details & File */}
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase mb-4 tracking-widest">Submitted Work</h3>
                        <div className="p-4 bg-secondary/30 rounded-xl border border-border flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold text-foreground truncate">Assignment_File.{submission.file_url?.split('.').pop() || 'pdf'}</p>
                                    <p className="text-[10px] text-muted-foreground">SUBMITTED {new Date(submission.submitted_at).toLocaleString()}</p>
                                </div>
                            </div>
                            <a
                                href={submission.file_url}
                                target="_blank"
                                className="p-3 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                            >
                                <Download className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                            <Star className="h-4 w-4" /> Grading Rubric
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Ensure the student meets the technical requirements and provides clear explanations.
                            Max score for this assignment is <strong>{submission.assignments.max_score} pts</strong>.
                        </p>
                    </div>
                </div>

                {/* Right: Scoring and Feedback */}
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Assigned Score</label>
                            <div className="flex items-end gap-3">
                                <input
                                    type="number"
                                    max={submission.assignments.max_score}
                                    className="w-24 bg-background border border-border rounded-xl px-4 py-3 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 text-center"
                                    value={score}
                                    onChange={e => setScore(parseInt(e.target.value))}
                                />
                                <span className="text-xl font-bold text-muted-foreground mb-2">/ {submission.assignments.max_score}</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" /> Instructor Feedback
                            </label>
                            <textarea
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[150px] resize-none"
                                placeholder="Add comments, suggestions or corrections for the student..."
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={onBack}
                                className="flex-1 bg-secondary hover:bg-muted text-foreground font-bold py-3 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveGrade}
                                disabled={saving}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? 'Saving...' : <><Save className="h-5 w-5" /> Submit Grade</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
