"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from '@/components/providers/AuthProvider';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { Bell, Moon, Sun, ChevronLeft, ChevronRight, Settings, MoreVertical, Edit2, Trash2, Download, SlidersHorizontal, Triangle, Circle, Hexagon, Diamond, Focus, Plus, Loader2, Users, ShieldCheck, AlertTriangle, CheckCircle2, Clock, BookOpen, UserCheck, Star, Zap, Activity, Database, Inbox, Award, User, Mail } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import SessionFormModal from "./SessionFormModal";
import DocumentFormModal from "./DocumentFormModal";
import StandardFormModal from "./StandardFormModal";
import UserDetailModal from './UserDetailModal';
import RoleManagement from "./RoleManagement";
import { Can } from "@/components/common/Can";
import { usePermissions } from "@/hooks/usePermissions";
import { 
    SYSTEM_HEALTH_DATA, 
    KEY_INDICATORS_DATA, 
    SKILLS_EVALUATION_DATA, 
    EVOLUTION_DATA, 
    COURSE_AVG_DATA,
    TRAINEE_KPI_CARDS,
    LEVEL2_KPI_CARDS,
    TRAINER_KPI_CARDS,
    ADMIN_KPI_CARDS
} from "@/lib/mockData";


const getDynamicStatsCategories = (stats: any) => [
    { name: "Documents", current: stats?.docs24h || 0, last24h: stats?.docs24h || 0, thisWeek: stats?.documents || 0, thisMonth: stats?.documents || 0, total: stats?.documents?.toLocaleString() || "0" },
    { name: "Signups", current: stats?.users24h || 0, last24h: stats?.users24h || 0, thisWeek: stats?.totalUsers || 0, thisMonth: stats?.totalUsers || 0, total: stats?.totalUsers?.toLocaleString() || "0" },
    { name: "Courses", current: stats?.sessions || 0, last24h: 0, thisWeek: stats?.sessions || 0, thisMonth: stats?.sessions || 0, total: stats?.sessions?.toLocaleString() || "0" },
    { name: "Exams", current: stats?.exams || 0, last24h: 0, thisWeek: stats?.exams || 0, thisMonth: stats?.exams || 0, total: stats?.exams?.toLocaleString() || "0" },
    { name: "Certificates", current: stats?.certs24h || 0, last24h: stats?.certs24h || 0, thisWeek: stats?.certificates || 0, thisMonth: stats?.certificates || 0, total: stats?.certificates?.toLocaleString() || "0" },
    { name: "Attendances", current: stats?.attendances || 0, last24h: 0, thisWeek: stats?.attendances || 0, thisMonth: stats?.attendances || 0, total: stats?.attendances?.toLocaleString() || "0" }
];

const getDynamicTraineeKpis = (stats: any) => [
    { icon: <Users className="w-5 h-5" />, name: "Active Trainees", balance: stats?.trainees?.toLocaleString() || "0", crypto: `Out of ${stats?.totalUsers || 0} registered`, rate: "Live Database Count", progress: stats?.totalUsers > 0 ? (stats.trainees / stats.totalUsers) * 100 : 0, color: "#1D4ED8" },
    { icon: <ShieldCheck className="w-5 h-5" />, name: "Global Compliance", balance: "88.5%", crypto: `${stats?.certificates || 0} Fully Certified`, rate: "Target: 95% by Q3", progress: 88, color: "#10B981" },
    { icon: <AlertTriangle className="w-5 h-5" />, name: "Pending Renewals", balance: "142", crypto: "Expiring in 30 days", rate: "12 critical expirations today", progress: 15, color: "#EF4444" },
    { icon: <CheckCircle2 className="w-5 h-5" />, name: "Avg. Pass Rate", balance: `${stats?.passRate || 0}%`, crypto: "First-attempt success", rate: "Live Database", progress: stats?.passRate || 0, color: "#059669" },
    { icon: <Clock className="w-5 h-5" />, name: "Hours Logged", balance: `${stats?.hoursLogged || 0} hrs`, crypto: "Total training time", rate: "Avg. per session", progress: 75, color: "#F59E0B" },
    { icon: <BookOpen className="w-5 h-5" />, name: "Modules Completed", balance: stats?.certificates?.toLocaleString() || "0", crypto: `Across ${stats?.sessions || 0} active sessions`, rate: "Based on certificates", progress: 0, color: "#8B5CF6" },
];
const getDynamicTrainerKpis = (stats: any) => [
    { icon: <UserCheck className="w-5 h-5" />, name: "Active Trainers", balance: stats?.trainers?.toLocaleString() || "0", crypto: `Out of ${stats?.trainers || 0} rostered`, rate: "93% Core Availability", progress: 93, color: "#1D4ED8" },
    { icon: <Star className="w-5 h-5" />, name: "Average Rating", balance: "4.8/5", crypto: "From 1.2k reviews", rate: "Top 10% Industry", progress: 96, color: "#10B981" },
    { icon: <Zap className="w-5 h-5" />, name: "Sessions Conducted", balance: stats?.sessions?.toLocaleString() || "0", crypto: "Total active sessions", rate: "Live Database", progress: 75, color: "#8B5CF6" },
    { icon: <Clock className="w-5 h-5" />, name: "Hours Taught", balance: `${stats?.hoursLogged || 0} hrs`, crypto: "Total classroom hours", rate: "Target: 1,500 hrs", progress: 94, color: "#F59E0B" },
    { icon: <Award className="w-5 h-5" />, name: "Certifications", balance: stats?.certificates?.toLocaleString() || "0", crypto: "Active teaching certs", rate: "Verified in DB", progress: 97, color: "#059669" },
    { icon: <Inbox className="w-5 h-5" />, name: "Open Slots", balance: "18", crypto: "Available this week", rate: "High demand expected", progress: 15, color: "#EF4444" },
];
const getDynamicAdminKpis = (stats: any) => [
    { icon: <Activity className="w-5 h-5" />, name: "System Health", balance: "99.9%", crypto: "All services operational", rate: "Uptime: 30 days", progress: 99, color: "#10B981" },
    { icon: <ShieldCheck className="w-5 h-5" />, name: "Active Admins", balance: stats?.admins?.toLocaleString() || "0", crypto: "Registered administrators", rate: "Live Database", progress: 62, color: "#3B82F6" },
    { icon: <AlertTriangle className="w-5 h-5" />, name: "Security Alerts", balance: "0", crypto: "No critical threats", rate: "Last scan: 2m ago", progress: 0, color: "#F59E0B" },
    { icon: <Database className="w-5 h-5" />, name: "Recent Logs", balance: "Live", crypto: "Generated today", rate: "+5% vs Avg", progress: 70, color: "#6366F1" },
    { icon: <CheckCircle2 className="w-5 h-5" />, name: "Pending Tasks", balance: stats?.pendingTasks?.toLocaleString() || "0", crypto: "System approvals", rate: "Action required", progress: 40, color: "#8B5CF6" },
    { icon: <Database className="w-5 h-5" />, name: "DB Storage", balance: "42%", crypto: "Healthy growth", rate: "Supabase Cloud", progress: 42, color: "#EC4899" },
];

export default function PurpleAdminDashboard() {
    const { profile, startImpersonation } = useAuth();
    const [darkMode, setDarkMode] = useState(false);
    const [activeNav, setActiveNav] = useState("Home");
    const [showTraineeFilter, setShowTraineeFilter] = useState(false);
    const [showTrainerFilter, setShowTrainerFilter] = useState(false);
    const [showAdminFilter, setShowAdminFilter] = useState(false);
    const [traineeLevel, setTraineeLevel] = useState("Level 1");
    const [selectedTrainees, setSelectedTrainees] = useState<number[]>([]);
    const [selectedTrainers, setSelectedTrainers] = useState<number[]>([]);
    const [selectedAdmins, setSelectedAdmins] = useState<number[]>([]);
    
    // Home States
    const [expertViewIndex, setExpertViewIndex] = useState(0);
    const [statsIndex, setStatsIndex] = useState(0);
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [trainees, setTrainees] = useState<any[]>([]);
    const [trainers, setTrainers] = useState<any[]>([]);
    const [administrators, setAdministrators] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [allUsersRaw, setAllUsersRaw] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dashboardStats, setDashboardStats] = useState<any>(null);
    const [selectedUserForEdit, setSelectedUserForEdit] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    // Drill-down View State
    const [drillDownView, setDrillDownView] = useState<string | null>(null);
    const [drillDownData, setDrillDownData] = useState<any[]>([]);
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [isStandardModalOpen, setIsStandardModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

    useEffect(() => {
        setIsMounted(true);
        fetchAllData();
    }, []);

    async function fetchAllData() {
        setLoading(true);
        await Promise.all([
            fetchStats(),
            fetchUsers()
        ]);
        setLoading(false);
    }

    async function fetchStats() {
        try {
            const now = new Date();
            const last24hDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

            const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
            const { count: participantCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'participant');
            const { count: trainerCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'instructor');
            const { count: adminCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'ernam_admin');
            const { count: sessionCount } = await supabase.from('sessions').select('*', { count: 'exact', head: true });
            const { count: certCount } = await supabase.from('certificates').select('*', { count: 'exact', head: true });
            const { count: attendanceCount } = await supabase.from('session_participants').select('*', { count: 'exact', head: true }).eq('attendance_status', 'attended');
            const { count: docCount } = await supabase.from('documents').select('*', { count: 'exact', head: true });
            const { count: examCount } = await supabase.from('assessments').select('*', { count: 'exact', head: true });
            const { count: passCount } = await supabase.from('assessments').select('*', { count: 'exact', head: true }).eq('result', 'pass');
            const { count: pendingUserCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'pending');

            // Hours Logged calculation (estimate from sessions)
            const { data: sessionDurations } = await supabase.from('sessions').select('start_date, end_date');
            const totalHours = sessionDurations?.reduce((acc, s) => {
                const start = new Date(s.start_date);
                const end = new Date(s.end_date);
                return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            }, 0) || 0;

            // Activity filters for 24h
            const { count: u24 } = await supabase.from('users').select('*', { count: 'exact', head: true }).gt('created_at', last24hDate);
            const { count: d24 } = await supabase.from('documents').select('*', { count: 'exact', head: true }).gt('created_at', last24hDate);
            const { count: c24 } = await supabase.from('certificates').select('*', { count: 'exact', head: true }).gt('created_at', last24hDate);

            setDashboardStats({
                totalUsers: usersCount || 0,
                trainees: participantCount || 0,
                trainers: trainerCount || 0,
                admins: adminCount || 0,
                sessions: sessionCount || 0,
                certificates: certCount || 0,
                attendances: attendanceCount || 0,
                documents: docCount || 0,
                exams: examCount || 0,
                users24h: u24 || 0,
                docs24h: d24 || 0,
                certs24h: c24 || 0,
                passRate: examCount ? Math.round((passCount! / examCount) * 100) : 0,
                hoursLogged: Math.round(totalHours),
                pendingTasks: pendingUserCount || 0
            });
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    }

    async function fetchUsers() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id,
                    full_name,
                    email,
                    role,
                    created_at,
                    phone,
                    status,
                    session_instructors (
                        sessions (id)
                    ),
                    session_participants (
                        attendance_status,
                        sessions (
                            start_date,
                            training_standards (title)
                        )
                    ),
                    audit_logs (
                        action,
                        created_at
                    )
                `);

            if (error) throw error;
            if (!data) return;

            setAllUsersRaw(data || []);
            setAllUsers(data.map(u => ({
                id: u.id,
                name: u.full_name || "Unknown",
                role: u.role === 'ernam_admin' ? 'Administrator' : u.role === 'instructor' ? 'Trainer' : 'Trainee',
                email: u.email,
                phone: u.phone || "N/A",
                status: u.status === 'approved' ? 'excellent' : 'average',
                avatar: (u.full_name || "U").substring(0, 2).toUpperCase(),
                color: u.role === 'ernam_admin' ? '#388E3C' : u.role === 'instructor' ? '#FF9800' : '#1976D2'
            })));

            // Map Trainees
            const tData = data.filter(u => u.role === 'participant').map(u => {
                const latest = u.session_participants?.[0];
                const session: any = Array.isArray(latest?.sessions) ? latest.sessions[0] : latest?.sessions;
                const standard: any = Array.isArray(session?.training_standards) ? session.training_standards[0] : session?.training_standards;
                
                return {
                    id: u.id,
                    date: session?.start_date ? format(new Date(session.start_date), "dd MMM yyyy") : "N/A",
                    time: session?.start_date ? format(new Date(session.start_date), "HH:mm a") : "",
                    trainee: u.full_name || "Unknown",
                    role: "Student",
                    status: latest?.attendance_status?.toUpperCase().replace('_', ' ') || "PENDING",
                    statusColor: latest?.attendance_status === 'enrolled' ? "#3B82F6" : 
                                 latest?.attendance_status === 'attended' ? "#10B981" : "#EF4444",
                    moduleTitle: standard?.title || "No Module",
                    moduleProgress: "N/A",
                    performanceNum: "N/A",
                    performanceText: "Grade: -",
                    traineeId: `#TRN-${u.id.substring(0,6).toUpperCase()}`,
                    email: u.email
                };
            });
            setTrainees(tData);

            // Fetch Drill-down data if active
            if (activeNav === "Home" && drillDownView) {
                fetchDrillDownData(drillDownView);
            }

            // Map Trainers ... (rest of function)
            const trData = data.filter(u => u.role === 'instructor').map(u => ({
                id: u.id,
                date: u.created_at ? format(new Date(u.created_at), "dd MMM yyyy") : "N/A",
                time: "",
                trainer: u.full_name || "Unknown",
                role: "Instructor",
                status: u.status === 'approved' ? "AVAILABLE" : "UNAVAILABLE",
                statusColor: u.status === 'approved' ? "#10B981" : "#EF4444",
                specialization: "Aviation Faculty",
                activeSessions: `${u.session_instructors?.length || 0} Classes`,
                performanceNum: "4.5",
                performanceText: "Rating: Good",
                trainerId: `#INS-${u.id.substring(0,6).toUpperCase()}`,
                email: u.email
            }));
            setTrainers(trData);

            // Map Admins
            const aData = data.filter(u => u.role === 'ernam_admin' || u.role === 'admin').map(u => {
                const lastLog = u.audit_logs?.[0];
                return {
                    id: u.id,
                    date: u.created_at ? format(new Date(u.created_at), "dd MMM yyyy") : "N/A",
                    time: "",
                    admin: u.full_name || "Unknown",
                    role: "System Admin",
                    status: "ACTIVE",
                    statusColor: "#10B981",
                    lastAction: lastLog?.action || "System Login",
                    securityLevel: "Lv. 4",
                    adminId: `#ADM-${u.id.substring(0,6).toUpperCase()}`,
                    email: u.email
                };
            });
            setAdministrators(aData);

        } catch (err) {
            console.error("Error fetching users:", err);
        }
    }

    async function handleDeleteUser(id: string) {
        if (!confirm("Are you sure you want to delete this user? This will remove their authentication and profile.")) return;
        
        try {
            const authRes = await supabase.auth.getSession();
            const token = authRes.data.session?.access_token;
            const adminId = authRes.data.session?.user?.id;
            const res = await fetch(`/api/admin/manage-user?id=${id}${adminId ? `&adminId=${adminId}` : ''}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to delete user');
            }
            
            alert("User deleted successfully");
            fetchUsers(); // Refresh
            fetchStats(); // Refresh stats
        } catch (err: any) {
            alert(err.message);
        }
    }

    function handleEditUser(user: any) {
        const rawUser = allUsersRaw.find(u => u.id === user.id);
        if (rawUser) {
            setSelectedUserForEdit(rawUser);
            setIsEditModalOpen(true);
        } else {
            console.error("Raw user not found for ID:", user.id);
            // Fallback: try to use the user object directly if it has enough info
            if (user.email) {
                setSelectedUserForEdit(user);
                setIsEditModalOpen(true);
            }
        }
    }

    const { hasPermission } = usePermissions();
    const navItems = ["Home", "Trainees", "Trainers", "Administrators"];
    if (isMounted && hasPermission('System:manage_roles')) {
        navItems.push("Roles");
    }

    // Home Methods
    const currentStats = getDynamicStatsCategories(dashboardStats);
    const nextStat = () => setStatsIndex((prev) => (prev + 1) % currentStats.length);
    const prevStat = () => setStatsIndex((prev) => (prev === 0 ? currentStats.length - 1 : prev - 1));
    const nextExpertView = () => setExpertViewIndex((prev) => (prev + 1) % expertViews.length);
    const prevExpertView = () => setExpertViewIndex((prev) => (prev === 0 ? expertViews.length - 1 : prev - 1));

    const expertViews = [
        {
            title: "Course Tracking",
            content: (
                <div className="grid grid-cols-2 gap-3 h-full pb-2">
                    <div className="bg-blue-600 text-white p-3 rounded-xl flex flex-col justify-center shadow-sm">
                        <span className="text-[11px] font-semibold opacity-90 mb-1">Tracked Students</span>
                        <span className="text-2xl font-black">{dashboardStats?.trainees || 0}</span>
                    </div>
                    <div className="bg-emerald-600 text-white p-3 rounded-xl flex flex-col justify-center shadow-sm">
                        <span className="text-[11px] font-semibold opacity-90 mb-1">Global Certs</span>
                        <span className="text-2xl font-black">{dashboardStats?.certificates || 0}</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 text-gray-800 p-3 rounded-xl flex flex-col justify-center col-span-2 shadow-sm">
                        <span className="text-[11px] font-bold text-gray-500 mb-1">Active Sessions</span>
                        <span className="text-2xl font-black">{dashboardStats?.sessions || 0}</span>
                    </div>
                </div>
            )
        },
        {
            title: "Average Evolution",
            content: (
                <div className="h-full pb-2">
                    {isMounted && (
                        <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={EVOLUTION_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 'bold' }} dy={10} />
                            <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB" }} />
                            <Line type="basis" dataKey="val" stroke="#1D4ED8" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                        </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            )
        },
        {
            title: "Average by Course",
            content: (
                <div className="h-full pb-2">
                    {isMounted && (
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={COURSE_AVG_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                            <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB" }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {COURSE_AVG_DATA.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            )
        },
        {
            title: "Insights & Impact",
            content: (
                <div className="grid grid-cols-1 gap-3 h-full pb-2 overflow-y-auto custom-scrollbar pr-1">
                    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                        <h4 className="font-bold text-sm text-gray-900 mb-2">Empirical Observation</h4>
                        <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                            <li>Scattered reports</li>
                            <li>Unclear follow-ups to decisions</li>
                        </ul>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                        <h4 className="font-bold text-sm text-gray-900 mb-2">Strategic Impact</h4>
                        <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                            <li>Traceability of decisions</li>
                            <li>Institutional coherence</li>
                        </ul>
                    </div>
                </div>
            )
        }
    ];

    async function fetchDrillDownData(view: string) {
        setLoading(true);
        try {
            let data: any[] = [];
            switch (view) {
                case "Certificates":
                    const { data: certs } = await supabase
                        .from('certificates')
                        .select('*, user:users(full_name), session:sessions(training_standard:training_standards(title))')
                        .order('created_at', { ascending: false });
                    data = certs || [];
                    break;
                case "Attendances":
                    const { data: atts } = await supabase
                        .from('session_participants')
                        .select('*, user:participant_id(full_name), session:sessions(training_standard:training_standards(title))')
                        .eq('attendance_status', 'attended')
                        .order('id', { ascending: false });
                    data = atts || [];
                    break;
                case "Courses":
                    const { data: sessions } = await supabase
                        .from('sessions')
                        .select('*, training_standard:training_standards(code, title), session_instructors(instructor:users(full_name))')
                        .order('start_date', { ascending: false });
                    data = sessions || [];
                    break;
                case "Signups":
                    const { data: users } = await supabase
                        .from('users')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(100);
                    data = users || [];
                    break;
                case "Documents":
                    const { data: docs } = await supabase
                        .from('documents')
                        .select('*, uploader:uploaded_by(full_name), session:sessions(training_standard:training_standards(title))')
                        .order('created_at', { ascending: false });
                    data = docs || [];
                    break;
                case "Exams":
                    const { data: exams } = await supabase
                        .from('assessments')
                        .select('*, user:participant_id(full_name), session:sessions(training_standard:training_standards(title))')
                        .order('created_at', { ascending: false });
                    data = exams || [];
                    break;
            }
            setDrillDownData(data);
        } catch (err) {
            console.error("Error fetching drill-down data:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (drillDownView) fetchDrillDownData(drillDownView);
    }, [drillDownView]);

    const handleAddRecord = (view: string) => {
        setSelectedRecord(null);
        if (view === "Courses") setIsSessionModalOpen(true);
        else if (view === "Documents") setIsDocumentModalOpen(true);
        else if (view === "Signups") setActiveNav("Trainees");
        else if (view === "Certificates") setIsStandardModalOpen(true); // Temporary: issue through standard
    };

    const renderDrillDownView = (view: string) => (
        <div className="min-h-screen bg-gray-50 flex flex-col p-8 animate-in slide-in-from-right duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setDrillDownView(null)}
                        className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all border border-gray-200 group"
                    >
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">{view}</h2>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
                            {drillDownData.length} records found in {view.toLowerCase()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    {["Courses", "Documents", "Certificates", "Signups"].includes(view) && (
                        <Can I={view === "Courses" ? "sessions:create" : view === "Documents" ? "docs:create" : view === "Certificates" ? "certs:create" : "users:create"}>
                            <button 
                                onClick={() => handleAddRecord(view)}
                                className="flex items-center gap-2 px-6 py-3 bg-[#12388D] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                <Plus className="w-4 h-4" /> Add New {view === "Signups" ? "User" : "Entry"}
                            </button>
                        </Can>
                    )}
                </div>
            </div>

            {/* List Table */}
            <div className="flex-1 bg-white rounded-[32px] border border-gray-200 shadow-xl overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center p-20 flex-col gap-4">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Records...</span>
                        </div>
                    ) : drillDownData.length === 0 ? (
                        <div className="flex items-center justify-center p-20 flex-col gap-4">
                            <Focus className="w-12 h-12 text-gray-200" />
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Records Match This Criteria</span>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                    <th className="px-8 py-5">
                                        {view === "Certificates" ? "CERT # / HOLDER" : 
                                         view === "Documents" ? "TITLE / UPLOADER" : 
                                         view === "Courses" ? "COURSE CODE / TITLE" :
                                         view === "Signups" ? "NAME / EMAIL" : "NAME / SUBJECT"}
                                    </th>
                                    <th className="px-8 py-5">
                                        {view === "Courses" ? "INSTRUCTORS" : 
                                         view === "Documents" ? "ASSOCIATED SESSION" : 
                                         view === "Certificates" ? "TRAINING STANDARD" :
                                         view === "Exams" ? "SESSION" : "CATEGORY / DETAILS"}
                                    </th>
                                    <th className="px-8 py-5 text-center">STATUS</th>
                                    <th className="px-8 py-5 text-right">{view === "Exams" ? "SCORE" : "DATE"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {drillDownData.map((item, idx) => (
                                    <tr 
                                        key={idx} 
                                        onClick={() => {
                                            setSelectedRecord(item);
                                            if (view === "Courses") setIsSessionModalOpen(true);
                                            else if (view === "Documents") setIsDocumentModalOpen(true);
                                        }}
                                        className="group hover:bg-blue-50/30 transition-all cursor-pointer"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="font-black text-sm text-gray-900 leading-tight">
                                                {view === "Courses" ? (item.training_standard?.code || item.id.substring(0,8)) :
                                                 item.certificate_number || item.title || item.full_name || item.user?.full_name || "Unidentified Record"}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                                {view === "Courses" ? item.training_standard?.title :
                                                 view === "Documents" ? `By ${item.uploader?.full_name || 'System'}` :
                                                 item.user?.full_name || item.email || item.id.substring(0,8)}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-[12px] font-bold text-gray-600">
                                                {view === "Courses" ? (item.session_instructors?.map((si: any) => si.instructor?.full_name).join(", ") || "No Trainer") :
                                                 view === "Documents" ? item.session?.training_standard?.title :
                                                 view === "Certificates" ? item.standard?.title :
                                                 view === "Attendances" ? item.session?.training_standard?.title :
                                                 view === "Exams" ? item.session?.training_standard?.title :
                                                 item.role || "Global"}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                item.status === 'valid' || item.attendance_status === 'attended' || item.status === 'active' || item.status === 'approved' || item.result === 'pass'
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                    : "bg-red-50 text-red-600 border-red-100"
                                            )}>
                                                {item.status || item.attendance_status || item.result || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right font-mono text-xs font-bold text-gray-500">
                                            {view === "Exams" ? `${item.score}%` : 
                                             item.issue_date ? format(new Date(item.issue_date), 'dd/MM/yyyy') :
                                             item.start_date ? format(new Date(item.start_date), 'dd/MM/yy') :
                                             item.created_at ? format(new Date(item.created_at), 'dd/MM/yy') : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );

    const renderHomeView = () => {
        if (drillDownView) return renderDrillDownView(drillDownView);
        
        return (
            <div className="min-h-screen font-sans bg-gray-50 text-gray-900 pb-12">
            {/* Top Navigation - LIGHT MODE */}
            <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
                <div className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200 rounded-full pr-5 pl-1.5 py-1.5 shadow-sm cursor-pointer group">
                    <div className="flex items-center -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 border-2 border-[#12388D] relative z-10 group-hover:-translate-x-1 transition-transform">
                            <img src="/logos/asecna-logo.png" alt="ASECNA" className="w-full h-full object-contain rounded-full" />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 border-2 border-[#12388D] relative z-20 shadow-sm group-hover:translate-x-1 transition-transform">
                            <img src="/logos/ernam-logo.png" alt="ERNAM" className="w-full h-full object-contain rounded-full" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-900 font-black text-sm leading-tight tracking-wide">ASECNA - ERNAM</span>
                        <span className="text-blue-600 font-bold text-[10px] leading-tight flex items-center gap-1.5 uppercase tracking-widest opacity-90">
                            Digital Twin <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    {navItems.map((item) => (
                        <button
                            key={item}
                            onClick={() => setActiveNav(item)}
                            className={`text-sm font-semibold transition-colors pb-1 ${activeNav === item ? "text-blue-700 border-b-2 border-blue-700" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button className="text-gray-500 hover:text-gray-900"><Bell className="w-5 h-5" /></button>
                    <button className="text-gray-500 hover:text-gray-900" onClick={() => setDarkMode(!darkMode)}>
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <button className="text-gray-500 hover:text-gray-900"><Settings className="w-5 h-5" /></button>
                    <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 cursor-pointer hover:bg-gray-200 transition-colors">
                        <span className="text-gray-800 text-sm font-semibold">{profile?.full_name || "Admin"}</span>
                        <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                            {profile?.full_name?.charAt(0) || "A"}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="px-8 py-8 space-y-4 max-w-[1600px] mx-auto">
                <div className="grid grid-cols-3 gap-6">
                    {/* Key Indicators */}
                    <div className="bg-white rounded-2xl p-5 flex flex-col shadow-sm border border-gray-200 h-[240px]">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-gray-900 font-black text-lg tracking-tight">Key Indicators</h3>
                        </div>
                        <div className="flex-1 w-full mt-2">
                            {isMounted && (
                                <ResponsiveContainer width="100%" height="80%">
                                    <LineChart data={KEY_INDICATORS_DATA} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 'bold' }} dy={10} />
                                        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB" }} />
                                        <Line type="basis" dataKey="blue" stroke="#00AAE4" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                        <Line type="basis" dataKey="green" stroke="#26A17B" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Skills Evaluation */}
                    <div className="bg-white rounded-2xl p-5 flex flex-col shadow-sm border border-gray-200 h-[240px]">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-gray-900 font-black text-lg tracking-tight">Skills Evaluation</h3>
                        </div>
                        <div className="flex-1 w-full mt-2">
                            {isMounted && (
                                <ResponsiveContainer width="100%" height="80%">
                                    <BarChart data={SKILLS_EVALUATION_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barCategoryGap="20%">
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                                        <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB" }} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {SKILLS_EVALUATION_DATA.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Expert Carousel */}
                    <div className="bg-white rounded-2xl p-5 flex flex-col shadow-sm border border-gray-200 h-[240px] relative">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-gray-900 font-black text-lg tracking-tight">{expertViews[expertViewIndex].title}</h3>
                            <div className="flex items-center gap-1">
                                <button onClick={prevExpertView} className="p-1 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button onClick={nextExpertView} className="p-1 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 w-full overflow-hidden">
                            {expertViews[expertViewIndex].content}
                        </div>
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                            {expertViews.map((_, idx) => (
                                <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === expertViewIndex ? 'w-4 bg-blue-600' : 'w-1.5 bg-gray-300'}`} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-6 pb-2">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-col justify-center">
                        <button 
                            onClick={() => setDrillDownView(getDynamicStatsCategories(dashboardStats)[statsIndex].name)}
                            className="text-left group/opt"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider group-hover/opt:text-blue-600 transition-colors">Options</span>
                                <div className="flex items-center space-x-0.5">
                                    <button onClick={(e) => { e.stopPropagation(); prevStat(); }} className="p-0.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); nextStat(); }} className="p-0.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="text-blue-700 font-black text-xl truncate group-hover/opt:underline decoration-2 underline-offset-4">
                                {getDynamicStatsCategories(dashboardStats)[statsIndex].name}
                            </div>
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl p-4 flex flex-col justify-center shadow-sm border border-gray-200">
                        <div className="text-gray-500 font-bold text-[10px] uppercase tracking-wider mb-1">Current</div>
                        <div className="text-gray-900 font-black text-2xl">{getDynamicStatsCategories(dashboardStats)[statsIndex].current}</div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 flex flex-col justify-center shadow-sm border border-gray-200">
                        <div className="text-gray-500 font-bold text-[10px] uppercase tracking-wider mb-1">Last 24h</div>
                        <div className="text-gray-900 font-black text-2xl">{getDynamicStatsCategories(dashboardStats)[statsIndex].last24h}</div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 flex flex-col justify-center shadow-sm border border-gray-200">
                        <div className="text-gray-500 font-bold text-[10px] uppercase tracking-wider mb-1">This Week</div>
                        <div className="text-gray-900 font-black text-2xl">{getDynamicStatsCategories(dashboardStats)[statsIndex].thisWeek}</div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 flex flex-col justify-center shadow-sm border border-gray-200">
                        <div className="text-gray-500 font-bold text-[10px] uppercase tracking-wider mb-1">This Month</div>
                        <div className="text-gray-900 font-black text-2xl">{getDynamicStatsCategories(dashboardStats)[statsIndex].thisMonth}</div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 flex flex-col justify-center shadow-sm border border-gray-200">
                        <div className="text-gray-500 font-bold text-[10px] uppercase tracking-wider mb-1">Total</div>
                        <div className="text-emerald-600 font-black text-2xl">{getDynamicStatsCategories(dashboardStats)[statsIndex].total}</div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6 pb-12 h-[380px]">
                    <div className="col-span-9 bg-white rounded-2xl overflow-hidden flex flex-col shadow-sm border border-gray-200 h-full">
                        <div className="p-5 pb-3 flex-shrink-0 z-20 bg-gray-50 border-b border-gray-200">
                            <h3 className="text-gray-900 font-black text-lg">System Users</h3>
                        </div>
                        <div className="overflow-auto flex-1 custom-scrollbar pb-16">
                            <table className="w-full text-left relative">
                                <thead className="sticky top-0 z-20 bg-white shadow-sm border-b border-gray-100">
                                    <tr className="text-gray-500 text-[11px] uppercase tracking-wider">
                                        <th className="px-5 py-3 font-bold">Names</th>
                                        <th className="px-3 py-3 font-bold">Role</th>
                                        <th className="px-3 py-3 font-bold">Email</th>
                                        <th className="px-3 py-3 font-bold">Number</th>
                                        <th className="px-3 py-3 font-bold text-center">Status</th>
                                        <th className="px-3 py-3 font-bold text-center">Preview</th>
                                        <th className="px-3 py-3 font-bold text-center">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(activeNav === "Home" ? allUsers : []).map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm" style={{ background: user.color + "15", color: user.color }}>
                                                        {user.avatar}
                                                    </div>
                                                    <span className="text-gray-900 font-bold text-[13px] whitespace-nowrap">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`text-[10px] px-2.5 py-1 uppercase tracking-wider rounded-md font-bold whitespace-nowrap ${
                                                    user.role === 'Administrator' ? 'bg-purple-100 text-purple-700' : 
                                                    user.role === 'Trainer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-gray-600 font-semibold text-xs whitespace-nowrap">{user.email}</td>
                                            <td className="px-3 py-3 text-gray-600 font-medium text-xs whitespace-nowrap">{user.phone}</td>
                                            <td className="px-3 py-3">
                                                <div className="flex justify-center group/tooltip relative">
                                                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm cursor-help ${
                                                        user.status === 'excellent' ? 'bg-emerald-500' : 
                                                        user.status === 'average' ? 'bg-blue-500' : 'bg-red-500 animate-pulse'
                                                    }`} />
                                                    <div className="absolute bottom-full mb-1.5 hidden group-hover/tooltip:flex items-center justify-center bg-gray-900 border border-gray-800 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1.5 rounded shadow-lg whitespace-nowrap z-50">
                                                        {user.status === 'failing' ? 'Needs Attention' : user.status}
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 relative text-center">
                                                <div className="relative inline-block">
                                                    <button onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)} className={`p-1.5 rounded-md transition-colors ${openDropdownId === user.id ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-900'}`}>
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                    
                                                    {openDropdownId === user.id && (
                                                        <div className="absolute right-8 top-full -mt-2 w-44 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in duration-150">
                                                            <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 font-semibold transition-colors">
                                                                <User className="w-3.5 h-3.5 text-gray-400" /> View Profile
                                                            </button>
                                                            <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 font-semibold transition-colors">
                                                                <Mail className="w-3.5 h-3.5 text-gray-400" /> Send Message
                                                            </button>
                                                            <div className="h-px bg-gray-100 my-1 mx-3" />
                                                            <Can I="users:impersonate">
                                                                <button 
                                                                    onClick={() => {
                                                                        const rawUser = allUsersRaw.find(u => u.id === user.id);
                                                                        if (rawUser) startImpersonation(rawUser);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-xs text-indigo-600 hover:bg-indigo-50 flex items-center gap-2.5 font-bold transition-colors"
                                                                >
                                                                    <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Act As
                                                                </button>
                                                            </Can>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button 
                                                        onClick={() => handleEditUser(user)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col h-full">
                        <h3 className="text-gray-900 font-black text-[15px] mb-3 flex-shrink-0">System Security & Health</h3>
                        <div className="relative w-full flex-1 min-h-0">
                            {isMounted && (
                        <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={SYSTEM_HEALTH_DATA}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="65%"
                                        outerRadius="95%"
                                        strokeWidth={2}
                                        stroke="#fff"
                                        dataKey="value"
                                    >
                                        {SYSTEM_HEALTH_DATA.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", color: "#111827", fontWeight: "bold", fontSize: "11px", padding: "4px 8px" }}
                                        formatter={(value) => [`${value}%`, ""]}
                                        itemStyle={{ margin: 0 }}
                                    />
                                </PieChart>
                                </ResponsiveContainer>
                    )}
                            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                <span className="text-emerald-500 font-black text-2xl leading-none">98%</span>
                                <span className="text-gray-400 font-bold text-[8px] uppercase tracking-widest mt-0.5">Health</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-2 gap-y-4 mt-4 border-t border-gray-100 pt-4 flex-shrink-0">
                            <div className="flex flex-col">
                                <span className="text-gray-500 font-medium text-[8px] uppercase tracking-wider mb-0.5">Response</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)] flex-shrink-0" />
                                    <span className="text-gray-900 font-bold text-[11px] truncate">42 ms</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-500 font-medium text-[8px] uppercase tracking-wider mb-0.5">Error Rate</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                    <span className="text-gray-900 font-bold text-[11px] truncate">0.02%</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-500 font-medium text-[8px] uppercase tracking-wider mb-0.5">Blocked</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                    <span className="text-gray-900 font-bold text-[11px] truncate">1,432 Today</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-500 font-medium text-[8px] uppercase tracking-wider mb-0.5">Uptime</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                    <span className="text-gray-900 font-bold text-[11px] truncate">99.99%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        );
    };

    const renderTraineesView = () => {
        const currentKpis = traineeLevel === "Level 1" ? getDynamicTraineeKpis(dashboardStats) : LEVEL2_KPI_CARDS;
        const currentRoster = traineeLevel === "Level 1" ? trainees : [];
        
        return (
        <div className="min-h-screen font-sans bg-gray-50 text-gray-900 pb-20">
            {/* Top Navigation - LIGHT MODE (Same as Home) */}
            <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
                <div className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200 rounded-full pr-5 pl-1.5 py-1.5 shadow-sm cursor-pointer group">
                    <div className="flex items-center -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 border-2 border-[#12388D] relative z-10 group-hover:-translate-x-1 transition-transform">
                            <img src="/logos/asecna-logo.png" alt="ASECNA" className="w-full h-full object-contain rounded-full" />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 border-2 border-[#12388D] relative z-20 shadow-sm group-hover:translate-x-1 transition-transform">
                            <img src="/logos/ernam-logo.png" alt="ERNAM" className="w-full h-full object-contain rounded-full" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-900 font-black text-sm leading-tight tracking-wide">ASECNA - ERNAM</span>
                        <span className="text-blue-600 font-bold text-[10px] leading-tight flex items-center gap-1.5 uppercase tracking-widest opacity-90">
                            Digital Twin <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    {navItems.map((item) => (
                        <button
                            key={item}
                            onClick={() => setActiveNav(item)}
                            className={`text-sm font-semibold transition-colors pb-1 ${activeNav === item ? "text-blue-700 border-b-2 border-blue-700" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button className="text-gray-500 hover:text-gray-900"><Bell className="w-5 h-5" /></button>
                    <button className="text-gray-500 hover:text-gray-900" onClick={() => setDarkMode(!darkMode)}>
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <button className="text-gray-500 hover:text-gray-900"><Settings className="w-5 h-5" /></button>
                    <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 cursor-pointer hover:bg-gray-200 transition-colors">
                        <span className="text-gray-800 text-sm font-semibold">{profile?.full_name || "Admin"}</span>
                        <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                            {profile?.full_name?.charAt(0) || "A"}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Wallet Content */}
            <div className="px-8 py-10 space-y-6 max-w-[1600px] mx-auto mt-4">
                {/* Back Link */}
                <button 
                    onClick={() => setActiveNav("Home")}
                    className="flex items-center gap-2 text-gray-400 hover:text-blue-600 font-bold text-xs uppercase tracking-widest transition-colors group mb-2"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Overview
                </button>

                {/* Header: Tabs & Networks */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex gap-8">
                        <button 
                            onClick={() => setTraineeLevel("Level 1")}
                            className={`text-2xl font-black pb-2 border-b-2 transition-colors ${traineeLevel === "Level 1" ? "border-blue-600 text-gray-900" : "border-transparent text-gray-300 hover:text-gray-500"}`}>
                                Level 1
                        </button>
                        <button 
                            onClick={() => setTraineeLevel("Level 2")}
                            className={`text-2xl font-black pb-2 border-b-2 transition-colors ${traineeLevel === "Level 2" ? "border-blue-600 text-gray-900" : "border-transparent text-gray-300 hover:text-gray-500"}`}>
                                Level 2
                        </button>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Networks:</span>
                            <Triangle className="w-4 h-4 text-emerald-500" fill="currentColor" />
                            <Circle className="w-4 h-4 text-amber-500" fill="currentColor" />
                            <Hexagon className="w-4 h-4 text-gray-400" fill="currentColor" />
                            <Diamond className="w-4 h-4 text-blue-500" fill="currentColor" />
                            <Circle className="w-4 h-4 text-green-500" fill="currentColor" />
                        </div>
                    </div>
                </div>

                {/* Learning & Training KPI Cards */}
                <div className="grid grid-cols-6 gap-5">
                    {currentKpis.map((card: any, idx: number) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-[20px] p-5 flex flex-col relative overflow-hidden group hover:shadow-md transition-all cursor-pointer">
                            {/* Background Glow Line & Blur */}
                            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] opacity-10 group-hover:opacity-15 transition-opacity" style={{ background: card.color }} />
                            
                            {/* Header */}
                            <div className="flex justify-between items-center mb-4 relative z-10">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm" style={{ background: `${card.color}15` }}>
                                        {card.icon}
                                    </div>
                                    <span className="text-gray-800 font-bold text-[14px]">{card.name}</span>
                                </div>
                                <div className="w-2.5 h-2.5 rounded-full border border-gray-200 group-hover:border-blue-400 transition-colors bg-gray-50" />
                            </div>

                            {/* Balances */}
                            <div className="relative z-10 mb-5">
                                <div className="text-gray-900 font-black text-2xl tracking-tight mb-0.5">{card.balance}</div>
                                <div className="text-gray-500 font-medium text-[11px]">{card.crypto}</div>
                            </div>

                            {/* Rate Slider / Bottom element */}
                            <div className="relative z-10 w-full mt-auto">
                                <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${card.progress}%`, backgroundColor: card.color }} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-gray-50" style={{ color: card.color }}>Status</span>
                                    <span className="text-[10px] text-gray-500 font-medium tracking-tight truncate">{card.rate}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trainee Roster Header */}
                <div className="pt-10 pb-4 flex flex-col gap-4 border-b border-gray-200">
                    <div className="flex justify-between items-end">
                        <div className="transition-all">
                            <h2 className="text-2xl font-black text-gray-900 leading-tight mb-1">Trainee Roster</h2>
                            <p className="text-gray-500 text-sm font-medium">Monitor enrolled trainees, course progress, and recent system activity.</p>
                        </div>
                        <div className="flex gap-3 pb-1 relative">
                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100 shadow-sm"><Download className="w-4 h-4"/></button>
                            <button 
                                onClick={() => setShowTraineeFilter(!showTraineeFilter)}
                                className={`p-2 rounded-lg transition-colors border shadow-sm ${showTraineeFilter ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-400 hover:text-blue-600 hover:bg-blue-50 border-gray-100'}`}
                            >
                                <SlidersHorizontal className="w-4 h-4"/>
                            </button>

                            {/* Dropdown Filter */}
                            {showTraineeFilter && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Filter by Status</h4>
                                    <div className="space-y-2 mb-4">
                                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                            <input type="checkbox" className="rounded text-blue-600 border-gray-300 focus:ring-blue-500" defaultChecked />
                                            On Track
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                            <input type="checkbox" className="rounded text-amber-500 border-gray-300 focus:ring-amber-500" defaultChecked />
                                            In Progress
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                            <input type="checkbox" className="rounded text-red-500 border-gray-300 focus:ring-red-500" defaultChecked />
                                            At Risk
                                        </label>
                                    </div>
                                    
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pt-3 border-t border-gray-100">Sort By</h4>
                                    <select className="w-full text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 bg-gray-50 text-gray-700">
                                        <option>Recently Active</option>
                                        <option>Highest Score First</option>
                                        <option>Lowest Score First</option>
                                        <option>Alphabetical (A-Z)</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Batch Actions Bar */}
                    {selectedTrainees.length > 0 && (
                        <div className="flex items-center gap-6 bg-blue-50 text-blue-800 px-5 py-3 rounded-xl border border-blue-200 shadow-sm w-full animate-in fade-in slide-in-from-top-2">
                            <span className="font-bold whitespace-nowrap">{selectedTrainees.length} selected</span>
                            <div className="w-px h-5 bg-blue-200"></div>
                            <div className="flex items-center gap-3 w-full">
                                <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm text-gray-700 border border-gray-100 flex-1">Details</button>
                                <Can I="users:impersonate">
                                    <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm text-gray-700 border border-gray-100 flex-1">View As</button>
                                </Can>
                                <Can I="users:edit">
                                    <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm text-gray-700 border border-gray-100 flex-1">Edit</button>
                                </Can>
                                <Can I="users:delete">
                                    <button className="px-3 py-1.5 bg-white text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-200 hover:text-red-700 border border-gray-100 transition-colors shadow-sm flex-1">Delete</button>
                                </Can>
                            </div>
                            <button onClick={() => setSelectedTrainees([])} className="ml-auto text-blue-400 hover:text-blue-600 p-1 flex-shrink-0 flex items-center justify-center">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Trainee Roster Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-widest font-bold border-b border-gray-100">
                                <th className="px-6 py-4 w-12 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                                        checked={currentRoster.length > 0 && selectedTrainees.length === currentRoster.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedTrainees(currentRoster.map(t => t.id));
                                            } else {
                                                setSelectedTrainees([]);
                                            }
                                        }}
                                    />
                                </th>
                                <th className="px-2 py-4">Last Active</th>
                                <th className="px-4 py-4">Trainee</th>
                                <th className="px-4 py-4">Status</th>
                                <th className="px-4 py-4">Current Module</th>
                                <th className="px-4 py-4">Performance</th>
                                <th className="px-6 py-4">Trainee ID / Contact</th>
                                <th className="px-6 py-4 text-center">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {currentRoster.map((tx) => (
                                <tr key={tx.id} className={`transition-colors group ${selectedTrainees.includes(tx.id) ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}>
                                    <td className="px-6 py-5 w-12 text-center">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                                            checked={selectedTrainees.includes(tx.id)}
                                            onChange={() => {
                                                setSelectedTrainees(prev => 
                                                    prev.includes(tx.id) ? prev.filter(id => id !== tx.id) : [...prev, tx.id]
                                                );
                                            }}
                                        />
                                    </td>
                                    <td className="px-2 py-5">
                                        <div className="text-gray-900 font-bold text-xs">{tx.date}</div>
                                        <div className="text-gray-400 text-[10px] mt-0.5">{tx.time}</div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="text-gray-900 font-bold text-[13px]">{tx.trainee}</div>
                                        <div className="text-gray-500 font-medium text-[11px] mt-0.5">{tx.role}</div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 w-fit">
                                            <div className="w-2 h-2 rounded-full shadow-sm" style={{ background: tx.statusColor }} />
                                            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: tx.statusColor }}>{tx.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="text-gray-800 font-bold text-xs mb-0.5">{tx.moduleTitle}</div>
                                        <div className="flex items-center gap-1.5">
                                            <Circle className="w-1.5 h-1.5 fill-blue-600 text-blue-600" />
                                            <span className="text-gray-500 font-medium text-[11px]">{tx.moduleProgress}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className={`font-black text-sm tracking-wide ${tx.statusColor === '#EF4444' ? 'text-red-600' : tx.statusColor === '#F59E0B' ? 'text-amber-600' : 'text-emerald-600'}`}>{tx.performanceNum}</div>
                                        <div className="text-gray-400 text-[10px] font-bold mt-0.5 uppercase">{tx.performanceText}</div>
                                    </td>
                                    <td className="px-6 py-5 max-w-[200px]">
                                        <div className="text-gray-900 font-bold text-xs truncate">{tx.traineeId}</div>
                                        <div className="text-gray-500 text-[11px] mt-0.5 truncate">{tx.email}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <Can I="users:edit">
                                                <button 
                                                    onClick={() => handleEditUser(tx)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100 shadow-sm"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            </Can>
                                            <Can I="users:delete">
                                                <button 
                                                    onClick={() => handleDeleteUser(tx.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-100 shadow-sm"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </Can>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        );
    };

    const renderTrainersView = () => {
        return (
        <div className="min-h-screen font-sans bg-gray-50 text-gray-900 pb-20">
            {/* Top Navigation - LIGHT MODE (Same as Home) */}
            <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
                <div className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200 rounded-full pr-5 pl-1.5 py-1.5 shadow-sm cursor-pointer group">
                    <div className="flex items-center -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 border-2 border-[#12388D] relative z-10 group-hover:-translate-x-1 transition-transform">
                            <img src="/logos/asecna-logo.png" alt="ASECNA" className="w-full h-full object-contain rounded-full" />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 border-2 border-[#12388D] relative z-20 shadow-sm group-hover:translate-x-1 transition-transform">
                            <img src="/logos/ernam-logo.png" alt="ERNAM" className="w-full h-full object-contain rounded-full" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-900 font-black text-sm leading-tight tracking-wide">ASECNA - ERNAM</span>
                        <span className="text-blue-600 font-bold text-[10px] leading-tight flex items-center gap-1.5 uppercase tracking-widest opacity-90">
                            Digital Twin <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    {navItems.map((item) => (
                        <button
                            key={item}
                            onClick={() => setActiveNav(item)}
                            className={`text-sm font-semibold transition-colors pb-1 ${activeNav === item ? "text-blue-700 border-b-2 border-blue-700" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button className="text-gray-500 hover:text-gray-900"><Bell className="w-5 h-5" /></button>
                    <button className="text-gray-500 hover:text-gray-900" onClick={() => setDarkMode(!darkMode)}>
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <button className="text-gray-500 hover:text-gray-900"><Settings className="w-5 h-5" /></button>
                    <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 cursor-pointer hover:bg-gray-200 transition-colors">
                        <span className="text-gray-800 text-sm font-semibold">{profile?.full_name || "Admin"}</span>
                        <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                            {profile?.full_name?.charAt(0) || "A"}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Trainer Content */}
            <div className="px-8 py-10 space-y-6 max-w-[1600px] mx-auto mt-4">
                {/* Back Link */}
                <button 
                    onClick={() => setActiveNav("Home")}
                    className="flex items-center gap-2 text-gray-400 hover:text-blue-600 font-bold text-xs uppercase tracking-widest transition-colors group mb-2"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Overview
                </button>

                {/* Header structure: Trainee view has "Level 1" / "Level 2". For Trainers, NO TABS. */}
                <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
                    <div className="flex gap-8">
                        <h2 className="text-2xl font-black text-gray-900 leading-tight">Trainer Directory</h2>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Networks:</span>
                            <Triangle className="w-4 h-4 text-emerald-500" fill="currentColor" />
                            <Circle className="w-4 h-4 text-amber-500" fill="currentColor" />
                            <Hexagon className="w-4 h-4 text-gray-400" fill="currentColor" />
                            <Diamond className="w-4 h-4 text-blue-500" fill="currentColor" />
                            <Circle className="w-4 h-4 text-green-500" fill="currentColor" />
                        </div>
                    </div>
                </div>

                {/* Trainer KPI Cards */}
                <div className="grid grid-cols-6 gap-5">
                    {getDynamicTrainerKpis(dashboardStats).map((card: any, idx: number) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-[20px] p-5 flex flex-col relative overflow-hidden group hover:shadow-md transition-all cursor-pointer">
                            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] opacity-10 group-hover:opacity-15 transition-opacity" style={{ background: card.color }} />
                            
                            <div className="flex justify-between items-center mb-4 relative z-10">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm" style={{ background: `${card.color}15` }}>
                                        {card.icon}
                                    </div>
                                    <span className="text-gray-800 font-bold text-[14px]">{card.name}</span>
                                </div>
                                <div className="w-2.5 h-2.5 rounded-full border border-gray-200 group-hover:border-blue-400 transition-colors bg-gray-50" />
                            </div>

                            <div className="relative z-10 mb-5">
                                <div className="text-gray-900 font-black text-2xl tracking-tight mb-0.5">{card.balance}</div>
                                <div className="text-gray-500 font-medium text-[11px]">{card.crypto}</div>
                            </div>

                            <div className="relative z-10 w-full mt-auto">
                                <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${card.progress}%`, backgroundColor: card.color }} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-gray-50" style={{ color: card.color }}>Status</span>
                                    <span className="text-[10px] text-gray-500 font-medium tracking-tight truncate">{card.rate}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trainer Roster Header */}
                <div className="pt-10 pb-4 flex flex-col gap-4 border-b border-gray-200">
                    <div className="flex justify-between items-end">
                        <div className="transition-all">
                            <h2 className="text-2xl font-black text-gray-900 leading-tight mb-1">Trainer List</h2>
                            <p className="text-gray-500 text-sm font-medium">Manage faculty, track specializations, and review recent sessions.</p>
                        </div>
                        <div className="flex gap-3 pb-1 relative">
                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100 shadow-sm"><Download className="w-4 h-4"/></button>
                            <button 
                                onClick={() => setShowTrainerFilter(!showTrainerFilter)}
                                className={`p-2 rounded-lg transition-colors border shadow-sm ${showTrainerFilter ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-400 hover:text-blue-600 hover:bg-blue-50 border-gray-100'}`}
                            >
                                <SlidersHorizontal className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>

                    {/* Batch Actions Bar for Trainers */}
                    {selectedTrainers.length > 0 && (
                        <div className="flex items-center gap-6 bg-blue-50 text-blue-800 px-5 py-3 rounded-xl border border-blue-200 shadow-sm w-full animate-in fade-in slide-in-from-top-2">
                            <span className="font-bold whitespace-nowrap">{selectedTrainers.length} selected</span>
                            <div className="w-px h-5 bg-blue-200"></div>
                            <div className="flex items-center gap-3 w-full">
                                <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm text-gray-700 border border-gray-100 flex-1">Profile</button>
                                <Can I="users:impersonate">
                                    <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm text-gray-700 border border-gray-100 flex-1">View As</button>
                                </Can>
                                <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm text-gray-700 border border-gray-100 flex-1">Reassign</button>
                                <Can I="users:edit">
                                    <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm text-gray-700 border border-gray-100 flex-1">Edit</button>
                                </Can>
                                <Can I="users:delete">
                                    <button className="px-3 py-1.5 bg-white text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-200 hover:text-red-700 border border-gray-100 transition-colors shadow-sm flex-1">Remove Faculty</button>
                                </Can>
                            </div>
                            <button onClick={() => setSelectedTrainers([])} className="ml-auto text-blue-400 hover:text-blue-600 p-1 flex-shrink-0 text-xl leading-none">
                                &times;
                            </button>
                        </div>
                    )}
                </div>

                {/* Trainer Roster Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-widest font-bold border-b border-gray-100">
                                <th className="px-6 py-4 w-12 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                                        checked={trainers.length > 0 && selectedTrainers.length === trainers.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedTrainers(trainers.map(t => t.id));
                                            } else {
                                                setSelectedTrainers([]);
                                            }
                                        }}
                                    />
                                </th>
                                <th className="px-2 py-4">Last Active</th>
                                <th className="px-4 py-4">Trainer</th>
                                <th className="px-4 py-4">Status / Avail</th>
                                <th className="px-4 py-4">Specialization</th>
                                <th className="px-4 py-4">Rating</th>
                                <th className="px-6 py-4">Trainer Code / Email</th>
                                <th className="px-6 py-4 text-center">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {trainers.map((tx) => (
                                <tr key={tx.id} className={`transition-colors group ${selectedTrainers.includes(tx.id) ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}>
                                    <td className="px-6 py-5 w-12 text-center">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                                            checked={selectedTrainers.includes(tx.id)}
                                            onChange={() => {
                                                setSelectedTrainers(prev => 
                                                    prev.includes(tx.id) ? prev.filter(id => id !== tx.id) : [...prev, tx.id]
                                                );
                                            }}
                                        />
                                    </td>
                                    <td className="px-2 py-5">
                                        <div className="text-gray-900 font-bold text-xs">{tx.date}</div>
                                        <div className="text-gray-400 text-[10px] mt-0.5">{tx.time}</div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="text-gray-900 font-bold text-[13px]">{tx.trainer}</div>
                                        <div className="text-gray-500 font-medium text-[11px] mt-0.5">{tx.role}</div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 w-fit">
                                            <div className="w-2 h-2 rounded-full shadow-sm" style={{ background: tx.statusColor }} />
                                            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: tx.statusColor }}>{tx.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="text-gray-800 font-bold text-xs mb-0.5">{tx.specialization}</div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-blue-600 font-bold text-[10px]">├óΓÇö┬Å</span>
                                            <span className="text-gray-500 font-medium text-[11px]">{tx.activeSessions}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="font-black text-sm tracking-wide text-gray-900">{tx.performanceNum}</div>
                                        <div className="text-gray-400 text-[10px] font-bold mt-0.5 uppercase">{tx.performanceText}</div>
                                    </td>
                                    <td className="px-6 py-5 max-w-[200px]">
                                        <div className="text-gray-900 font-bold text-xs truncate">{tx.trainerId}</div>
                                        <div className="text-gray-500 text-[11px] mt-0.5 truncate">{tx.email}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <Can I="users:edit">
                                                <button 
                                                    onClick={() => handleEditUser(tx)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100 shadow-sm"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            </Can>
                                            <Can I="users:delete">
                                                <button 
                                                    onClick={() => handleDeleteUser(tx.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-100 shadow-sm"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </Can>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        );
    };
    const renderAdministratorsView = () => {
        return (
            <div className="min-h-screen font-sans bg-gray-50 text-gray-900 pb-20 p-8">
                {/* Back Link */}
                <button 
                    onClick={() => setActiveNav("Home")}
                    className="flex items-center gap-2 text-gray-400 hover:text-blue-600 font-bold text-xs uppercase tracking-widest transition-colors group mb-6"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Overview
                </button>

                <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 leading-tight">System Administrators</h2>
                        <p className="text-gray-500 text-sm font-medium">Manage security credentials and access control.</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-widest font-bold border-b border-gray-100">
                                <th className="px-6 py-4">Administrator</th>
                                <th className="px-4 py-4">Recent Action</th>
                                <th className="px-4 py-4 text-center">Security</th>
                                <th className="px-6 py-4">Account ID / Email</th>
                                <th className="px-6 py-4 text-center">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {administrators.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-5 font-bold text-[13px]">{tx.admin || tx.full_name}</td>
                                    <td className="px-4 py-5 text-gray-500 text-xs font-semibold">{tx.lastAction || "System Login"}</td>
                                    <td className="px-4 py-5 text-center">
                                        <span className="px-2.5 py-1 bg-gray-900 text-white rounded-md font-black text-[10px] tracking-widest">{tx.securityLevel || "TIER 1"}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-gray-900 font-bold text-xs truncate">{tx.adminId || tx.id.substring(0,8)}</div>
                                        <div className="text-gray-500 text-[11px] mt-0.5 truncate">{tx.email}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <Can I="users:edit">
                                                <button 
                                                    onClick={() => handleEditUser(tx)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            </Can>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <React.Fragment>
            {activeNav === "Home" && (drillDownView ? renderDrillDownView(drillDownView) : renderHomeView())}
            {activeNav === "Trainees" && renderTraineesView()}
            {activeNav === "Trainers" && renderTrainersView()}
            {activeNav === "Administrators" && renderAdministratorsView()}
            {activeNav === "Roles" && <RoleManagement />}

            {selectedUserForEdit && (
                <UserDetailModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    user={selectedUserForEdit}
                    onUpdate={fetchUsers}
                />
            )}

            <SessionFormModal 
                isOpen={isSessionModalOpen}
                onClose={() => setIsSessionModalOpen(false)}
                onSuccess={() => {
                    if (drillDownView) fetchDrillDownData(drillDownView);
                    fetchStats();
                }}
                sessionToEdit={selectedRecord}
            />

            <DocumentFormModal 
                isOpen={isDocumentModalOpen}
                onClose={() => {
                    setIsDocumentModalOpen(false);
                    setSelectedRecord(null);
                }}
                onSuccess={() => {
                    fetchDrillDownData("Documents");
                    fetchStats();
                }}
                documentToEdit={selectedRecord}
                onAddNewSession={() => setIsSessionModalOpen(true)}
            />

            <StandardFormModal 
                isOpen={isStandardModalOpen}
                onClose={() => setIsStandardModalOpen(false)}
                onSuccess={() => {
                    if (drillDownView) fetchDrillDownData(drillDownView);
                    fetchStats();
                }}
                standardToEdit={selectedRecord}
            />
        </React.Fragment>
    );
}
