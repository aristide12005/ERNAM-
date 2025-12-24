import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
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
import { useTheme } from '@/components/providers/ThemeProvider';

export default function DashboardSidebar({ activeView, setActiveView, collapsed, setCollapsed, onCreateNew }: any) {
    const { signOut, profile } = useAuth();
    const isTrainee = profile?.role === 'trainee';

    // Different menu items per role
    const getMenuItems = () => {
        if (isTrainee) {
            return [
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'my-learning', label: 'My Learning', icon: BookOpen },
                { id: 'schedule', label: 'Schedule', icon: Calendar },
                { id: 'messages', label: 'Messages', icon: MessageSquare },
                { id: 'certificates', label: 'Certificates', icon: Award },
                { id: 'resources', label: 'Resources', icon: BookOpen },
                { id: 'profile', label: 'Profile', icon: UserIcon },
            ];
        }
        if (profile?.role === 'admin') {
            return [
                { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
                { id: 'users', label: 'User Management', icon: Users },
                { id: 'messages', label: 'Messages', icon: MessageSquare },
                { id: 'finances', label: 'Finances', icon: DollarSign },
                { id: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck },
                { id: 'settings', label: 'System Settings', icon: Settings },
            ];
        }
        // Trainer (default)
        return [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'my-classes', label: 'My Courses', icon: BookOpen },
            { id: 'messages', label: 'Messages', icon: MessageSquare },
            { id: 'students', label: 'Students', icon: Users },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
            { id: 'gradebook', label: 'Gradebook', icon: FileText },
            { id: 'reports', label: 'Reports', icon: PieChart },
        ];
    };

    const menuItems = getMenuItems();

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
                            src="/logos/logo.jpg"
                            alt="ERNAM Logo"
                            className="w-full h-full object-contain p-1"
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
                    className={`w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 ${collapsed ? 'px-0' : 'px-4'}`}
                >
                    <Plus className="h-5 w-5" />
                    {!collapsed && <span>Create New</span>}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group relative ${isActive
                                ? `${itemActiveBg} shadow-sm border ${isTrainee ? 'border-blue-100' : 'border-white/5'}`
                                : `${itemInactiveColor} hover:text-primary ${isTrainee ? 'hover:bg-gray-50' : 'hover:bg-white/5'}`
                                }`}
                        >
                            <Icon className={`h-5 w-5 ${isActive ? 'text-blue-500' : `${itemInactiveColor} group-hover:text-blue-500`}`} />
                            {!collapsed && (
                                <span className={`font-medium ${isActive ? (isTrainee ? 'text-blue-600' : 'text-white') : itemInactiveColor}`}>
                                    {item.label}
                                </span>
                            )}
                            {isActive && !collapsed && (
                                <div className="absolute right-0 h-6 w-1 bg-blue-500 rounded-l-full" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className={`p-4 border-t border-white/10 space-y-2 ${collapsed ? 'items-center flex flex-col' : ''}`}>
                <button
                    onClick={signOut}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors ${collapsed ? 'justify-center' : ''}`}
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
        </motion.div>
    );
}
