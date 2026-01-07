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
import { useTheme } from '@/components/providers/ThemeProvider';
import { useTranslations } from 'next-intl';

export default function DashboardSidebar({ activeView, setActiveView, collapsed, setCollapsed, onCreateNew }: any) {
    const { signOut, profile } = useAuth();
    const isTrainee = profile?.role === 'participant';
    const t = useTranslations('Sidebar');
    const tCommon = useTranslations('Common');

    // Different menu items per role
    // Grouped menu structure
    const getMenuGroups = () => {
        if (profile?.role === 'participant') {
            return [
                {
                    title: t('sections.overview'),
                    items: [
                        { id: 'dashboard', label: t('items.dashboard'), icon: LayoutDashboard },
                    ]
                },
                {
                    title: t('sections.my_training'),
                    items: [
                        { id: 'my-trainings', label: t('items.my_trainings'), icon: BookOpen },
                        { id: 'schedule', label: t('items.my_schedule'), icon: Calendar },
                    ]
                },
                {
                    title: t('sections.learning_resources'),
                    items: [
                        { id: 'documents', label: t('items.documents'), icon: FolderKanban },
                        { id: 'assessments', label: t('items.assessments'), icon: FileText },
                    ]
                },
                {
                    title: t('sections.certification'),
                    items: [
                        { id: 'certificates', label: t('items.certificates'), icon: Award },
                    ]
                },
                {
                    title: t('sections.account'),
                    items: [
                        { id: 'profile', label: t('items.profile'), icon: UserIcon },
                        { id: 'settings', label: t('items.settings'), icon: Settings },
                    ]
                }
            ];
        }
        if (profile?.role === 'ernam_admin') {
            return [
                {
                    title: t('sections.overview'),
                    items: [
                        { id: 'dashboard', label: t('items.dashboard'), icon: LayoutDashboard },
                    ]
                },
                {
                    title: t('sections.training_ops'),
                    items: [
                        { id: 'standards', label: t('items.standards'), icon: ShieldCheck },
                        { id: 'sessions', label: t('items.sessions'), icon: Calendar },
                        { id: 'training_requests', label: t('items.training_requests'), icon: MessageSquare },
                    ]
                },
                {
                    title: t('sections.administration'),
                    items: [
                        { id: 'organizations', label: t('items.organizations'), icon: Users },
                        { id: 'applications', label: t('items.applications'), icon: FileText },
                        { id: 'users', label: t('items.users'), icon: Users },
                        { id: 'audit-logs', label: t('items.audit_logs'), icon: ShieldCheck },
                    ]
                },
                {
                    title: t('sections.account'),
                    items: [
                        { id: 'settings', label: t('items.settings'), icon: Settings },
                    ]
                }
            ];
        }
        if (profile?.role === 'org_admin') {
            return [
                {
                    title: t('sections.overview'),
                    items: [
                        { id: 'dashboard', label: t('items.dashboard'), icon: LayoutDashboard },
                    ]
                },
                {
                    title: t('sections.org_mgmt'),
                    items: [
                        { id: 'organization', label: t('items.my_org'), icon: Users },
                        { id: 'participants', label: t('items.staff'), icon: Users }, // Staff (Users) mapped to 'participants' view in OrgAdminDashboard
                    ]
                },
                {
                    title: t('sections.training_ops'),
                    items: [
                        { id: 'sessions', label: t('items.training_sessions'), icon: Calendar },
                        { id: 'training-requests', label: t('items.participants'), icon: FileText }, // Participants (Assignments) mapped to 'training-requests' or similar? Prompt says: "Participants (Assignments)"
                    ]
                },
                {
                    title: t('sections.certification'),
                    items: [
                        { id: 'certificates', label: t('items.certificates'), icon: Award },
                        { id: 'validity-tracking', label: t('items.validity_tracking'), icon: Clock },
                    ]
                },
                {
                    title: t('sections.administration'),
                    items: [
                        { id: 'notifications', label: t('items.notifications'), icon: MessageSquare },
                        { id: 'settings', label: t('items.settings'), icon: Settings },
                    ]
                }
            ];
        }
        // Instructor (default)
        return [
            {
                title: t('sections.overview'),
                items: [
                    { id: 'dashboard', label: t('items.dashboard'), icon: LayoutDashboard },
                    { id: 'my-schedule', label: t('items.my_schedule'), icon: Calendar },
                ]
            },
            {
                title: t('sections.training_ops'),
                items: [
                    { id: 'sessions', label: t('items.sessions'), icon: Calendar },
                    { id: 'participants', label: t('items.participants'), icon: Users },
                ]
            },
            {
                title: t('sections.training_content'),
                items: [
                    { id: 'documents', label: t('items.documents'), icon: FolderKanban },
                    { id: 'planned-activities', label: t('items.planned_activities'), icon: FileText },
                ]
            },
            {
                title: t('sections.evaluation'),
                items: [
                    { id: 'assessments', label: t('items.assessments'), icon: ShieldCheck },
                ]
            },
            {
                title: t('sections.account'),
                items: [
                    { id: 'profile', label: t('items.profile'), icon: UserIcon },
                    { id: 'settings', label: t('items.settings'), icon: Settings },
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
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">{t('digital_twin')}</span>
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
                    {!collapsed && <span>{t('create_new')}</span>}
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
                    {!collapsed && <span className="font-medium">{tCommon('sign_out')}</span>}
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
