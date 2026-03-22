import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    Clock,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Users,
    Plane,
    FileText,
    PieChart,
    Plus,
    Award,
    FolderKanban,
    ShieldCheck,
    DollarSign,
    User as UserIcon,
    MessageSquare,
    Trophy
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

export default function DashboardSidebar({ activeView, setActiveView, collapsed, setCollapsed, onCreateNew }: any) {
    const { signOut, profile } = useAuth();
    const roleId = (() => {
        const raw = profile?.role || 'trainee';
        if (raw === 'instructor') return 'trainer';
        if (raw === 'participant') return 'trainee';
        if (raw === 'org_admin' || raw === 'ernam_admin') return 'admin';
        return raw;
    })();
    const isTrainee = roleId === 'trainee';

    // Different menu items per role
    // Grouped menu structure
    const getMenuGroups = () => {
        if (profile?.role === 'trainee' || profile?.role === 'participant') {
            return [
                {
                    title: "Overview",
                    items: [
                        { id: 'dashboard', label: "Dashboard", icon: LayoutDashboard },
                    ]
                },
                {
                    title: "My Training",
                    items: [
                        { id: 'courses', label: "Courses", icon: BookOpen },
                        { id: 'schedule', label: "My Schedule", icon: Calendar },
                    ]
                },
                {
                    title: "Learning Resources",
                    items: [
                        { id: 'documents', label: "Documents", icon: FolderKanban },
                        { id: 'assessments', label: "Assessments", icon: FileText },
                    ]
                },
                {
                    title: "Certification",
                    items: [
                        { id: 'certificates', label: "Certificates", icon: Award },
                    ]
                },
                {
                    title: "Account",
                    items: [
                        { id: 'profile', label: "Profile", icon: UserIcon },
                        { id: 'settings', label: "Settings", icon: Settings },
                    ]
                }
            ];
        }
        if (profile?.role === 'admin' || profile?.role === 'ernam_admin' || profile?.role === 'org_admin') {
            return [
                {
                    title: "Overview",
                    items: [
                        { id: 'dashboard', label: "Dashboard", icon: LayoutDashboard },
                    ]
                },
                {
                    title: "Training Operations",
                    items: [
                        { id: 'standards', label: "Standards", icon: ShieldCheck },
                        { id: 'sessions', label: "Sessions", icon: Calendar },
                        { id: 'training-requests', label: "Training Requests", icon: MessageSquare },
                        { id: 'exams', label: "Exam Management", icon: FileText },
                    ]
                },
                {
                    title: "Administration",
                    items: [
                        { id: 'users', label: "Users", icon: Users },
                        { id: 'instructors', label: "Instructors", icon: Users },
                        { id: 'trainees-list', label: "Trainees Directory", icon: Users },
                        { id: 'audit-logs', label: "Audit Logs", icon: ShieldCheck },
                        { id: 'finance', label: "Finance", icon: DollarSign },
                    ]
                },
                {
                    title: "System",
                    items: [
                        { id: 'settings', label: "System Settings", icon: Settings },
                    ]
                }
            ];
        }
        // Trainer (default)
        return [
            {
                title: "Overview",
                items: [
                    { id: 'dashboard', label: "Dashboard", icon: LayoutDashboard },
                    { id: 'my-schedule', label: "My Schedule", icon: Calendar },
                ]
            },
            {
                title: "Training Operations",
                items: [
                    { id: 'sessions', label: "Sessions", icon: Calendar },
                    { id: 'trainees', label: "Participants", icon: Users },
                ]
            },
            {
                title: "Training Content",
                items: [
                    { id: 'documents', label: "Documents", icon: FolderKanban },
                    { id: 'planned-activities', label: "Planned Activities", icon: FileText },
                ]
            },
            {
                title: "Evaluation",
                items: [
                    { id: 'assessments', label: "Assessments", icon: ShieldCheck },
                ]
            },
            {
                title: "Account",
                items: [
                    { id: 'profile', label: "Profile", icon: UserIcon },
                    { id: 'settings', label: "Settings", icon: Settings },
                ]
            }
        ];
    };

    const menuGroups = getMenuGroups();

    const bgColor = isTrainee ? 'bg-white' : 'bg-[#0B1120]';
    const textColor = isTrainee ? 'text-gray-900' : 'text-white';
    const itemActiveBg = isTrainee ? 'bg-blue-50 text-blue-600' : 'bg-white/10 text-white';
    const itemInactiveColor = isTrainee ? 'text-gray-500' : 'text-gray-400';
    const borderColor = isTrainee ? 'border-gray-100' : 'border-white/10';

    return (
        <motion.div
            initial={false}
            animate={{ width: collapsed ? 80 : 260 }}
            className={`h-screen ${bgColor} ${textColor} flex flex-col relative z-20 transition-all duration-300 shadow-xl border-r ${borderColor}`}
        >
            {/* Logo Area */}
            <div className="p-4 flex items-center justify-center">
                <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                    <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-slate-900 border border-white/10 shadow-2xl flex-shrink-0">
                        <img
                            src="/logos/ernam_logo_final.jpg"
                            alt="ERNAM Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tighter text-white leading-none">ERNAM</span>
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">Digital Twin</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4 mb-6">
                <button
                    onClick={onCreateNew}
                    className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md shadow-sm transition-all flex items-center justify-center gap-2 ${collapsed ? 'px-0' : 'px-4'}`}
                >
                    <Plus className="h-5 w-5" />
                    {!collapsed && <span>Create New</span>}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-6 overflow-y-auto py-4">
                {menuGroups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                        {!collapsed && group.title && (
                            <h3 className={`px-4 text-xs font-bold uppercase tracking-wider mb-2 ${isTrainee ? 'text-gray-400' : 'text-gray-500'}`}>
                                {group.title}
                            </h3>
                        )}
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeView === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveView(item.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-all group relative ${isActive
                                            ? `${itemActiveBg} shadow-sm border ${isTrainee ? 'border-blue-100' : 'border-white/5'}`
                                            : `${itemInactiveColor} hover:text-primary ${isTrainee ? 'hover:bg-gray-50' : 'hover:bg-white/5'}`
                                            }`}
                                        title={collapsed ? item.label : undefined}
                                    >
                                        <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-500' : `${itemInactiveColor} group-hover:text-blue-500`}`} />
                                        {!collapsed && (
                                            <span className={`font-medium truncate ${isActive ? (isTrainee ? 'text-blue-600' : 'text-white') : itemInactiveColor}`}>
                                                {item.label}
                                            </span>
                                        )}
                                        {isActive && !collapsed && (
                                            <div className="absolute right-0 h-6 w-1 bg-blue-500 rounded-l-full" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className={`p-4 border-t border-white/10 space-y-2 ${collapsed ? 'items-center flex flex-col' : ''}`}>
                <button
                    onClick={signOut}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors ${collapsed ? 'justify-center' : ''}`}
                >
                    <LogOut className="h-5 w-5" />
                    {!collapsed && <span className="font-medium">Sign Out</span>}
                </button>
            </div>

            {/* Collapse Toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className={`absolute -right-3 top-20 ${bgColor} border ${borderColor} ${itemInactiveColor} p-1.5 rounded-full hover:text-blue-500 transition-colors shadow-md z-30`}
            >
                {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </button>
        </motion.div >
    );
}
