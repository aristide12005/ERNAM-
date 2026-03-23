'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Trash2, Calendar, MessageSquare, Download, Users, ArrowLeft, Send, Video, FileText, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Material {
    id: string;
    title: string;
    file_url: string;
    document_type: string;
    created_at: string;
}

interface Student {
    id: string;
    full_name: string;
    email: string;
    attendance_status: string;
}

interface Comment {
    id: string;
    sender_id: string;
    message: string;
    created_at: string;
    sender?: { full_name: string };
}

interface ManageClassProps {
    courseId: string; // This is actually the Session ID
    userId: string;
    onBack: () => void;
}

export default function ManageClass({ courseId, userId, onBack }: ManageClassProps) {
    const [activeTab, setActiveTab] = useState<'materials' | 'participants' | 'discussion'>('materials');
    const [materials, setMaterials] = useState<Material[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [showConference, setShowConference] = useState(false);
    const [sessionTitle, setSessionTitle] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Session Info (via standard)
            const { data: session } = await supabase
                .from('sessions')
                .select('id, training_standard:training_standards(title)')
                .eq('id', courseId)
                .single();
            if (session) setSessionTitle((session.training_standard as any)?.title || 'Training Session');

            // 2. Materials (Documents)
            const { data: docs } = await supabase
                .from('documents')
                .select('*')
                .eq('session_id', courseId);
            if (docs) setMaterials(docs as any);

            // 3. Participants
            const { data: participants } = await supabase
                .from('session_participants')
                .select('participant_id, attendance_status, users(full_name, email)')
                .eq('session_id', courseId);

            if (participants) {
                const studentList = participants.map((p: any) => ({
                    id: p.participant_id,
                    full_name: p.users?.full_name || 'Unknown',
                    email: p.users?.email || 'N/A',
                    attendance_status: p.attendance_status
                }));
                setStudents(studentList);
            }

            // 4. Discussion (Messages)
            const { data: msgs } = await supabase
                .from('messages')
                .select('*, sender:users(full_name)')
                .eq('session_id', courseId)
                .order('created_at', { ascending: true });
            if (msgs) setComments(msgs as any);

        } catch (err) {
            console.error("Error fetching class data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) fetchData();
    }, [courseId]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `${courseId}/${Date.now()}.${fileExt}`;

        try {
            const { data, error: uploadError } = await supabase.storage
                .from('resources')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: publicUrl } = supabase.storage.from('resources').getPublicUrl(fileName);

            const { error: insertError } = await supabase.from('documents').insert({
                session_id: courseId,
                title: file.name,
                file_url: publicUrl.publicUrl,
                document_type: 'material',
                uploaded_by: userId
            });

            if (insertError) throw insertError;
            fetchData();
        } catch (err: any) {
            alert(`Action failed: ${err.message}`);
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        try {
            const { error } = await supabase.from('messages').insert({
                session_id: courseId,
                sender_id: userId,
                message: newComment
            });
            if (error) throw error;
            setNewComment('');
            fetchData();
        } catch (err: any) {
            alert("Failed to send message: " + err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (showConference) {
        return (
            <VideoConference
                courseId={courseId}
                userId={userId}
                userName="Trainer"
                onClose={() => setShowConference(false)}
            />
        );
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-card rounded-xl border border-border text-muted-foreground transition-all active:scale-95">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight">{sessionTitle}</h1>
                        <p className="text-muted-foreground text-sm">Managing studio operational resources</p>
                    </div>
                </div>
                <button
                    onClick={() => alert("Live Video Session coming soon!")}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                >
                    <Video className="h-4 w-4" />
                    Join Live Class
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-card border border-border rounded-xl w-fit">
                {[
                    { id: 'materials', label: 'Materials', icon: FileText },
                    { id: 'participants', label: 'Participants', icon: Users },
                    { id: 'discussion', label: 'Discussion', icon: MessageSquare },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                            : 'text-muted-foreground hover:bg-muted'
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[400px]">
                {activeTab === 'materials' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-foreground">Resource Center</h2>
                            <label className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-2">
                                <Upload className="h-4 w-4" /> Upload Material
                                <input type="file" className="hidden" onChange={handleUpload} />
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {materials.map((file) => (
                                <div key={file.id} className="bg-card border border-border p-4 rounded-xl flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-secondary rounded-lg flex items-center justify-center text-primary">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground line-clamp-1">{file.title}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{file.document_type || 'File'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href={file.file_url} target="_blank" className="p-2 hover:bg-muted rounded-lg text-primary">
                                            <Download className="h-4 w-4" />
                                        </a>
                                        <button className="p-2 hover:bg-red-500/10 rounded-lg text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {materials.length === 0 && (
                                <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-xl">
                                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                                    <p className="text-muted-foreground">No documents uploaded for this session.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'participants' && (
                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-secondary/30 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Student Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right text-transparent">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {students.map((student) => (
                                    <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                    {student.full_name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-foreground">{student.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{student.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                student.attendance_status === 'attended' ? 'bg-emerald-500/10 text-emerald-500' :
                                                student.attendance_status === 'absent' ? 'bg-red-500/10 text-red-500' :
                                                'bg-blue-500/10 text-blue-500'
                                            }`}>
                                                {student.attendance_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-xs font-bold text-primary hover:underline">View Progress</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'discussion' && (
                    <div className="flex flex-col h-[500px] bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="flex-1 p-6 overflow-y-auto space-y-6">
                            {comments.map((comment) => (
                                <div key={comment.id} className={`flex gap-4 ${comment.sender_id === userId ? 'flex-row-reverse' : ''}`}>
                                    <div className="h-8 w-8 rounded-full bg-secondary flex-shrink-0" />
                                    <div className={`max-w-[80%] ${comment.sender_id === userId ? 'items-end' : 'items-start'} flex flex-col`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold text-muted-foreground">{comment.sender?.full_name || 'User'}</span>
                                            <span className="text-[10px] text-muted-foreground/50">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className={`p-4 rounded-2xl text-sm ${comment.sender_id === userId
                                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                                            : 'bg-secondary text-foreground rounded-tl-none'
                                            }`}>
                                            {comment.message}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                    <MessageSquare className="h-12 w-12 mb-2" />
                                    <p className="text-sm">Start a conversation with your students.</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-border bg-secondary/30 flex gap-2">
                            <input
                                type="text"
                                placeholder="Broadcast an alert or message..."
                                className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                            />
                            <button
                                onClick={handlePostComment}
                                className="p-2 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
