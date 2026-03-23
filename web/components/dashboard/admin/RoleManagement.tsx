"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
    Shield, 
    Users, 
    Lock, 
    Plus, 
    Save, 
    Trash2, 
    ChevronRight, 
    Check, 
    AlertCircle,
    Loader2,
    X,
    Settings,
    LayoutGrid,
    Search,
    UserCircle,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Permission {
    id: string;
    module: string;
    action: string;
    description: string;
}

interface AdminRole {
    id: string;
    name: string;
    description: string;
    is_system: boolean;
    permissions?: string[]; // IDs of assigned permissions
}

export default function RoleManagement() {
    const [activeTab, setActiveTab] = useState<'builder' | 'staff'>('builder');
    const [roles, setRoles] = useState<AdminRole[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Builder State
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [editRole, setEditRole] = useState<Partial<AdminRole>>({
        name: '',
        description: '',
        permissions: []
    });

    // Staff State
    const [adminUsers, setAdminUsers] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [rolesRes, permsRes, usersRes] = await Promise.all([
                supabase.from('admin_roles').select('*'),
                supabase.from('permissions').select('*'),
                supabase.from('users').select('*, admin_role:admin_roles(name)').eq('role', 'ernam_admin')
            ]);

            if (rolesRes.data) {
                // Fetch permissions for each role
                const rolesWithPerms = await Promise.all(rolesRes.data.map(async (role) => {
                    const { data: rp } = await supabase
                        .from('role_permissions')
                        .select('permission_id')
                        .eq('role_id', role.id);
                    return {
                        ...role,
                        permissions: rp?.map(p => p.permission_id) || []
                    };
                }));
                setRoles(rolesWithPerms);
                if (rolesWithPerms.length > 0 && !selectedRoleId) {
                    setSelectedRoleId(rolesWithPerms[0].id);
                    setEditRole(rolesWithPerms[0]);
                }
            }

            if (permsRes.data) setPermissions(permsRes.data);
            if (usersRes.data) setAdminUsers(usersRes.data);

        } catch (err) {
            console.error('Error fetching RBAC data:', err);
        } finally {
            setLoading(false);
        }
    }

    const handleRoleSelect = (role: AdminRole) => {
        setSelectedRoleId(role.id);
        setEditRole(role);
    };

    const handleAddNewRole = () => {
        setSelectedRoleId(null);
        setEditRole({
            name: 'New Role',
            description: '',
            permissions: []
        });
    };

    const togglePermission = (permId: string) => {
        const currentPerms = editRole.permissions || [];
        if (currentPerms.includes(permId)) {
            setEditRole({ ...editRole, permissions: currentPerms.filter(id => id !== permId) });
        } else {
            setEditRole({ ...editRole, permissions: [...currentPerms, permId] });
        }
    };

    const saveRole = async () => {
        if (!editRole.name) return alert('Role name is required');
        setSaving(true);
        try {
            let roleId = selectedRoleId;

            if (!roleId) {
                // Create new role
                const { data: newRole, error: roleError } = await supabase
                    .from('admin_roles')
                    .insert([{ name: editRole.name, description: editRole.description }])
                    .select()
                    .single();
                
                if (roleError) throw roleError;
                roleId = newRole.id;
            } else {
                // Update existing role info
                const { error: updateError } = await supabase
                    .from('admin_roles')
                    .update({ name: editRole.name, description: editRole.description })
                    .eq('id', roleId);
                
                if (updateError) throw updateError;
            }

            // Sync permissions (Delete and Re-insert)
            await supabase.from('role_permissions').delete().eq('role_id', roleId);
            
            if (editRole.permissions && editRole.permissions.length > 0) {
                const mappings = editRole.permissions.map(pid => ({
                    role_id: roleId,
                    permission_id: pid
                }));
                const { error: mappingError } = await supabase
                    .from('role_permissions')
                    .insert(mappings);
                
                if (mappingError) throw mappingError;
            }

            alert('Role saved successfully');
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Error saving role');
        } finally {
            setSaving(false);
        }
    };

    const assignUserRole = async (userId: string, adminRoleId: string) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ admin_role_id: adminRoleId })
                .eq('id', userId);
            
            if (error) throw error;
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Error assigning role');
        }
    };

    const resetEdit = () => {
        const originalRole = roles.find(r => r.id === selectedRoleId);
        if (originalRole) setEditRole(originalRole);
        else handleAddNewRole();
    };

    // Group permissions by module
    const modules = Array.from(new Set(permissions.map(p => p.module)));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[600px] animate-pulse">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Governance Data</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Minimal Sub-Navigation */}
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-[#12388D] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Access Management</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50 px-2 py-0.5 rounded">Security Tier 1</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Governance Protocols</span>
                        </div>
                    </div>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                    <button 
                        onClick={() => setActiveTab('builder')}
                        className={cn(
                            "px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                            activeTab === 'builder' 
                                ? "bg-gray-900 text-white shadow-md shadow-gray-200" 
                                : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                        )}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Role Builder
                    </button>
                    <button 
                        onClick={() => setActiveTab('staff')}
                        className={cn(
                            "px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                            activeTab === 'staff' 
                                ? "bg-gray-900 text-white shadow-md shadow-gray-200" 
                                : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                        )}
                    >
                        <Users className="w-3.5 h-3.5" />
                        Staff Assignment
                    </button>
                </div>
            </div>

            {activeTab === 'builder' ? (
                <div className="grid grid-cols-12 gap-10 items-start">
                    {/* Role Selection Sidebar */}
                    <div className="col-span-3 space-y-6">
                        <div className="flex items-center justify-between px-2">
                             <h3 className="font-black text-gray-400 uppercase text-[10px] tracking-[0.2em]">Defined Roles</h3>
                             <button 
                                onClick={handleAddNewRole}
                                className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {roles.map(role => (
                                <button
                                    key={role.id}
                                    onClick={() => handleRoleSelect(role)}
                                    className={cn(
                                        "w-full group p-5 rounded-[24px] border transition-all text-left relative overflow-hidden",
                                        selectedRoleId === role.id 
                                            ? "bg-white border-blue-600 shadow-xl shadow-blue-500/5 ring-1 ring-blue-600/5" 
                                            : "bg-white/50 border-gray-100/80 hover:border-gray-300 hover:bg-white text-gray-500"
                                    )}
                                >
                                    {selectedRoleId === role.id && (
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-600/5 rounded-full -mr-8 -mt-8" />
                                    )}
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={cn(
                                            "font-black text-[10px] uppercase tracking-[0.2em]",
                                            selectedRoleId === role.id ? "text-blue-600" : "text-gray-400"
                                        )}>
                                            {role.is_system ? 'System Core' : 'Custom Implementation'}
                                        </span>
                                        {selectedRoleId === role.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                                    </div>
                                    <div className="font-black text-[14px] text-gray-900 uppercase tracking-wide leading-none mb-1">{role.name}</div>
                                    <div className="text-[11px] font-medium text-gray-400 truncate max-w-[200px]">{role.description || 'No description provided'}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Editor Card */}
                    <div className="col-span-9">
                        <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden min-h-[750px] flex flex-col relative">
                            {/* Editor Header - INSPIRED BY SCREENSHOT */}
                            <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Role Configuration</h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Configure access hierarchies and matrix</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={resetEdit}
                                        className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={saveRole}
                                        disabled={saving}
                                        className="px-8 py-3 bg-[#00D7AA] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#00c59b] transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2 group"
                                    >
                                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
                                        Apply Config
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-12">
                                {/* Role Identity Section */}
                                <section>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 border-b border-gray-50 pb-3">Basic Information</h4>
                                    <div className="grid grid-cols-2 gap-10">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase text-gray-900 tracking-widest px-1">Role Name</label>
                                            <input 
                                                type="text" 
                                                value={editRole.name}
                                                onChange={(e) => setEditRole({...editRole, name: e.target.value})}
                                                placeholder="Enter role name..."
                                                disabled={editRole.is_system}
                                                className="w-full bg-gray-50/50 border border-gray-100 rounded-[20px] px-6 py-4 font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all disabled:opacity-40"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase text-gray-900 tracking-widest px-1">Description / Purview</label>
                                            <input 
                                                type="text" 
                                                value={editRole.description || ''}
                                                onChange={(e) => setEditRole({...editRole, description: e.target.value})}
                                                placeholder="Define the scope of this role..."
                                                className="w-full bg-gray-50/50 border border-gray-100 rounded-[20px] px-6 py-4 font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Capability Matrix Section - TILED LAYOUT */}
                                <section>
                                    <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Application Permissions</h4>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#00D7AA]" />
                                                <span className="text-[9px] font-black text-gray-400 uppercase">Authorized</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                                                <span className="text-[9px] font-black text-gray-400 uppercase">Restricted</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* GRID OF MODULE TILES */}
                                    <div className="grid grid-cols-2 gap-6">
                                        {modules.map(module => (
                                            <div key={module} className="bg-white border border-gray-100 rounded-[32px] p-6 hover:shadow-xl hover:shadow-gray-200/20 transition-all group flex flex-col">
                                                {/* Tile Header */}
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all text-gray-400">
                                                            {module === 'users' ? <Users className="w-5 h-5" /> : 
                                                             module === 'sessions' ? <LayoutGrid className="w-5 h-5" /> : 
                                                             <Settings className="w-5 h-5" />}
                                                        </div>
                                                        <span className="font-black text-xs uppercase tracking-[0.2em] text-gray-900">{module}</span>
                                                    </div>
                                                    <div className="text-[10px] font-black text-gray-300 group-hover:text-blue-200 transition-colors uppercase">
                                                        {permissions.filter(p => p.module === module && editRole.permissions?.includes(p.id)).length} / {permissions.filter(p => p.module === module).length}
                                                    </div>
                                                </div>

                                                {/* Actions List */}
                                                <div className="space-y-4">
                                                    {permissions.filter(p => p.module === module).map(perm => {
                                                        const isSelected = editRole.permissions?.includes(perm.id);
                                                        return (
                                                            <div 
                                                                key={perm.id}
                                                                onClick={() => togglePermission(perm.id)}
                                                                className="flex items-center justify-between group/action cursor-pointer"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn(
                                                                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                                                        isSelected ? "bg-blue-600 border-blue-600 shadow-md shadow-blue-500/20" : "bg-white border-gray-200 group-hover/action:border-gray-400"
                                                                    )}>
                                                                        {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className={cn(
                                                                            "text-[11px] font-bold uppercase tracking-wider transition-colors",
                                                                            isSelected ? "text-gray-900" : "text-gray-500"
                                                                        )}>{perm.action}</span>
                                                                        <span className="text-[9px] text-gray-400 font-medium leading-none mt-0.5">{perm.description}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {editRole.is_system && (
                                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 p-5 rounded-[24px]">
                                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                        <div className="text-[11px] font-bold text-amber-950 uppercase tracking-widest leading-relaxed">
                                            System constraints apply: Core identifiers and names cannot be modified for this role.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* REDESIGNED STAFF ASSIGNMENT VIEW */
                <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/30 border border-gray-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-500">
                    <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Administrative Repository</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Personnel role reconciliation</p>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Locate staff member..." 
                                className="bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-6 py-3 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all w-[300px]"
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50">
                                    <th className="px-10 py-6">ADMINISTRATOR</th>
                                    <th className="px-8 py-6">CORE SYSTEM ROLE</th>
                                    <th className="px-8 py-6">ASSIGNED RBAC PRIVILEGE</th>
                                    <th className="px-10 py-6 text-right">SYSTEM ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50/50">
                                {adminUsers.map(user => (
                                    <tr key={user.id} className="group hover:bg-blue-50/20 transition-all">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-[18px] bg-white border border-gray-100 flex items-center justify-center text-[#12388D] font-black text-sm shadow-sm group-hover:scale-110 transition-transform">
                                                    {user.full_name?.substring(0,2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-black text-sm text-gray-900 tracking-wide">{user.full_name || 'Anonymous'}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-0.5">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <UserCircle className="w-3.5 h-3.5 text-purple-400" />
                                                <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest">{user.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-xl flex items-center justify-center",
                                                    user.admin_role?.name ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-300"
                                                )}>
                                                    <Shield className="w-4 h-4" />
                                                </div>
                                                <span className={cn(
                                                    "font-black text-xs uppercase tracking-wider",
                                                    user.admin_role?.name ? "text-gray-900" : "text-gray-300"
                                                )}>
                                                    {user.admin_role?.name || 'GUEST_PENDING'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <select 
                                                    className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 cursor-pointer hover:bg-white transition-all shadow-sm"
                                                    value={user.admin_role_id || ''}
                                                    onChange={(e) => assignUserRole(user.id, e.target.value)}
                                                >
                                                    <option value="" disabled>Reconcile Privilege</option>
                                                    {roles.map(r => (
                                                        <option key={r.id} value={r.id}>{r.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
