'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Mail,
    Calendar,
    Shield,
    X,
    Lock,
    Bell,
    Plus,
    BookOpen,
    Users,
    Trash2,
    ExternalLink,
    Camera,
    Check,
    GraduationCap
} from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface Enrollment {
    session: {
        id: string;
        training_standard: {
            id: string;
            title: string;
        };
    };
    status: string;
}

interface Course {
    id: string;
    title_en: string;
}

interface UserDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserProfile;
    onUpdate: () => void;
}

export default function UserDetailModal({ isOpen, onClose, user, onUpdate }: UserDetailModalProps) {
    const { startImpersonation } = useAuth();
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [activeStudentDetails, setActiveStudentDetails] = useState<any>(null);
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Form States
    const [fullName, setFullName] = useState(user.full_name || '');
    const [email, setEmail] = useState(user.email || '');
    const [role, setRole] = useState<UserProfile['role']>(user.role || 'participant');
    const [status, setStatus] = useState<UserProfile['status']>(user.status || 'approved');

    useEffect(() => {
        if (isOpen) {
            fetchData();
            setFullName(user.full_name || '');
            setEmail(user.email || '');
            setRole(user.role || 'participant');
            setStatus(user.status || 'approved');
        }
    }, [isOpen, user.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: enrolls } = await supabase
                .from('session_participants')
                .select(`status, session:sessions(id, training_standard:training_standards(id, title))`)
                .eq('participant_id', user.id);

            const { data: courses } = await supabase
                .from('training_standards')
                .select('id, title_en:title')
                .eq('active', true);

            // Fetch Student Details if role is participant/trainee
            if (user.role === 'participant' || user.role === 'trainee') {
                const { data: details } = await supabase
                    .from('student_details')
                    .select(`
                        *,
                        batch:batches ( name, academic_sessions ( year ) )
                    `)
                    .eq('user_id', user.id)
                    .single();
                if (details) setActiveStudentDetails(details);
            }

            if (enrolls) setEnrollments(enrolls as any);
            if (courses) setAllCourses(courses);
        } catch (err) {
            console.error("Error fetching modal data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ full_name: fullName, email, role, status })
                .eq('id', user.id);

            if (error) throw error;
            alert("User updated successfully");
            onUpdate();
            onClose();
        } catch (err: any) {
            alert("Error updating user: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!confirm(`Are you sure you want to delete ${user.full_name}? This action cannot be undone.`)) return;
        
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const adminId = session?.user?.id;
            const token = session?.access_token;
            
            const res = await fetch(`/api/admin/manage-user?id=${user.id}${adminId ? `&adminId=${adminId}` : ''}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to delete user');
            }
            
            alert("User deleted successfully");
            onUpdate();
            onClose();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleActAs = () => {
        startImpersonation(user);
    };

    const handlePasswordReset = async () => {
        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) alert("Error: " + error.message);
        else alert("Password reset email sent to " + user.email);
    };

    const handleEnroll = async (courseId: string) => {
        const { data: sessions } = await supabase.from('sessions').select('id').eq('training_standard_id', courseId).eq('status', 'active').limit(1);
        if (sessions && sessions.length > 0) {
            const { error } = await supabase.from('session_participants').insert({
                participant_id: user.id,
                session_id: sessions[0].id,
                status: 'enrolled'
            });
            if (!error) fetchData();
        } else {
            alert("No active session found for this standard.");
        }
    };

    const handleUnenroll = async (sessionId: string) => {
        const { error } = await supabase.from('session_participants').delete().eq('participant_id', user.id).eq('session_id', sessionId);
        if (!error) fetchData();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]"
                    >
                        {/* Header Image/Banner Area */}
                        <div className="h-24 bg-gray-50 border-b border-gray-100" />

                        {/* Top Action Buttons (Over Banner) */}
                        <div className="absolute top-6 right-8 flex gap-3">
                            <button 
                                onClick={handleDeleteUser}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
                            >
                                <Trash2 className="w-4 h-4 text-gray-400" />
                                Delete
                            </button>
                            <button 
                                onClick={handleActAs}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
                            >
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                                Act as
                            </button>
                            <button onClick={onClose} className="ml-2 p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Profile Info Section */}
                        <div className="px-8 pb-6 -mt-12 flex items-end justify-between">
                            <div className="flex items-end gap-4">
                                <div className="relative">
                                    <div className="h-24 w-24 rounded-full border-4 border-white bg-blue-50 flex items-center justify-center text-blue-600 text-3xl font-bold shadow-lg overflow-hidden">
                                        {user.full_name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-1 border-2 border-white">
                                        <Check className="w-3 h-3 text-white stroke-[4]" />
                                    </div>
                                </div>
                                <div className="mb-2">
                                    <h2 className="text-2xl font-bold text-gray-900">{user.full_name}</h2>
                                    <p className="text-gray-500 text-sm font-medium">{user.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Scrollable Body Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-4 space-y-8">
                            
                            {/* General Information Section */}
                            <section className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">First name</label>
                                        <input 
                                            type="text" 
                                            value={fullName.split(' ')[0]} 
                                            onChange={(e) => setFullName(e.target.value + ' ' + (fullName.split(' ')[1] || ''))}
                                            className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Last name</label>
                                        <input 
                                            type="text" 
                                            value={fullName.split(' ').slice(1).join(' ')} 
                                            onChange={(e) => setFullName((fullName.split(' ')[0] || '') + ' ' + e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Email address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input 
                                            type="email" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Account Role</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as UserProfile['role'])}
                                        className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none shadow-sm appearance-none"
                                    >
                                        <option value="participant">Trainee</option>
                                        <option value="instructor">Trainer</option>
                                        <option value="ernam_admin">Admin</option>
                                    </select>
                                </div>
                            </section>

                            {/* Academic Profile (For Trainees) */}
                            {activeStudentDetails && (
                                <section className="pt-8 border-t border-gray-100 space-y-4">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4 text-gray-400" />
                                        Academic Profile
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Roll Number</p>
                                            <p className="text-sm font-bold text-gray-700">{activeStudentDetails.roll_number || 'N/A'}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Registration No</p>
                                            <p className="text-sm font-bold text-gray-700">{activeStudentDetails.registration_number || 'N/A'}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 col-span-2">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Batch</p>
                                            <p className="text-sm font-bold text-gray-700">
                                                {activeStudentDetails.batch ? `${activeStudentDetails.batch.name} (${activeStudentDetails.batch.academic_sessions?.year})` : "Unassigned"}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Classes & Enrollments Section */}
                            <section className="pt-8 border-t border-gray-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-gray-400" />
                                        Active Enrollments
                                    </h3>
                                    <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-widest">{enrollments.length} Courses</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {enrollments.length === 0 ? (
                                        <p className="text-xs text-gray-500 italic">No active enrollments.</p>
                                    ) : (
                                        enrollments.map((en) => (
                                            <div key={en.session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                                                <span className="text-sm font-semibold text-gray-700">{en.session.training_standard.title}</span>
                                                <button 
                                                    onClick={() => handleUnenroll(en.session.id)}
                                                    className="text-xs font-bold text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                                                >
                                                    Unenroll
                                                </button>
                                            </div>
                                        ))
                                    )}
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {allCourses.filter(c => !enrollments.some(en => (en.session as any)?.training_standard?.id === c.id)).slice(0, 3).map((course) => (
                                            <button
                                                key={course.id}
                                                onClick={() => handleEnroll(course.id)}
                                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all flex items-center gap-1.5 shadow-sm"
                                            >
                                                <Plus className="w-3 h-3" /> {course.title_en}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* Security & Access Section */}
                            <section className="pt-8 border-t border-gray-100 space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-gray-400" />
                                    Security & Access
                                </h3>
                                <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-orange-900">Password reset</p>
                                        <p className="text-xs text-orange-700">The user will receive an email to create a new password.</p>
                                    </div>
                                    <button 
                                        onClick={handlePasswordReset}
                                        className="px-4 py-2 bg-white border border-orange-200 text-orange-700 rounded-lg text-xs font-bold hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all shadow-sm"
                                    >
                                        Reset Password
                                    </button>
                                </div>
                            </section>

                        </div>

                        {/* Footer Section */}
                        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <button 
                                onClick={handleDeleteUser}
                                className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete user
                            </button>
                            <div className="flex gap-3">
                                <button 
                                    onClick={onClose}
                                    className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSaveChanges}
                                    disabled={loading}
                                    className="px-5 py-2.5 bg-gray-900 border border-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save changes'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
