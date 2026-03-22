"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Unlock, ChevronRight, Save, Plus, Trash2, Info } from 'lucide-react';

interface Permission {
    id: string;
    label: string;
    description: string;
}

interface Role {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    isSystem?: boolean;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
    { id: 'users.view', label: 'View Users', description: 'Can see the user directory' },
    { id: 'users.edit', label: 'Edit Users', description: 'Can modify user profiles and roles' },
    { id: 'users.delete', label: 'Delete Users', description: 'Can remove users from the system' },
    { id: 'users.impersonate', label: 'Impersonate', description: 'Can "Act As" other users' },
    { id: 'courses.manage', label: 'Manage Courses', description: 'Can create and edit course standards' },
    { id: 'sessions.manage', label: 'Manage Sessions', description: 'Can schedule training sessions' },
    { id: 'audit.view', label: 'View Audit Logs', description: 'Can see system activity logs' },
    { id: 'settings.manage', label: 'System Settings', description: 'Can modify platform configuration' },
];

export default function RoleManagement() {
    const [roles, setRoles] = useState<Role[]>([
        { id: 'admin', name: 'Super Admin', description: 'Full system access', permissions: AVAILABLE_PERMISSIONS.map(p => p.id), isSystem: true },
        { id: 'qhse_admin', name: 'QHSE Admin', description: 'Quality & Safety management', permissions: ['users.view', 'courses.manage', 'sessions.manage'] },
        { id: 'registrar', name: 'Registrar', description: 'Student & enrollment management', permissions: ['users.view', 'sessions.manage'] },
    ]);

    const [selectedRole, setSelectedRole] = useState<Role | null>(roles[0]);

    const togglePermission = (roleId: string, permId: string) => {
        setRoles(roles.map(r => {
            if (r.id !== roleId) return r;
            const hasPerm = r.permissions.includes(permId);
            const newPerms = hasPerm 
                ? r.permissions.filter(p => p !== permId) 
                : [...r.permissions, permId];
            return { ...r, permissions: newPerms };
        }));
    };

    return (
        <div className="p-6 md:p-12 space-y-12 bg-white min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Access Control</h2>
                    <p className="text-slate-500 font-medium">Define high-level access and granular permissions</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                    <Plus className="h-4 w-4" /> Create New Role
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Role List */}
                <div className="lg:col-span-4 space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-2 flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        Active Hierarchies
                    </h3>
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role)}
                            className={`w-full flex items-center justify-between p-6 rounded-3xl border transition-all ${
                                selectedRole?.id === role.id 
                                ? 'bg-white border-blue-200 shadow-2xl shadow-blue-500/10' 
                                : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                    selectedRole?.id === role.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white text-slate-400 border border-slate-100'
                                }`}>
                                    <Shield className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-slate-900 text-sm">{role.name}</div>
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{role.permissions.length} Authorized Edits</div>
                                </div>
                            </div>
                            <ChevronRight className={`h-4 w-4 transition-transform ${selectedRole?.id === role.id ? 'translate-x-1 text-blue-600' : 'text-slate-200'}`} />
                        </button>
                    ))}
                </div>

                {/* Permission Matrix */}
                <div className="lg:col-span-8">
                    <AnimatePresence mode="wait">
                        {selectedRole ? (
                            <motion.div
                                key={selectedRole.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden"
                            >
                                <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                                    <div>
                                        <h4 className="text-xl font-bold text-slate-900">{selectedRole.name}</h4>
                                        <p className="text-sm text-slate-500 font-medium">{selectedRole.description}</p>
                                    </div>
                                    <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                                        <Save className="h-3.5 w-3.5" /> Save Changes
                                    </button>
                                </div>

                                <div className="p-8 space-y-6 bg-white">
                                    <div className="flex items-center gap-3 text-amber-600 bg-amber-50/50 p-5 rounded-2xl border border-amber-100/50">
                                        <Info className="h-5 w-5 shrink-0 opacity-70" />
                                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] leading-relaxed">System-wide Notice: Changes to this role's permissions will propagate to all assigned users in real-time.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {AVAILABLE_PERMISSIONS.map((perm) => {
                                            const isEnabled = selectedRole.permissions.includes(perm.id);
                                            return (
                                                <div 
                                                    key={perm.id}
                                                    onClick={() => !selectedRole.isSystem && togglePermission(selectedRole.id, perm.id)}
                                                    className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between h-36 ${
                                                        isEnabled 
                                                        ? 'bg-blue-50/30 border-blue-200' 
                                                        : 'bg-slate-50/20 border-slate-100 opacity-60 grayscale'
                                                    } ${selectedRole.isSystem ? 'cursor-not-allowed' : 'hover:shadow-2xl hover:shadow-blue-500/5 hover:border-blue-100'}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className={`p-2 rounded-lg ${isEnabled ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                            {isEnabled ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                                                        </div>
                                                        <div className={`text-[10px] font-black uppercase tracking-widest ${isEnabled ? 'text-blue-600' : 'text-slate-400'}`}>
                                                            {isEnabled ? 'Enabled' : 'Disabled'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-sm">{perm.label}</div>
                                                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">{perm.description}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {!selectedRole.isSystem && (
                                    <div className="p-8 bg-red-50/30 border-t border-red-50 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                                <Trash2 className="h-4 w-4" />
                                            </div>
                                            <div className="text-xs font-bold text-red-600">Danger Zone: This role will be permanently deleted</div>
                                        </div>
                                        <button className="px-4 py-2 border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-50 transition-colors">
                                            Delete Role
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-32 border-2 border-dashed border-slate-100 rounded-[40px]">
                                <Shield className="h-12 w-12 mb-4 opacity-20" />
                                <p className="font-bold uppercase tracking-widest text-[10px]">Select a role to configure</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
