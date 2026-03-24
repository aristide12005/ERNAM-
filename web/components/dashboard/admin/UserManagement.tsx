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
    Edit2,
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
import UserDetailModal from './UserDetailModal';

import { UserRole, UserStatus } from '@/lib/types';

interface Profile {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    created_at: string;
}

interface Course {
    id: string;
    title_en: string;
}

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
        const { data: { session } } = await supabase.auth.getSession();
        const adminId = session?.user?.id;

        if (action === 'delete') {
            const confirmed = window.confirm("Are you sure you want to permanently delete this user?");
            if (!confirmed) return;
            
            const token = session?.access_token;

            const response = await fetch(`/api/admin/manage-user?id=${id}&adminId=${adminId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) fetchProfiles();
            else {
                const err = await response.json();
                alert("Error deleting user: " + err.error);
            }
        } else {
            const status = action === 'approve' ? 'approved' : 'rejected';
            const token = session?.access_token;
            const response = await fetch('/api/admin/manage-user', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ id, status, adminId })
            });

            if (response.ok) fetchProfiles();
            else {
                const err = await response.json();
                alert("Action failed: " + err.error);
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
                        <option value="ernam_admin">Admin</option>
                        <option value="instructor">Trainer</option>
                        <option value="participant">Trainee</option>
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
                                <th className="px-8 py-5 font-black text-right">ACTION</th>
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
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", p.role === 'ernam_admin' ? 'bg-black' : p.role === 'instructor' ? 'bg-blue-500' : 'bg-gray-400')} />
                                                    <span className="capitalize">
                                                        {p.role === 'ernam_admin' ? 'Admin' : p.role === 'instructor' ? 'Trainer' : p.role === 'participant' ? 'Trainee' : p.role}
                                                    </span>
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
                                                <div className="flex justify-end gap-3">
                                                    {adminProfile?.role === 'ernam_admin' && p.id !== adminProfile?.id && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                startImpersonation(p as any);
                                                            }}
                                                            className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                                            title="Act As This User"
                                                        >
                                                            <Ghost className="h-4 w-4" />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => { setSelectedUser(p); setIsDetailModalOpen(true); }}
                                                        className="p-2.5 bg-slate-50 border border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 rounded-xl transition-all active:scale-95"
                                                        title="Edit User"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleAction(p.id, 'delete')}
                                                        className="p-2.5 bg-red-50 border border-red-100 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all active:scale-95 shadow-sm"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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

            {selectedUser && (
                <UserDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    user={selectedUser as any}
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

function CreateUserModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('participant');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const res = await fetch('/api/admin/manage-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    email,
                    password,
                    fullName,
                    role,
                    adminId: session?.user?.id
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
                                    <option value="participant">Trainee</option>
                                    <option value="instructor">Trainer</option>
                                    <option value="ernam_admin">Admin</option>
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
