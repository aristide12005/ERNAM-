"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import ScheduleSessionDialog from '@/components/dashboard/ScheduleSessionDialog';
import LogFlightDialog from '@/components/dashboard/LogFlightDialog';
import { StudentListDialog } from '@/components/dashboard/instructor/StudentListDialog';
import { GradeBookDialog } from '@/components/dashboard/instructor/GradeBookDialog';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Users,
    DollarSign,
    AlertCircle,
    CheckCircle2,
    Server,
    Plane,
    Radio,
    BookOpen,
    Calendar,
    Clock,
    FileText,
    ShieldCheck,
    LogOut,
    Settings,
    User as UserIcon,
    ChevronDown,
    Plus,
    Bell,
    CheckCircle,
    Info,
    Search,
    MoreHorizontal,
    TrendingUp,
    TrendingDown,
    Globe,
    MapPin
} from 'lucide-react';
import {
    PieChart as RePieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar
} from 'recharts';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import NotificationsDialog from '@/components/dashboard/NotificationsDialog';
import MyClasses from '@/components/dashboard/instructor/MyClasses';
import ManageClass from '@/components/dashboard/instructor/ManageClass';
import MessagingSystem from '@/components/dashboard/MessagingSystem';
import Schedule from '@/components/dashboard/instructor/Schedule';
import Gradebook from '@/components/dashboard/instructor/Gradebook';
import Grading from '@/components/dashboard/instructor/Grading';
import Reports from '@/components/dashboard/instructor/Reports';
import UserManagement from '@/components/dashboard/admin/UserManagement';
import Finance from '@/components/dashboard/admin/Finance';
import AuditLogs from '@/components/dashboard/admin/AuditLogs';
import AdminSettings from '@/components/dashboard/admin/AdminSettings';
import MyLearning from '@/components/dashboard/trainee/MyLearning';
import TraineeSchedule from '@/components/dashboard/trainee/TraineeSchedule';
import Certifications from '@/components/dashboard/trainee/Certifications';
import Resources from '@/components/dashboard/trainee/Resources';
import TraineeProfile from '@/components/dashboard/trainee/TraineeProfile';

// --- SHARED COMPONENTS (Based on UI/UX Principles) ---

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        operational: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        present: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",

        pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        maintenance: "bg-amber-500/10 text-amber-400 border-amber-500/20",

        rejected: "bg-red-500/10 text-red-400 border-red-500/20",
        offline: "bg-red-500/10 text-red-400 border-red-500/20",
        absent: "bg-red-500/10 text-red-400 border-red-500/20",
    };

    const defaultStyle = "bg-muted text-muted-foreground border-border";

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles[status] || defaultStyle}`}>
            {status}
        </span>
    );
}

function KpiCard({ title, value, sub, icon: Icon, color }: any) {
    const colors: Record<string, string> = {
        blue: "text-blue-500 bg-blue-500/10",
        emerald: "text-emerald-500 bg-emerald-500/10",
        amber: "text-amber-500 bg-amber-500/10",
        indigo: "text-indigo-500 bg-indigo-500/10",
    };

    return (
        <motion.div
            whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
            className="bg-card border border-border p-6 rounded-lg transition-all shadow-sm"
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{title}</h3>
                    <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
                </div>
                <div className={`p-2 rounded-md ${colors[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
                {sub}
            </p>
        </motion.div>
    );
}

function DashboardHeader({ title, subtitle }: { title: string, subtitle: string }) {
    const { profile, signOut } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: any) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex justify-between items-center mb-10">
            <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
                <p className="text-muted-foreground">{subtitle}</p>
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-3 bg-card hover:bg-muted border border-border pl-4 pr-3 py-2 rounded-full transition-colors"
                >
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-bold text-foreground">{profile?.full_name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">{profile?.role}</div>
                    </div>
                    <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 text-primary font-bold">
                        {profile?.full_name?.charAt(0) || 'U'}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-lg shadow-2xl overflow-hidden z-50"
                        >
                            <div className="p-2 space-y-1">
                                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors text-left">
                                    <UserIcon className="h-4 w-4" /> My Profile
                                </button>
                                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors text-left">
                                    <Settings className="h-4 w-4" /> Settings
                                </button>
                                <div className="h-px bg-border my-1" />
                                <button
                                    onClick={signOut}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors text-left"
                                >
                                    <LogOut className="h-4 w-4" /> Sign Out
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// --- MAIN PAGE COMPONENT ---

export default function DashboardPage() {
    const { profile, loading } = useAuth();

    if (loading) return <div className="h-screen w-full flex items-center justify-center text-muted-foreground animate-pulse">Loading Interface...</div>;

    // Role-Based Routing
    if (profile?.role === 'trainee') return <TraineeDashboard />;
    if (profile?.role === 'trainer') return <TrainerDashboard />;
    if (profile?.role === 'admin') return <AdminDashboard />;

    return <div className="p-8 text-white">Access Denied or Unknown Role.</div>;
}


// --- 1. TRAINEE DASHBOARD ---
function TraineeDashboard() {
    const { user, profile } = useAuth();
    const [activeView, setActiveView] = useState('dashboard');
    const [collapsed, setCollapsed] = useState(false);

    // LMS/Portal States
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(2);
    const [stats] = useState({
        overallProgress: 68,
        attendance: 94,
        nextExamDays: 2
    });

    const [myCourses] = useState([
        { id: 1, title: 'Private Pilot License (PPL)', progress: 85, status: 'active' },
        { id: 2, title: 'Aviation Meteorology', progress: 45, status: 'active' },
    ]);

    const [upcomingSchedule] = useState([
        { id: 1, time: '09:00 AM', title: 'Simulator Session A', location: 'SIM ROOM 04' },
        { id: 2, time: '01:30 PM', title: 'Air Law Lecture', location: 'HALL B' },
        { id: 3, time: '04:00 PM', title: 'Radio Comms Lab', location: 'CBT LAB 1' },
    ]);

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            <DashboardSidebar
                activeView={activeView}
                setActiveView={setActiveView}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                onCreateNew={() => { }}
            />

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto relative text-slate-900">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-8 py-4 flex justify-between items-center border-b border-slate-200">
                    <div />
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setShowNotifications(true)}
                            className="relative p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <Bell className="h-5 w-5 text-slate-500" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 rounded-full border-2 border-white text-[8px] flex items-center justify-center text-white font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <div className="relative w-64 hidden md:block">
                            <input
                                type="text"
                                placeholder="Search"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                        </div>
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-bold text-slate-900">{profile?.full_name}</div>
                                <div className="text-[10px] text-blue-600 font-bold uppercase">Trainee</div>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                                <img src={`https://ui-avatars.com/api/?name=${profile?.full_name}&background=0D8ABC&color=fff`} alt="Profile" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
                    <AnimatePresence mode="wait">
                        {activeView === 'dashboard' && (
                            <motion.div
                                key="dashboard"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                <h1 className="text-3xl font-bold text-slate-900">Welcome, {profile?.full_name?.split(' ')[0] || 'Trainee'}.</h1>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
                                        <div className="relative h-20 w-20">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RePieChart>
                                                    <Pie
                                                        data={[{ value: stats.overallProgress }, { value: 100 - stats.overallProgress }]}
                                                        innerRadius={25}
                                                        outerRadius={35}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        <Cell fill="#2563EB" />
                                                        <Cell fill="#F1F5F9" />
                                                    </Pie>
                                                </RePieChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-blue-600">
                                                {stats.overallProgress}%
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Overall Progress</p>
                                            <h4 className="text-xl font-bold text-slate-900 italic underline decoration-blue-200 underline-offset-4">Advanced Level</h4>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 p-6 rounded-[32px] text-white flex items-center gap-6 border border-slate-800 shadow-xl shadow-blue-500/10">
                                        <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5">
                                            <div className="text-center">
                                                <div className="text-lg font-black leading-none">02</div>
                                                <div className="text-[8px] font-bold uppercase text-blue-300">Days</div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Next Exam</p>
                                            <h4 className="text-lg font-bold">Meteorology Adv.</h4>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
                                        <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                                            <div className="text-center">
                                                <div className="text-lg font-black text-emerald-600 leading-none">{stats.attendance}%</div>
                                                <div className="text-[8px] font-bold uppercase text-emerald-400">Rate</div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attendance Rate</p>
                                            <h4 className="text-lg font-bold text-slate-900">Good Standing</h4>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="flex justify-between items-center px-4">
                                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider italic">My Current Courses</h3>
                                            <button onClick={() => setActiveView('learning')} className="text-xs font-bold text-blue-600 hover:underline">View Catalog</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {myCourses.map((course) => (
                                                <div key={course.id} className="bg-white border border-slate-100 p-5 rounded-3xl hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                                                            <BookOpen className="h-6 w-6" />
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{course.progress}% Completed</span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-4 italic underline decoration-transparent group-hover:decoration-blue-200 underline-offset-4">{course.title}</h4>
                                                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${course.progress}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="px-4">
                                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider italic">Upcoming Schedule</h3>
                                        </div>
                                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                                            {upcomingSchedule.map((item, idx) => (
                                                <div key={item.id} className="flex gap-4 group">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className={`h-3 w-3 rounded-full mt-1.5 ${idx === 0 ? 'bg-blue-600 ring-4 ring-blue-50' : 'bg-slate-200'}`} />
                                                        {idx !== upcomingSchedule.length - 1 && <div className="w-0.5 flex-1 bg-slate-100" />}
                                                    </div>
                                                    <div className="pb-6">
                                                        <p className="text-[10px] font-black text-blue-600 uppercase mb-1">{item.time}</p>
                                                        <h5 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</h5>
                                                        <div className="flex items-center gap-2 mt-2 text-[9px] font-bold text-slate-400 uppercase">
                                                            <MapPin className="h-3 w-3" /> {item.location}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={() => setActiveView('schedule')} className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">Full Calendar</button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeView === 'my-learning' && (
                            <motion.div key="my-learning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <MyLearning />
                            </motion.div>
                        )}
                        {activeView === 'schedule' && (
                            <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <TraineeSchedule />
                            </motion.div>
                        )}
                        {activeView === 'messages' && (
                            <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <MessagingSystem />
                            </motion.div>
                        )}
                        {activeView === 'certificates' && (
                            <motion.div key="certificates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <Certifications />
                            </motion.div>
                        )}
                        {activeView === 'resources' && (
                            <motion.div key="resources" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <Resources />
                            </motion.div>
                        )}
                        {activeView === 'profile' && (
                            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <TraineeProfile />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <NotificationsDialog
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                userId={user?.id || ''}
            />
        </div>
    );
}

// --- 2. TRAINER DASHBOARD ---
// --- 2. TRAINER DASHBOARD (Aviation Theme) ---
function TrainerDashboard() {
    const { user, profile } = useAuth();
    const [activeView, setActiveView] = useState('dashboard');
    const [collapsed, setCollapsed] = useState(false);

    // LMS States
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
    const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
    const [stats, setStats] = useState({
        activeStudents: 0,
        pendingGrades: 0,
        nextSession: null as any
    });

    const fetchData = async () => {
        if (!user) return;

        // Fetch Stats
        const { count: activeCount } = await supabase.from('enrollments').select('user_id', { count: 'exact', head: true }).eq('status', 'active');
        const { count: pendingCount } = await supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'submitted');
        const { data: sessionData } = await supabase.from('sessions').select('*').gt('start_time', new Date().toISOString()).order('start_time', { ascending: true }).limit(1);

        setStats({
            activeStudents: activeCount || 0,
            pendingGrades: pendingCount || 0,
            nextSession: sessionData?.[0] || null
        });

        // Fetch Notifications for "Needs Attention"
        const { data: notifs } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);
        if (notifs) setNotifications(notifs);

        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);
        setUnreadCount(count || 0);
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // Handle course management
    const openManageClass = (id: string) => {
        setSelectedCourseId(id);
        setActiveView('manage-class');
    };

    return (
        <div className="flex h-screen bg-secondary/10 overflow-hidden">
            <DashboardSidebar
                activeView={activeView}
                setActiveView={setActiveView}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                onCreateNew={() => { setShowCreateCourseModal(true); setActiveView('my-classes'); }}
            />

            <div className="flex-1 overflow-y-auto relative">
                {/* Header Section */}
                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-8 py-4 flex justify-between items-center border-b border-border">
                    <div />
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setShowNotifications(true)}
                            className="relative p-2 hover:bg-muted rounded-full transition-colors"
                        >
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 rounded-full border-2 border-background text-[8px] flex items-center justify-center text-white font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <div className="relative w-64 hidden md:block">
                            <input
                                type="text"
                                placeholder="Search"
                                className="w-full bg-background border border-border rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="h-10 w-10 rounded-full bg-muted overflow-hidden border border-border">
                            <img src="https://ui-avatars.com/api/?name=Captain+Diop&background=0D8ABC&color=fff" alt="Profile" />
                        </div>
                    </div>
                </div>

                <div className="p-8 max-w-7xl mx-auto pb-20">
                    <AnimatePresence mode="wait">
                        {activeView === 'dashboard' && (
                            <motion.div
                                key="dashboard"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-8"
                                >
                                    <h1 className="text-3xl font-bold text-foreground">Welcome back, {profile?.full_name?.split(' ')[0] || 'Teacher'}.</h1>
                                </motion.div>

                                {/* Stats Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                    <motion.div
                                        whileHover={{ y: -5 }}
                                        onClick={() => setActiveView('students')}
                                        className="bg-card p-6 rounded-xl shadow-sm border border-border flex items-center gap-4 cursor-pointer"
                                    >
                                        <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                                            <Plane className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground font-medium">Active Students:</p>
                                            <p className="text-2xl font-bold text-foreground">{stats.activeStudents}</p>
                                        </div>
                                    </motion.div>
                                    <motion.div
                                        whileHover={{ y: -5 }}
                                        onClick={() => setActiveView('gradebook')}
                                        className="bg-card p-6 rounded-xl shadow-sm border border-border flex items-center gap-4 relative overflow-hidden cursor-pointer"
                                    >
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            {stats.pendingGrades > 0 && (
                                                <>
                                                    <span className="h-2 w-2 bg-amber-400 rounded-full animate-pulse"></span>
                                                    <span className="h-2 w-2 bg-amber-400 rounded-full animate-pulse delay-75"></span>
                                                </>
                                            )}
                                        </div>
                                        <div className="h-12 w-12 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground font-medium">Pending Grades:</p>
                                            <p className="text-2xl font-bold text-foreground">{stats.pendingGrades}</p>
                                        </div>
                                    </motion.div>
                                    <motion.div
                                        whileHover={{ y: -5 }}
                                        onClick={() => setActiveView('schedule')}
                                        className="bg-card p-6 rounded-xl shadow-sm border border-border flex items-center gap-4 cursor-pointer"
                                    >
                                        <div className="h-12 w-12 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500">
                                            <Clock className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground font-medium">Next Session:</p>
                                            {stats.nextSession ? (
                                                <p className="text-xl font-bold text-foreground">
                                                    {new Date(stats.nextSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}h,
                                                    <span className="text-muted-foreground font-normal text-base"> {stats.nextSession.location}</span>
                                                </p>
                                            ) : (
                                                <p className="text-lg font-bold text-muted-foreground italic">No upcoming sessions</p>
                                            )}
                                        </div>
                                    </motion.div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Main Column: Active Courses (Shortcut) */}
                                    <div className="lg:col-span-2">
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-xl font-bold text-foreground">Recent Classes</h2>
                                            <button onClick={() => setActiveView('my-classes')} className="text-sm text-primary font-bold hover:underline">View All</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* We can fetch real courses here, for now using minimal mockup to save space */}
                                            <div className="bg-card rounded-xl shadow-sm border border-border p-8 text-center opacity-60">
                                                <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                                <p className="text-sm">Quick access to your classes will appear here.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Sidebar: Needs Attention */}
                                    <div className="lg:col-span-1">
                                        <div className="bg-card rounded-xl shadow-sm border border-border p-6 h-full min-h-[500px]">
                                            <h2 className="text-xl font-bold text-foreground mb-6">Needs Attention</h2>
                                            <div className="space-y-6">
                                                {notifications.length === 0 ? (
                                                    <div className="text-center py-10 opacity-50">
                                                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                                                        <p className="text-sm">All caught up!</p>
                                                    </div>
                                                ) : (
                                                    notifications.map((item) => (
                                                        <div key={item.id} className="pb-6 border-b border-border last:border-0 last:pb-0">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${item.type === 'priority' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                                                                    }`}>
                                                                    {item.type}
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-sm text-foreground font-medium mb-3 line-clamp-2">
                                                                {item.title}
                                                            </p>
                                                            <div className="flex gap-2 mb-3">
                                                                <button
                                                                    onClick={() => {
                                                                        if (item.action_link?.includes('grade')) setActiveView('gradebook');
                                                                        else setShowNotifications(true);
                                                                    }}
                                                                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-lg transition-colors shadow-lg shadow-primary/20"
                                                                >
                                                                    {item.type === 'priority' ? 'Grade Now' : 'View Detail'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}

                                                <div className="pt-4 text-center">
                                                    <button
                                                        onClick={() => setShowNotifications(true)}
                                                        className="text-sm text-primary hover:underline font-medium transition-colors"
                                                    >
                                                        View All Notifications
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeView === 'my-classes' && (
                            <motion.div
                                key="my-classes"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <MyClasses
                                    instructorId={user?.id || ''}
                                    onManageClass={openManageClass}
                                    showCreateModal={showCreateCourseModal}
                                    setShowCreateModal={setShowCreateCourseModal}
                                />
                            </motion.div>
                        )}

                        {activeView === 'manage-class' && (
                            <motion.div
                                key="manage-class"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <ManageClass
                                    courseId={selectedCourseId || ''}
                                    userId={user?.id || ''}
                                    onBack={() => setActiveView('my-classes')}
                                />
                            </motion.div>
                        )}

                        {activeView === 'schedule' && (
                            <motion.div
                                key="schedule"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <Schedule userId={user?.id || ''} />
                            </motion.div>
                        )}

                        {activeView === 'messages' && (
                            <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <MessagingSystem />
                            </motion.div>
                        )}

                        {activeView === 'gradebook' && (
                            <motion.div
                                key="gradebook"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <Gradebook
                                    instructorId={user?.id || ''}
                                    onGradeNow={(sid) => {
                                        setSelectedSubmissionId(sid);
                                        setActiveView('grading');
                                    }}
                                />
                            </motion.div>
                        )}

                        {activeView === 'grading' && (
                            <motion.div
                                key="grading"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <Grading
                                    submissionId={selectedSubmissionId || ''}
                                    onBack={() => setActiveView('gradebook')}
                                />
                            </motion.div>
                        )}

                        {activeView === 'reports' && (
                            <motion.div
                                key="reports"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <Reports userId={user?.id || ''} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <NotificationsDialog
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                userId={user?.id || ''}
            />
        </div>
    )
}

// --- 3. ADMIN DASHBOARD ---
function AdminDashboard() {
    const { user, profile } = useAuth();
    const [activeView, setActiveView] = useState('dashboard');
    const [collapsed, setCollapsed] = useState(false);

    const [assets, setAssets] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalRevenue: 1200000,
        systemHealth: 99.8,
        auditAlerts: 3,
        activeLicenses: 450
    });
    const [revenueData] = useState([
        { name: 'Jan', revenue: 100, enrollment: 250 },
        { name: 'Feb', revenue: 200, enrollment: 180 },
        { name: 'Mar', revenue: 150, enrollment: 300 },
        { name: 'Apr', revenue: 250, enrollment: 220 },
        { name: 'May', revenue: 350, enrollment: 400 },
        { name: 'Jun', revenue: 500, enrollment: 450 },
    ]);
    const [recentLogs] = useState([
        { user: 'Trainer Diop', action: 'Grade Updated', module: 'ATC L2', time: '2 mins ago', status: 'Success' },
        { user: 'Trainer Diop', action: 'Grade Updated', module: 'ATC L2', time: '2 mins ago', status: 'Success' },
        { user: 'Trainer Diop', action: 'Grade Updated', module: 'ATC L2', time: '2 mins ago', status: 'Success' },
        { user: 'Trainer Diop', action: 'Grade Updated', module: 'ATC L2', time: '2 mins ago', status: 'Success' },
        { user: 'Trainer Diop', action: 'Grade Updated', module: 'ATC L2', time: '2 mins ago', status: 'Success' },
        { user: 'Trainer Diop', action: 'Grade Updated', module: 'ATC L2', time: '2 mins ago', status: 'Success' },
        { user: 'Trainer Diop', action: 'Grade Updated', module: 'ATC L2', time: '2 mins ago', status: 'Success' },
        { user: 'Trainer Diop', action: 'Grade Updated', module: 'ATC L2', time: '2 mins ago', status: 'Success' },
    ]);

    const [pendingUsers, setPendingUsers] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch Assets
            const { data: assetsData } = await supabase.from('assets').select('*');
            if (assetsData) {
                setAssets(assetsData);
                const operational = assetsData.filter(a => a.status === 'operational').length;
                setStats(prev => ({ ...prev, operationalRate: Math.round((operational / assetsData.length) * 100) }));
            }

            // Fetch Recent Logs
            const { data: logsData } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(5);
            if (logsData) setLogs(logsData);

            // Fetch Pending Users
            const { data: pendingData } = await supabase.from('profiles').select('*').eq('status', 'pending');
            if (pendingData) setPendingUsers(pendingData);
        };
        fetchData();
    }, []);

    const handleApprove = async (id: string) => {
        const { error } = await supabase.from('profiles').update({ status: 'approved' }).eq('id', id);
        if (!error) {
            setPendingUsers(prev => prev.filter(u => u.id !== id));
            await supabase.from('audit_logs').insert({ action: 'User Approved', target_resource: 'User ID: ' + id });
        }
    };

    const handleReject = async (id: string) => {
        const { error } = await supabase.from('profiles').update({ status: 'rejected' }).eq('id', id);
        if (!error) {
            setPendingUsers(prev => prev.filter(u => u.id !== id));
        }
    };

    return (
        <div className="flex h-screen bg-[#050505] overflow-hidden text-gray-300">
            <DashboardSidebar
                activeView={activeView}
                setActiveView={setActiveView}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
            />

            <div className="flex-1 overflow-y-auto relative">
                {/* Admin Header */}
                <div className="sticky top-0 z-10 bg-[#050505]/80 backdrop-blur-md px-8 py-4 flex justify-between items-center border-b border-white/5">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Home</span>
                        <span className="text-gray-500">/</span>
                        <span className="text-gray-500">Governance</span>
                        <span className="text-gray-500">/</span>
                        <span className="text-white">Dashboard</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">{profile?.role || 'Administrator'}</div>
                            <div className="text-sm font-bold text-white uppercase italic tracking-tighter">{profile?.full_name}</div>
                        </div>
                        <div className="h-10 w-10 rounded-full border border-white/10 overflow-hidden">
                            <img src={`https://ui-avatars.com/api/?name=${profile?.full_name}&background=222&color=fff`} alt="Admin" />
                        </div>
                    </div>
                </div>

                <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
                    {/* Views Switching */}
                    {activeView === 'dashboard' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            {/* Admin Stats Row */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                Total Revenue (YTD): <TrendingUp className="h-3 w-3 text-emerald-500" />
                                            </p>
                                            <p className="text-3xl font-black text-white">${(stats.totalRevenue / 1000000).toFixed(1)}M</p>
                                        </div>
                                    </div>
                                    <div className="h-12 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={revenueData.slice(-4)}>
                                                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                System Health: <CheckCircle className="h-3 w-3 text-emerald-500" />
                                            </p>
                                            <p className="text-3xl font-black text-white">{stats.systemHealth}%</p>
                                        </div>
                                    </div>
                                    <div className="h-12 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={revenueData.map(d => ({ v: 90 + Math.random() * 10 }))}>
                                                <Area type="monotone" dataKey="v" stroke="#10B981" fill="#10B981" fillOpacity={0.1} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-[#2D1D1D] border border-red-500/10 rounded-xl p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-red-300 uppercase tracking-widest flex items-center gap-2">
                                                Open Audit Alerts: <AlertCircle className="h-3 w-3 text-red-500" />
                                            </p>
                                            <p className="text-3xl font-black text-white">{stats.auditAlerts}</p>
                                        </div>
                                    </div>
                                    <div className="h-12 w-full flex items-end gap-1">
                                        {[3, 5, 2, 8, 4, 10, 6].map((v, i) => (
                                            <div key={i} className="bg-red-500/50 w-full" style={{ height: `${v * 10}%`, borderRadius: '2px' }} />
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                Active Licenses:
                                            </p>
                                            <p className="text-3xl font-black text-white">{stats.activeLicenses}</p>
                                        </div>
                                    </div>
                                    <div className="h-12 w-full flex items-end gap-1">
                                        {[2, 4, 6, 8, 10, 8, 9].map((v, i) => (
                                            <div key={i} className="bg-blue-500/50 w-full" style={{ height: `${v * 10}%`, borderRadius: '2px' }} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                {/* Charts Column */}
                                <div className="lg:col-span-3 space-y-8">
                                    <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
                                        <h3 className="text-sm font-bold text-white mb-6">Enrollment & Revenue Trends (Last 6 Months)</h3>
                                        <div className="h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={revenueData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                                                    <YAxis stroke="#555" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px' }}
                                                        itemStyle={{ fontSize: '10px' }}
                                                    />
                                                    <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#colorRev)" />
                                                    <Area type="monotone" dataKey="enrollment" stroke="#94A3B8" strokeWidth={2} fill="none" dot={{ r: 3, fill: '#fff' }} />
                                                    <defs>
                                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 text-white">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-sm font-bold">Trainee Origin Data</h3>
                                            <button className="text-[10px] font-bold text-gray-500 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg">Generate Report</button>
                                        </div>
                                        <div className="h-64 bg-[#0A0A0A] rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center">
                                            <Globe className="h-32 w-32 text-white/5 animate-pulse" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 to-transparent" />
                                            {/* Heatmap markers */}
                                            <div className="absolute top-1/2 left-1/3 h-4 w-4 bg-amber-500 rounded-full blur-md animate-pulse" />
                                            <div className="absolute top-1/4 left-1/2 h-6 w-6 bg-red-500 rounded-full blur-lg animate-pulse" />
                                            <div className="absolute bottom-1/3 right-1/4 h-3 w-3 bg-red-400 rounded-full blur-sm animate-pulse" />
                                        </div>
                                    </div>
                                </div>

                                {/* Logs Column */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden flex flex-col h-full">
                                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Recent Activity Log</h3>
                                            <button className="text-[10px] font-bold text-gray-500 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg">Generate Report</button>
                                        </div>
                                        <div className="flex-1 overflow-x-auto">
                                            <table className="w-full text-left text-[11px]">
                                                <thead>
                                                    <tr className="border-b border-white/5 text-gray-500">
                                                        <th className="px-6 py-3 font-bold uppercase">User</th>
                                                        <th className="px-6 py-3 font-bold uppercase">Action</th>
                                                        <th className="px-6 py-3 font-bold uppercase">Module</th>
                                                        <th className="px-6 py-3 font-bold uppercase">Timestamp</th>
                                                        <th className="px-6 py-3 font-bold uppercase">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {recentLogs.map((log, idx) => (
                                                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                                            <td className="px-6 py-4 font-medium text-gray-300">{log.user}</td>
                                                            <td className="px-6 py-4 text-gray-400">{log.action}</td>
                                                            <td className="px-6 py-4 text-gray-400 font-mono italic">{log.module}</td>
                                                            <td className="px-6 py-4 text-gray-500">{log.time}</td>
                                                            <td className="px-6 py-4">
                                                                <span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-tight group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                                    {log.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeView === 'users' && <UserManagement />}
                    {activeView === 'messages' && (
                        <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <MessagingSystem />
                        </motion.div>
                    )}
                    {activeView === 'finance' && <Finance />}
                    {activeView === 'audit' && <AuditLogs />}
                    {activeView === 'settings' && <AdminSettings />}
                </div>
            </div>
        </div>
    );
}
