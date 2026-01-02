'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Trash2, AlertCircle, Calendar, Plus, MessageSquare, Download, Settings, Users, ArrowLeft, Send, Paperclip, Video, FileText, Upload } from 'lucide-react';
import dynamic from 'next/dynamic';

const VideoConference = dynamic(() => import('@/components/conference/VideoConference'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black flex items-center justify-center text-white">Loading Conference...</div>
});
import { motion, AnimatePresence } from 'framer-motion';

interface Material {
    id: string;
    title: string;
    file_url: string;
    file_type: string;
    created_at: string;
}

interface Student {
    id: string;
    full_name: string;
    email: string;
}

interface Comment {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles?: { full_name: string };
}

interface ManageClassProps {
    courseId: string;
    userId: string;
    onBack: () => void;
}

interface EnrollmentRequest {
    id: string;
    requester_id: string;
    status: string;
    created_at: string;
    profiles?: {
        full_name: string;
        email: string;
    };
}

export default function ManageClass({ courseId, userId, onBack }: ManageClassProps) {
    const [activeTab, setActiveTab] = useState<'materials' | 'participants' | 'discussion'>('materials');
    const [materials, setMaterials] = useState<Material[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [showConference, setShowConference] = useState(false);
    const [courseTitle, setCourseTitle] = useState('');

    const fetchData = async () => {
        setLoading(true);
        // Course Info
        const { data: course } = await supabase.from('courses').select('title_en').eq('id', courseId).single();
        if (course) setCourseTitle(course.title_en);

        // Materials
        const { data: mats } = await supabase.from('course_materials').select('*').eq('course_id', courseId);
        if (mats) setMaterials(mats);

        // Enrollments -> Profiles
        const { data: enrolls } = await supabase
            .from('enrollments')
            .select('user_id, profiles(id, full_name, email)')
            .eq('course_id', courseId);

        if (enrolls) {
            const studentList = enrolls.map((e: any) => ({
                id: e.profiles.id,
                full_name: e.profiles.full_name,
                email: e.profiles.email
            }));
            setStudents(studentList);
        }

        // Pending Requests
        const { data: reqs } = await supabase
            .from('enrollment_requests')
            .select('*, profiles(full_name, email)')
            .eq('course_id', courseId)
            .eq('status', 'pending');

        if (reqs) {
            setRequests(reqs as any);
        }

        // Discussion
        const { data: comms } = await supabase
            .from('course_comments')
            .select('*, profiles(full_name)')
            .eq('course_id', courseId)
            .order('created_at', { ascending: true });
        if (comms) setComments(comms as any);

        setLoading(false);
    };

    useEffect(() => {
        if (courseId) fetchData();
    }, [courseId]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `${courseId}/${Date.now()}.${fileExt}`;

        const { data, error: uploadError } = await supabase.storage
            .from('resources')
            .upload(fileName, file);

        if (uploadError) {
            console.error('Upload Error:', uploadError);
            alert(`Upload failed: ${uploadError.message}`);
            return;
        }

        if (data) {
            const { data: publicUrl } = supabase.storage.from('resources').getPublicUrl(fileName);

            const { error: insertError } = await supabase.from('course_materials').insert({
                course_id: courseId,
                title: file.name,
                file_url: publicUrl.publicUrl,
                file_type: fileExt
            });
            if (insertError) {
                console.error('Insert Error:', insertError);
                alert(`Saving material info failed: ${insertError.message}`);
            }
            fetchData();
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        const { error } = await supabase.from('course_comments').insert({
            course_id: courseId,
            user_id: userId,
            content: newComment
        });
        if (!error) {
            setNewComment('');
            fetchData();
        }
    };

    const handleApproveRequest = async (requestId: string) => {
        try {
            const { error } = await supabase.rpc('approve_enrollment', { request_id: requestId });
            if (error) throw error;
            fetchData();
        } catch (error: any) {
            console.error('Approval Error:', error);
            if (error.code === '42703' || error.message?.includes('instructor_id')) {
                alert(`DB Error ${error.code}: ${error.message}\n\nFIX REQUIRED: Run "web/align_db_to_schema.sql" in Supabase to remove legacy columns.`);
            } else {
                alert(`Approval failed: ${error.message}`);
            }
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        try {
            const { error } = await supabase.rpc('reject_enrollment', { request_id: requestId });
            if (error) throw error;
            fetchData();
        } catch (error: any) {
            console.error('Rejection Error:', error);
            alert(`Rejection failed: ${error.message}`);
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
                userName={requests.find(r => r.requester_id === userId)?.profiles?.full_name || 'Instructor'}
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
                        <h1 className="text-2xl font-black text-foreground tracking-tight">Manage Class</h1>
                        <p className="text-muted-foreground text-sm">Manage materials, students, and discussions</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowConference(true)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-red-500/20 animate-pulse"
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
                            <h2 className="text-lg font-bold text-foreground">Course Repository</h2>
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
                                            <p className="text-[10px] text-muted-foreground uppercase">{file.file_type || 'File'}</p>
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
                                    <p className="text-muted-foreground">No documents uploaded for this class.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'participants' && (
                    <div className="space-y-6">
                        {/* PENDING REQUESTS SECTION */}
                        {requests.length > 0 && (
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-amber-500/20 bg-amber-500/10">
                                    <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wide flex items-center gap-2">
                                        <Users className="h-4 w-4" /> Pending Requests ({requests.length})
                                    </h3>
                                </div>
                                <table className="w-full text-left">
                                    <tbody className="divide-y divide-amber-500/10">
                                        {requests.map((req) => (
                                            <tr key={req.id} className="hover:bg-amber-500/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-xs">
                                                            {req.profiles?.full_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-foreground">{req.profiles?.full_name}</div>
                                                            <div className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => handleApproveRequest(req.id)}
                                                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectRequest(req.id)}
                                                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                                    >
                                                        Reject
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* EXISTING STUDENT LIST */}
                        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-secondary/30 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Student Name</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
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
                                                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold">Enrolled</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-xs font-bold text-primary hover:underline">View Progress</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {students.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-20 text-center">
                                                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                                                <p className="text-muted-foreground">No students enrolled yet.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'discussion' && (
                    <div className="flex flex-col h-[500px] bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="flex-1 p-6 overflow-y-auto space-y-6">
                            {comments.map((comment) => (
                                <div key={comment.id} className={`flex gap-4 ${comment.user_id === userId ? 'flex-row-reverse' : ''}`}>
                                    <div className="h-8 w-8 rounded-full bg-secondary flex-shrink-0" />
                                    <div className={`max-w-[80%] ${comment.user_id === userId ? 'items-end' : 'items-start'} flex flex-col`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold text-muted-foreground">{comment.profiles?.full_name || 'User'}</span>
                                            <span className="text-[10px] text-muted-foreground/50">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className={`p-4 rounded-2xl text-sm ${comment.user_id === userId
                                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                                            : 'bg-secondary text-foreground rounded-tl-none'
                                            }`}>
                                            {comment.content}
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
                                placeholder="Write a message..."
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
