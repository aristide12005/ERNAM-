/* eslint-disable react-hooks/exhaustive-deps, react-hooks/rules-of-hooks, @typescript-eslint/ban-ts-comment, react/no-unescaped-entities, react-hooks/immutability, @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    CheckCircle,
    XCircle,
    Shield,
    User,
    Mail,
    Calendar,
    ChevronDown,
    Loader2,
    Eye,
    Trash2,
    Lock,
    Bell,
    Plus,
    X,
    TrendingUp,
    BookOpen,
    ArrowRight,
    MoreHorizontal,
    UserPlus,
    UserCheck,
    UserX,
    UserCog,
    Ghost
} from 'lucide-react';
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from '@/lib/utils';

interface Profile {
    id: string;
    full_name: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
}

interface Course {
    id: string;
    title_en: string;
}

interface Enrollment {
    course: Course;
    status: string;
}

export default function UserManagement() {
    const { startImpersonation, profile: adminProfile } = useAuth();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // UI States
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const fetchProfiles = async () => {
        setLoading(true);
        const query = supabase
            .from('users')
            .select(`
                id, 
                full_name, 
                email, 
                role, 
                status, 
                created_at
            `)
            .order('created_at', { ascending: false });

        const { data, error } = await query;
        if (!error && data) {
            setProfiles(data as any);
        }
        setLoading(false);
    };

    // Realtime Subscription with Ref guard
    const channelRef = useRef<any>(null);

    useEffect(() => {
        fetchProfiles();

        if (!channelRef.current) {
            channelRef.current = supabase
                .channel('users-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'users'
                    },
                    (payload) => {
                        console.log('User change detected:', payload);
                        fetchProfiles();
                    }
                )
                .subscribe();
        }

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, []);

    const handleAction = async (id: string, action: 'approve' | 'reject' | 'delete') => {
        if (action === 'delete') {
            const confirmed = window.confirm("Are you sure you want to permanently delete this user?");
            if (!confirmed) return;
            const { error } = await supabase.from('users').delete().eq('id', id);
            if (!error) fetchProfiles();
            else alert("Error deleting user: " + error.message);
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const rpcName = action === 'approve' ? 'approve_user_transaction' : 'reject_user_transaction';

            const { error } = await supabase.rpc(rpcName, {
                target_user_id: id,
                acting_admin_id: user.id
            });

            if (error) {
                console.error(`Error executing ${rpcName}:`, error);
                const errorMsg = action === 'approve' ? "Failed to approve user. " : "Failed to reject user. ";
                alert(`${errorMsg} ${error.message}`);
            } else {
                fetchProfiles();
            }
        }
    };

    const filteredProfiles = profiles.filter(p => {
        const matchesSearch = p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || p.role === filterRole;
        const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
        return matchesSearch && matchesRole && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative md:col-span-3">
                        <input
                            type="text"
                            placeholder="Search by name, email, or role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#F8FAFC] border border-slate-100 rounded-[20px] py-4 pl-14 pr-6 text-sm font-bold tracking-tight focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-900 placeholder:text-slate-300 shadow-sm transition-all"
                        />
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    </div>
                    <button className="bg-white border border-slate-100 rounded-[20px] px-6 flex items-center justify-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                        <Filter className="h-4 w-4" /> Filter Range
                    </button>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="bg-white border border-gray-100 rounded-[16px] py-3.5 px-6 text-xs font-black uppercase tracking-widest focus:outline-none text-black cursor-pointer shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="trainer">Trainer</option>
                        <option value="trainee">Trainee</option>
                    </select>

                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="flex items-center gap-2 px-8 py-4 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-[16px] transition-all hover:bg-gray-800 shadow-xl shadow-black/10 active:scale-95"
                    >
                        <Plus className="h-4 w-4" /> Add User
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="text-[#8E9296] text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                                <th className="px-8 py-5 font-black">User</th>
                                <th className="px-8 py-5 font-black">Account Role</th>
                                <th className="px-8 py-5 font-black">Status</th>
                                <th className="px-8 py-5 font-black">Join Date</th>
                                <th className="px-8 py-5 font-black text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            <AnimatePresence>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-16 text-center">
                                            <Loader2 className="h-8 w-8 text-black animate-spin mx-auto mb-2" />
                                            <p className="text-gray-400 font-bold italic text-xs uppercase tracking-widest">Syncing with directory...</p>
                                        </td>
                                    </tr>
                                ) : filteredProfiles.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-16 text-center text-gray-400 font-bold italic text-xs uppercase tracking-widest">
                                            No users found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProfiles.map((p) => (
                                        <motion.tr
                                            key={p.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="hover:bg-gray-50/50 transition-colors group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-black font-black text-xs border border-gray-200 shadow-sm">
                                                        {p.full_name?.charAt(0) || <User className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <div className="text-black font-bold tracking-tight">{p.full_name}</div>
                                                        <div className="text-[11px] text-[#8E9296] font-medium">
                                                            {p.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="flex items-center gap-2 text-[#8E9296] font-bold text-xs">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", p.role === 'admin' ? 'bg-black' : p.role === 'trainer' ? 'bg-blue-500' : 'bg-gray-400')} />
                                                    <span className="capitalize">{p.role}</span>
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight",
                                                    p.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                                    p.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                                    'bg-red-100 text-red-600'
                                                )}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-[#8E9296] font-bold text-xs tracking-tight">
                                                {new Date(p.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => { setSelectedUser(p); setIsDetailModalOpen(true); }}
                                                        className="p-2.5 bg-slate-50 border border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 rounded-xl transition-all active:scale-95"
                                                        title="Global Profile Info"
                                                    >
                                                        <User className="h-4 w-4" />
                                                    </button>

                                                    {adminProfile?.role === 'admin' && p.id !== adminProfile?.id && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                startImpersonation(p);
                                                            }}
                                                            className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                                            title="Act As This User"
                                                        >
                                                            <Ghost className="h-4 w-4" />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => { setSelectedUser(p); setIsDetailModalOpen(true); }}
                                                        className="px-4 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-lg active:scale-95"
                                                    >
                                                        Manage
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <UserDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    user={selectedUser}
                    onUpdate={fetchProfiles}
                />
            )}

            <CreateUserModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={() => { fetchProfiles(); }}
            />
        </div>
    );
}

function UserDetailModal({ isOpen, onClose, user, onUpdate }: { isOpen: boolean, onClose: () => void, user: Profile, onUpdate: () => void }) {
    const [activeTab, setActiveTab] = useState<'profile' | 'enrollments' | 'security' | 'notify'>('profile');
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [activeStudentDetails, setActiveStudentDetails] = useState<any>(null); // State for student details
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);

    // Notification state
    const [notifTitle, setNotifTitle] = useState('');
    const [notifMessage, setNotifMessage] = useState('');
    const [notifType, setNotifType] = useState('info');

    useEffect(() => {
        if (isOpen) fetchData();
    }, [isOpen, user.id]);

    const fetchData = async () => {
        setLoading(true);
        const { data: enrolls } = await supabase
            .from('enrollments')
            .select(`status, course:courses(id, title_en)`)
            .eq('user_id', user.id);

        // Fetch Student Details if role is trainee
        if (user.role === 'trainee') {
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

        const { data: courses } = await supabase
            .from('courses')
            .select('id, title_en')
            .eq('status', 'active');

        if (enrolls) setEnrollments(enrolls as any);
        if (courses) setAllCourses(courses);
        setLoading(false);
    };

    const handlePasswordReset = async () => {
        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) alert("Error: " + error.message);
        else alert("Password reset email sent to " + user.email);
    };

    const handleRoleChange = async (newRole: string) => {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
        if (!error) {
            alert("Role updated to " + newRole);
            onUpdate();
        }
    };

    // Helper type check if strict check needed, for now dynamic key
    const isRole = (r: string) => ['admin', 'trainer', 'trainee'].includes(r);

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('notifications').insert({
            recipient_id: user.id,
            type: notifType,
            read: false,
            payload: {
                title: notifTitle,
                message: notifMessage,
                action_link: null
            }
        });
        if (!error) {
            alert("Notification sent successfully!");
            setNotifTitle('');
            setNotifMessage('');
        }
    };

    const handleEnroll = async (courseId: string) => {
        const { error } = await supabase.from('enrollments').insert({
            user_id: user.id,
            course_id: courseId,
            status: 'active'
        });
        if (!error) fetchData();
    };

    const handleUnenroll = async (courseId: string) => {
        const { error } = await supabase.from('enrollments').delete().eq('user_id', user.id).eq('course_id', courseId);
        if (!error) fetchData();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-[#0A0A0A] border border-white/10 w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Modal Header */}
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-blue-600/20">
                                    {user.full_name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white">{user.full_name}</h2>
                                    <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">{user.role} &bull; {user.status}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors text-gray-400">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Tabs Sidebar */}
                            <div className="w-64 border-r border-white/5 p-6 space-y-2 bg-black/40">
                                {[
                                    { id: 'profile', label: 'User Profile', icon: User },
                                    { id: 'enrollments', label: 'Classes & Courses', icon: BookOpen },
                                    { id: 'security', label: 'Security & Access', icon: Lock },
                                    { id: 'notify', label: 'Communications', icon: Bell },
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === tab.id
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                : 'text-gray-500 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-y-auto p-8 bg-black/20">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'profile' && (
                                        <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                            <div className="grid grid-cols-2 gap-6">
                                                <InfoCard label="Full Name" value={user.full_name} icon={User} />
                                                <InfoCard label="Email Address" value={user.email} icon={Mail} />
                                                <InfoCard label="Account Role" value={user.role} icon={Shield} uppercase />
                                                <InfoCard label="Join Date" value={new Date(user.created_at).toLocaleDateString()} icon={Calendar} />

                                                {/* Academic Details for Trainees */}
                                                {user.role === 'trainee' && activeStudentDetails && (
                                                    <>
                                                        <InfoCard label="Roll Number" value={activeStudentDetails.roll_number || 'N/A'} icon={BookOpen} />
                                                        <InfoCard label="Registration No" value={activeStudentDetails.registration_number || 'N/A'} icon={BookOpen} />
                                                        <InfoCard
                                                            label="Batch"
                                                            value={activeStudentDetails.batch ? `${activeStudentDetails.batch.name} (${activeStudentDetails.batch.academic_sessions?.year})` : "Unassigned"}
                                                            icon={Users}
                                                        />
                                                    </>
                                                )}
                                            </div>

                                            <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Quick Stats</h4>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-black text-white">{enrollments.length}</div>
                                                        <div className="text-[10px] text-gray-500 uppercase font-bold">Courses</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-black text-emerald-500">12</div>
                                                        <div className="text-[10px] text-gray-500 uppercase font-bold">Log Hours</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-black text-blue-500">94%</div>
                                                        <div className="text-[10px] text-gray-500 uppercase font-bold">Attendance</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'enrollments' && (
                                        <motion.div key="enrollments" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                            <div className="space-y-4">
                                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Active Enrollments</h4>
                                                {enrollments.length === 0 ? (
                                                    <p className="text-sm text-gray-500 italic px-2">No active enrollments found for this user.</p>
                                                ) : (
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {enrollments.map((en) => (
                                                            <div key={en.course.id} className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center justify-between group">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                                                        <BookOpen className="h-4 w-4" />
                                                                    </div>
                                                                    <span className="text-sm font-bold text-white">{en.course.title_en}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleUnenroll(en.course.id)}
                                                                    className="text-xs font-black text-red-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                                                                >
                                                                    Unenroll
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Enroll in New Course</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {allCourses.filter(c => !enrollments.some(en => en.course.id === c.id)).map((course) => (
                                                        <button
                                                            key={course.id}
                                                            onClick={() => handleEnroll(course.id)}
                                                            className="px-4 py-2 bg-blue-600/10 border border-blue-600/20 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                                                        >
                                                            <Plus className="h-3 w-3" /> {course.title_en}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'security' && (
                                        <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                            <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl">
                                                <h4 className="text-sm font-black text-red-500 mb-2">Password Management</h4>
                                                <p className="text-xs text-gray-400 mb-6">Force a password reset for this user. They will receive an email with a secure link.</p>
                                                <button
                                                    onClick={handlePasswordReset}
                                                    className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-xl shadow-red-600/10"
                                                >
                                                    Send Reset Link
                                                </button>
                                            </div>

                                            <div className="p-6 bg-white/5 border border-white/5 rounded-2xl">
                                                <h4 className="text-sm font-black text-white mb-2">Role Permissions</h4>
                                                <p className="text-xs text-gray-400 mb-6">Elevate or downgrade the user's access level in the system.</p>
                                                <div className="flex gap-3">
                                                    {['trainee', 'trainer', 'admin'].map((role) => (
                                                        <button
                                                            key={role}
                                                            onClick={() => handleRoleChange(role)}
                                                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border transition-all ${user.role === role
                                                                ? 'bg-blue-600 border-blue-500 text-white'
                                                                : 'bg-white/5 border-white/10 text-gray-500 hover:border-blue-500/50 hover:text-blue-400'
                                                                }`}
                                                        >
                                                            {role}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'notify' && (
                                        <motion.div key="notify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                            <div>
                                                <h4 className="text-lg font-black text-white italic">Broadcast Message</h4>
                                                <p className="text-xs text-gray-500 font-medium">Send an instant in-app notification to this user.</p>
                                            </div>

                                            <form onSubmit={handleSendNotification} className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Notification Type</label>
                                                    <div className="flex gap-2">
                                                        {['info', 'alert', 'success', 'priority'].map((type) => (
                                                            <button
                                                                key={type}
                                                                type="button"
                                                                onClick={() => setNotifType(type)}
                                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${notifType === type
                                                                    ? 'bg-blue-600 border-blue-500 text-white'
                                                                    : 'bg-white/5 border-white/10 text-gray-500'
                                                                    }`}
                                                            >
                                                                {type}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Headline</label>
                                                    <input
                                                        type="text"
                                                        value={notifTitle}
                                                        onChange={(e) => setNotifTitle(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all font-bold italic"
                                                        placeholder="e.g. Schedule Change"
                                                        required
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Message Content</label>
                                                    <textarea
                                                        value={notifMessage}
                                                        onChange={(e) => setNotifMessage(e.target.value)}
                                                        rows={4}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all font-medium leading-relaxed"
                                                        placeholder="Enter the detailed message here..."
                                                        required
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                                                >
                                                    <Bell className="h-4 w-4" /> Send Notification
                                                </button>
                                            </form>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function InfoCard({ label, value, icon: Icon, uppercase }: { label: string, value: string, icon: any, uppercase?: boolean }) {
    return (
        <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 mb-2">
                <Icon className="h-3 w-3 text-gray-500" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
            </div>
            <div className={`text-sm font-black text-white ${uppercase ? 'uppercase tracking-wide' : ''}`}>{value}</div>
        </div>
    );
}

function CreateUserModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('trainee');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const res = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    fullName,
                    role,
                    adminId: user?.id
                })
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.error);

            alert("User created successfully!");
            onSuccess();
            onClose();
        } catch (error: any) {
            alert("Creation failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#141414] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl p-6"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white">Add New User</h3>
                            <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</label>
                                <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email Address</label>
                                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" placeholder="john@example.com" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Password</label>
                                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" placeholder="******" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Account Role</label>
                                <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none">
                                    <option value="trainee">Trainee</option>
                                    <option value="trainer">Trainer</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <button disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mt-4 disabled:opacity-50">
                                {loading ? "Creating..." : "Create User"}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
