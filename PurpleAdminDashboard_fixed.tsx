"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from '@/components/providers/AuthProvider';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { Bell, Moon, Sun, ChevronLeft, ChevronRight, Settings, MoreVertical, Edit2, Trash2, Download, SlidersHorizontal, Triangle, Circle, Hexagon, Diamond, Focus, Plus, Loader2, Users, ShieldCheck, AlertTriangle, CheckCircle2, Clock, BookOpen, UserCheck, Star, Zap, Activity, Database, Inbox, Award } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import SessionFormModal from "./SessionFormModal";
import DocumentFormModal from "./DocumentFormModal";
import StandardFormModal from "./StandardFormModal";
import UserDetailModal from './UserDetailModal';

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
    { icon: <ShieldCheck className="w-5 h-5" />, name: "Global Compliance", balance: "88.5%", crypto: "1,101 Fully Certified", rate: "Target: 95% by Q3", progress: 88, color: "#10B981" },
    { icon: <AlertTriangle className="w-5 h-5" />, name: "Pending Renewals", balance: "142", crypto: "Expiring in 30 days", rate: "12 critical expirations today", progress: 15, color: "#EF4444" },
    { icon: <CheckCircle2 className="w-5 h-5" />, name: "Avg. Pass Rate", balance: "N/A", crypto: "First-attempt success", rate: "Awaiting exam data", progress: 0, color: "#059669" },
    { icon: <Clock className="w-5 h-5" />, name: "Hours Logged", balance: "8,450 hrs", crypto: "Total learning time this month", rate: "Avg. 6.7 hours per trainee", progress: 75, color: "#F59E0B" },
    { icon: <BookOpen className="w-5 h-5" />, name: "Modules Completed", balance: stats?.certificates?.toLocaleString() || "0", crypto: `Across ${stats?.sessions || 0} active sessions`, rate: "Based on certificates", progress: 0, color: "#8B5CF6" },
];
const getDynamicTrainerKpis = (stats: any) => [
    { icon: <UserCheck className="w-5 h-5" />, name: "Active Trainers", balance: stats?.trainers?.toLocaleString() || "0", crypto: `Out of ${stats?.trainers || 0} rostered`, rate: "93% Core Availability", progress: 93, color: "#1D4ED8" },
    { icon: <Star className="w-5 h-5" />, name: "Average Rating", balance: "4.8/5", crypto: "From 1.2k reviews", rate: "Top 10% Industry", progress: 96, color: "#10B981" },
    { icon: <Zap className="w-5 h-5" />, name: "Sessions Conducted", balance: stats?.sessions?.toLocaleString() || "0", crypto: "Total active sessions", rate: "Live Database", progress: 75, color: "#8B5CF6" },
    { icon: <Clock className="w-5 h-5" />, name: "Hours Taught", balance: "N/A", crypto: "Total classroom hours", rate: "Target: 1,500 hrs", progress: 94, color: "#F59E0B" },
    { icon: <Award className="w-5 h-5" />, name: "Certifications", balance: stats?.certificates?.toLocaleString() || "0", crypto: "Active teaching certs", rate: "Verified in DB", progress: 97, color: "#059669" },
    { icon: <Inbox className="w-5 h-5" />, name: "Open Slots", balance: "18", crypto: "Available this week", rate: "High demand expected", progress: 15, color: "#EF4444" },
];
const getDynamicAdminKpis = (stats: any) => [
    { icon: <Activity className="w-5 h-5" />, name: "System Health", balance: "99.9%", crypto: "All services operational", rate: "Uptime: 30 days", progress: 99, color: "#10B981" },
    { icon: <ShieldCheck className="w-5 h-5" />, name: "Active Admins", balance: stats?.admins?.toLocaleString() || "0", crypto: "Registered administrators", rate: "Live Database", progress: 62, color: "#3B82F6" },
    { icon: <AlertTriangle className="w-5 h-5" />, name: "Security Alerts", balance: "0", crypto: "No critical threats", rate: "Last scan: 2m ago", progress: 0, color: "#F59E0B" },
    { icon: <Database className="w-5 h-5" />, name: "Recent Logs", balance: "1.2k", crypto: "Generated today", rate: "+5% vs Avg", progress: 70, color: "#6366F1" },
    { icon: <CheckCircle2 className="w-5 h-5" />, name: "Pending Tasks", balance: "N/A", crypto: "System approvals", rate: "4 high priority", progress: 40, color: "#8B5CF6" },
    { icon: <Database className="w-5 h-5" />, name: "DB Storage", balance: "42%", crypto: "Healthy growth", rate: "Supabase Cloud", progress: 42, color: "#EC4899" },
];

export default function PurpleAdminDashboard() {
    const { startImpersonation } = useAuth();
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

            // Get counts using proper Supabase v2 syntax
            const { count: usersCount } = await supabase
                .from('users')
                .select('*', { count: 'exact' });
            
            const { count: participantCount } = await supabase
                .from('users')
                .select('*', { count: 'exact' })
                .eq('role', 'participant');
            
            const { count: trainerCount } = await supabase
                .from('users')
                .select('*', { count: 'exact' })
                .eq('role', 'instructor');
            
            const { count: adminCount } = await supabase
                .from('users')
                .select('*', { count: 'exact' })
                .eq('role', 'ernam_admin');
            
            const { count: sessionCount } = await supabase
                .from('sessions')
                .select('*', { count: 'exact' });
            
            const { count: certCount } = await supabase
                .from('certificates')
                .select('*', { count: 'exact' });
            
            const { count: attendanceCount } = await supabase
                .from('session_participants')
                .select('*', { count: 'exact' })
                .eq('attendance_status', 'attended');
            
            const { count: docCount } = await supabase
                .from('documents')
                .select('*', { count: 'exact' });
            
            const { count: examCount } = await supabase
                .from('assessments')
                .select('*', { count: 'exact' });

            // 24h activity counts
            const { count: u24 } = await supabase
                .from('users')
                .select('*', { count: 'exact' })
                .gt('created_at', last24hDate);
            
            const { count: d24 } = await supabase
                .from('documents')
                .select('*', { count: 'exact' })
                .gt('created_at', last24hDate);
            
            const { count: c24 } = await supabase
                .from('certificates')
                .select('*', { count: 'exact' })
                .gt('created_at', last24hDate);

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
                certs24h: c24 || 0
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
                    organization_id,
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
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!data) return;

            setAllUsersRaw(data || []);
            setAllUsers(data.map(u => ({
                id: u.id,
                name: u.full_name || "Unknown",
                role: u.role === 'ernam_admin' ? 'Administrator' : 
                      u.role === 'instructor' ? 'Trainer' : 
                      u.role === 'participant' ? 'Trainee' : u.role,
                email: u.email,
                phone: u.phone || "N/A",
                status: u.status === 'approved' ? 'excellent' : 
                        u.status === 'pending' ? 'average' : 
                        u.status === 'suspended' ? 'poor' : 'average',
                avatar: (u.full_name || "U").substring(0, 2).toUpperCase(),
                color: u.role === 'ernam_admin' ? '#388E3C' : 
                       u.role === 'instructor' ? '#FF9800' : '#1976D2'
            })));

            // Map Trainees
            const tData = data
                .filter(u => u.role === 'participant')
                .map(u => {
                    const latest = u.session_participants?.[0];
                    const session: any = Array.isArray(latest?.sessions) ? latest.sessions[0] : latest?.sessions;
                    const standard: any = Array.isArray(session?.training_standards) ? session.training_standards[0] : session?.training_standards;
                    
                    return {
                        id: u.id,
                        date: u.created_at ? format(new Date(u.created_at), "dd MMM yyyy") : "N/A",
                        time: u.created_at ? format(new Date(u.created_at), "HH:mm a") : "",
                        trainee: u.full_name || "Unknown",
                        role: "Student",
                        status: u.status === 'approved' ? "ACTIVE" : 
                                u.status === 'pending' ? "PENDING" : 
                                u.status === 'suspended' ? "SUSPENDED" : "UNKNOWN",
                        statusColor: u.status === 'approved' ? "#10B981" : 
                                     u.status === 'pending' ? "#F59E0B" : 
                                     u.status === 'suspended' ? "#EF4444" : "#6B7280",
                        moduleTitle: standard?.title || "No Module",
                        moduleProgress: "N/A",
                        performanceNum: "N/A",
                        performanceText: "Grade: -",
                        traineeId: `#TRN-${u.id.substring(0,6).toUpperCase()}`,
                        email: u.email
                    };
                });
            setTrainees(tData);

            // Map Trainers
            const trData = data
                .filter(u => u.role === 'instructor')
                .map(u => {
                    const sessionCount = u.session_instructors?.length || 0;
                    const latestAudit = u.audit_logs?.[0];
                    
                    return {
                        id: u.id,
                        date: latestAudit?.created_at ? 
                              format(new Date(latestAudit.created_at), "dd MMM yyyy") : 
                              (u.created_at ? format(new Date(u.created_at), "dd MMM yyyy") : "N/A"),
                        time: latestAudit?.created_at ? 
                              format(new Date(latestAudit.created_at), "HH:mm a") : "",
                        trainer: u.full_name || "Unknown",
                        role: "Instructor",
                        status: u.status === 'approved' ? "AVAILABLE" : 
                                u.status === 'pending' ? "PENDING APPROVAL" : 
                                u.status === 'suspended' ? "UNAVAILABLE" : "UNKNOWN",
                        statusColor: u.status === 'approved' ? "#10B981" : 
                                     u.status === 'pending' ? "#F59E0B" : 
                                     u.status === 'suspended' ? "#EF4444" : "#6B7280",
                        specialization: "Aviation Faculty",
                        activeSessions: `${sessionCount} Classes`,
                        performanceNum: "4.5",
                        performanceText: "Rating: Good",
                        trainerId: `#INS-${u.id.substring(0,6).toUpperCase()}`,
                        email: u.email
                    };
                });
            setTrainers(trData);

            // Map Administrators
            const adminData = data
                .filter(u => u.role === 'ernam_admin')
                .map(u => {
                    const latestAudit = u.audit_logs?.[0];
                    
                    return {
                        id: u.id,
                        admin: u.full_name || "Unknown",
                        lastAction: latestAudit?.action || "System Login",
                        securityLevel: "TIER 1",
                        adminId: `#ADM-${u.id.substring(0,6).toUpperCase()}`,
                        email: u.email,
                        full_name: u.full_name,
                        status: u.status,
                        created_at: u.created_at
                    };
                });
            setAdministrators(adminData);

            // Fetch Drill-down data if active
            if (activeNav === "Home" && drillDownView) {
                fetchDrillDownData(drillDownView);
            }

        } catch (err) {
            console.error("Error fetching users:", err);
        }
    }

    async function fetchDrillDownData(viewType: string) {
        try {
            let data: any[] = [];
            
            switch(viewType) {
                case "Sessions":
                    const { data: sessions } = await supabase
                        .from('sessions')
                        .select(`
                            *,
                            training_standards (title, code),
                            session_instructors (users (full_name)),
                            session_participants (count)
                        `)
                        .order('start_date', { ascending: false });
                    
                    data = (sessions || []).map(s => ({
                        id: s.id,
                        title: s.training_standards?.title || "Unknown",
                        code: s.training_standards?.code || "N/A",
                        date: s.start_date ? format(new Date(s.start_date), "dd MMM yyyy") : "N/A",
                        instructor: s.session_instructors?.[0]?.users?.full_name || "Not assigned",
                        participants: s.session_participants?.[0]?.count || 0,
                        status: s.status,
                        color: s.status === 'active' ? '#10B981' : 
                               s.status === 'completed' ? '#3B82F6' : 
                               s.status === 'cancelled' ? '#EF4444' : '#F59E0B'
                    }));
                    break;
                    
                case "Documents":
                    const { data: documents } = await supabase
                        .from('documents')
                        .select(`
                            *,
                            sessions (training_standards (title)),
                            users!documents_uploaded_by_fkey (full_name)
                        `)
                        .order('created_at', { ascending: false });
                    
                    data = (documents || []).map(d => ({
                        id: d.id,
                        title: d.title,
                        type: d.document_type,
                        session: d.sessions?.training_standards?.title || "Unknown",
                        uploadedBy: d.users?.full_name || "Unknown",
                        date: d.created_at ? format(new Date(d.created_at), "dd MMM yyyy") : "N/A",
                        fileUrl: d.file_url
                    }));
                    break;
                    
                case "Standards":
                    const { data: standards } = await supabase
                        .from('training_standards')
                        .select('*')
                        .order('created_at', { ascending: false });
                    
                    data = (standards || []).map(s => ({
                        id: s.id,
                        code: s.code,
                        title: s.title,
                        description: s.description,
                        validity: s.validity_months,
                        active: s.active,
                        created: s.created_at ? format(new Date(s.created_at), "dd MMM yyyy") : "N/A"
                    }));
                    break;
                    
                case "Applications":
                    const { data: applications } = await supabase
                        .from('applications')
                        .select('*')
                        .order('created_at', { ascending: false });
                    
                    data = (applications || []).map(a => ({
                        id: a.id,
                        type: a.application_type,
                        applicant: a.applicant_name,
                        organization: a.organization_name,
                        status: a.status,
                        date: a.created_at ? format(new Date(a.created_at), "dd MMM yyyy") : "N/A",
                        color: a.status === 'approved' ? '#10B981' : 
                               a.status === 'rejected' ? '#EF4444' : '#F59E0B'
                    }));
                    break;
            }
            
            setDrillDownData(data);
        } catch (err) {
            console.error("Error fetching drill-down data:", err);
        }
    }

    function loadDashboardStats() {
        // This would fetch updated stats after operations
        fetchStats();
    }

    function handleEditUser(user: any) {
        setSelectedUserForEdit(user);
        setIsEditModalOpen(true);
    }

    function handleDeleteUser(userId: string) {
        if (confirm("Are you sure you want to delete this user?")) {
            // Implement delete logic
            console.log("Delete user:", userId);
        }
    }

    const renderHomeView = () => {
        const statsCategories = getDynamicStatsCategories(dashboardStats);
        const currentStats = statsCategories[statsIndex];
        
        return (
            <div className="min-h-screen bg-gray-50 text-gray-900 p-6 font-sans">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">ERN<span className="text-purple-600">A</span>M Dashboard</h1>
                        <p className="text-gray-500 text-sm font-medium">Real-time aviation training insights & administration</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50">
                            <Bell className="w-5 h-5 text-gray-600" />
                        </button>
                        <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50">
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold text-sm hover:opacity-90 shadow-sm">
                            System Controls
                        </button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Live Activity Metrics</h2>
                                <p className="text-gray-500 text-sm">Real-time system performance</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setStatsIndex(Math.max(0, statsIndex - 1))} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button onClick={() => setStatsIndex(Math.min(statsCategories.length - 1, statsIndex + 1))} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-500 text-sm font-medium">{currentStats.name}</span>
                                    <span className="text-green-600 text-sm font-bold">+{currentStats.last24h} last 24h</span>
                                </div>
                                <div className="text-4xl font-black text-gray-900">{currentStats.total}</div>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" style={{ width: `${(currentStats.current / Math.max(currentStats.thisMonth, 1)) * 100}%` }}></div>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Today: {currentStats.current}</span>
                                <span>This Week: {currentStats.thisWeek}</span>
                                <span>This Month: {currentStats.thisMonth}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <h3 className="text-lg font-black text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <button onClick={() => setIsSessionModalOpen(true)} className="w-full p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl text-purple-700 font-semibold text-sm hover:from-purple-100 hover:to-blue-100 transition-colors">
                                + New Training Session
                            </button>
                            <button onClick={() => setIsDocumentModalOpen(true)} className="w-full p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl text-blue-700 font-semibold text-sm hover:from-blue-100 hover:to-cyan-100 transition-colors">
                                + Upload Document
                            </button>
                            <button onClick={() => setIsStandardModalOpen(true)} className="w-full p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl text-green-700 font-semibold text-sm hover:from-green-100 hover:to-emerald-100 transition-colors">
                                + Add Training Standard
                            </button>
                            <button onClick={() => setActiveNav("Trainees")} className="w-full p-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-700 font-semibold text-sm hover:from-gray-100 hover:to-gray-200 transition-colors">
                                Manage Users
                            </button>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-black text-gray-900">Performance KPIs</h2>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setDrillDownView("Trainees")} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50">
                                Trainee View
                            </button>
                            <button onClick={() => setDrillDownView("Trainers")} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50">
                                Trainer View
                            </button>
                            <button onClick={() => setDrillDownView("Administrators")} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50">
                                Admin View
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6">
                        {getDynamicTraineeKpis(dashboardStats).slice(0, 3).map((kpi, idx) => (
                            <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${kpi.color}20` }}>
                                        <div style={{ color: kpi.color }}>{kpi.icon}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-gray-900">{kpi.balance}</div>
                                        <div className="text-xs text-gray-500">{kpi.crypto}</div>
                                    </div>
                                </div>
                                <div className="text-sm font-semibold text-gray-900 mb-2">{kpi.name}</div>
                                <div className="text-xs text-gray-500 mb-3">{kpi.rate}</div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${kpi.progress}%`, backgroundColor: kpi.color }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-gray-900">Recent System Activity</h2>
                        <button className="text-sm text-blue-600 font-semibold hover:text-blue-800">
                            View All Logs →
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {allUsers.slice(0, 5).map((user, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: user.color }}>
                                        {user.avatar}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">{user.name}</div>
                                        <div className="text-sm text-gray-500">{user.role} • {user.email}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.status === 'excellent' ? 'bg-green-100 text-green-800' : user.status === 'average' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                        {user.status.toUpperCase()}
                                    </span>
                                    <button className="p-1 hover:bg-gray-100 rounded">
                                        <MoreVertical className="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Drill-down Cards */}
                <div className="grid grid-cols-4 gap-6">
                    {["Sessions", "Documents", "Standards", "Applications"].map((item) => (
                        <div key={item} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDrillDownView(item)}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-lg font-black text-gray-900">{item}</div>
                                <div className="p-2 rounded-lg bg-gray-100">
                                    <Focus className="w-4 h-4 text-gray-600" />
                                </div>
                            </div>
                            <div className="text-sm text-gray-500 mb-2">Click to view details</div>
                            <div className="text-xs text-gray-400">Manage all {item.toLowerCase()} in one place</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderDrillDownView = (viewType: string) => {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setDrillDownView(null)} className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">{viewType} Management</h1>
                            <p className="text-gray-500 text-sm">View and manage all {viewType.toLowerCase()}</p>
                        </div>
                    </div>
                    <button onClick={() => {
                        setSelectedRecord(null);
                        if (viewType === "Sessions") setIsSessionModalOpen(true);
                        if (viewType === "Documents") setIsDocumentModalOpen(true);
                        if (viewType === "Standards") setIsStandardModalOpen(true);
                    }} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold text-sm hover:opacity-90">
                        + Add New
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold border-b border-gray-100">
                                {viewType === "Sessions" && (
                                    <>
                                        <th className="px-6 py-4">Session Title</th>
                                        <th className="px-4 py-4">Date</th>
                                        <th className="px-4 py-4">Instructor</th>
                                        <th className="px-4 py-4">Participants</th>
                                        <th className="px-4 py-4">Status</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </>
                                )}
                                {viewType === "Documents" && (
                                    <>
                                        <th className="px-6 py-4">Document Title</th>
                                        <th className="px-4 py-4">Type</th>
                                        <th className="px-4 py-4">Session</th>
                                        <th className="px-4 py-4">Uploaded By</th>
                                        <th className="px-4 py-4">Date</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </>
                                )}
                                {viewType === "Standards" && (
                                    <>
                                        <th className="px-6 py-4">Code</th>
                                        <th className="px-4 py-4">Title</th>
                                        <th className="px-4 py-4">Description</th>
                                        <th className="px-4 py-4">Validity (months)</th>
                                        <th className="px-4 py-4">Status</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </>
                                )}
                                {viewType === "Applications" && (
                                    <>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-4 py-4">Applicant</th>
                                        <th className="px-4 py-4">Organization</th>
                                        <th className="px-4 py-4">Status</th>
                                        <th className="px-4 py-4">Date</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {drillDownData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    {viewType === "Sessions" && (
                                        <>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">{item.title}</div>
                                                <div className="text-sm text-gray-500">{item.code}</div>
                                            </td>
                                            <td className="px-4 py-4 text-gray-900 font-medium">{item.date}</td>
                                            <td className="px-4 py-4 text-gray-900">{item.instructor}</td>
                                            <td className="px-4 py-4">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">
                                                    {item.participants}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                                                    {item.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-100">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                    {viewType === "Documents" && (
                                        <>
                                            <td className="px-6 py-4 font-semibold text-gray-900">{item.title}</td>
                                            <td className="px-4 py-4">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-bold">
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-gray-900">{item.session}</td>
                                            <td className="px-4 py-4 text-gray-900">{item.uploadedBy}</td>
                                            <td className="px-4 py-4 text-gray-900">{item.date}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100">
                                                        <Download className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-100">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                    {viewType === "Standards" && (
                                        <>
                                            <td className="px-6 py-4 font-bold text-gray-900">{item.code}</td>
                                            <td className="px-4 py-4 font-semibold text-gray-900">{item.title}</td>
                                            <td className="px-4 py-4 text-gray-900 text-sm max-w-xs truncate">{item.description}</td>
                                            <td className="px-4 py-4 text-gray-900">{item.validity}</td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {item.active ? 'ACTIVE' : 'INACTIVE'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                    {viewType === "Applications" && (
                                        <>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 font-semibold text-gray-900">{item.applicant}</td>
                                            <td className="px-4 py-4 text-gray-900">{item.organization}</td>
                                            <td className="px-4 py-4">
                                                <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                                                    {item.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-gray-900">{item.date}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700">
                                                        Review
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderTraineesView = () => {
        return (
            <div className="min-h-screen font-sans bg-gray-50 text-gray-900 pb-20 p-8">
                <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 leading-tight">Trainee Management</h2>
                        <p className="text-gray-500 text-sm font-medium">Monitor and manage all enrolled trainees.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
                            {["Level 1", "Level 2", "Level 3"].map(level => (
                                <button
                                    key={level}
                                    onClick={() => setTraineeLevel(level)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${traineeLevel === level ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'}`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 rounded-lg bg-white text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-gray-100 shadow-sm">
                                <Download className="w-4 h-4"/>
                            </button>
                            <button 
                                onClick={() => setShowTraineeFilter(!showTraineeFilter)}
                                className={`p-2 rounded-lg transition-colors border shadow-sm ${showTraineeFilter ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-400 hover:text-blue-600 hover:bg-blue-50 border-gray-100'}`}
                            >
                                <SlidersHorizontal className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Batch Actions Bar for Trainees */}
                {selectedTrainees.length > 0 && (
                    <div className="flex items-center gap-6 bg-blue-50 text-blue-800 px-5 py-3 rounded-xl border border-blue-200 shadow-sm w-full animate-in fade-in slide-in-from-top-2 mb-6">
                        <span className="font-bold whitespace-nowrap">{selectedTrainees.length} selected</span>
                        <div className="w-px h-5 bg-blue-200"></div>
                        <div className="flex items-center gap-3 w-full">
                            <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm text-gray-700 border border-gray-100 flex-1">Message</button>
                            <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm text-gray-700 border border-gray-100 flex-1">Reassign</button>
                            <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm text-gray-700 border border-gray-100 flex-1">Edit Status</button>
                            <button className="px-3 py-1.5 bg-white text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-200 hover:text-red-700 border border-gray-100 transition-colors shadow-sm flex-1">Remove Trainee</button>
                        </div>
                        <button onClick={() => setSelectedTrainees([])} className="ml-auto text-blue-400 hover:text-blue-600 p-1 flex-shrink-0 text-xl leading-none">
                            &times;
                        </button>
                    </div>
                )}

                {/* Trainee Roster Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-widest font-bold border-b border-gray-100">
                                <th className="px-6 py-4 w-12 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                                        checked={trainees.length > 0 && selectedTrainees.length === trainees.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedTrainees(trainees.map(t => t.id));
                                            } else {
                                                setSelectedTrainees([]);
                                            }
                                        }}
                                    />
                                </th>
                                <th className="px-2 py-4">Enrollment Date</th>
                                <th className="px-4 py-4">Trainee</th>
                                <th className="px-4 py-4">Status</th>
                                <th className="px-4 py-4">Current Module</th>
                                <th className="px-4 py-4">Performance</th>
                                <th className="px-6 py-4">Trainee ID / Email</th>
                                <th className="px-6 py-4 text-center">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {trainees.map((tx) => (
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
                                            <span className="text-blue-600 font-bold text-[10px]">●</span>
                                            <span className="text-gray-500 font-medium text-[11px]">{tx.moduleProgress}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="font-black text-sm tracking-wide text-gray-900">{tx.performanceNum}</div>
                                        <div className="text-gray-400 text-[10px] font-bold mt-0.5 uppercase">{tx.performanceText}</div>
                                    </td>
                                    <td className="px-6 py-5 max-w-[200px]">
                                        <div className="text-gray-900 font-bold text-xs truncate">{tx.traineeId}</div>
                                        <div className="text-gray-500 text-[11px] mt-0.5 truncate">{tx.email}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => handleEditUser(tx)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100 shadow-sm"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(tx.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-100 shadow-sm"
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
        );
    };

    const renderTrainersView = () => {
        return (
            <div className="min-h-screen font-sans bg-gray-50 text-gray-900 pb-20 p-8">
                <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 leading-tight">Trainer Faculty</h2>
                        <p className="text-gray-500 text-sm font-medium">Manage instructors and their assigned sessions.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button className="p-2 rounded-lg bg-white text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-gray-100 shadow-sm">
                                <Download className="w-4 h-4"/>
                            </button>
                            <button 
                                onClick={() => setShowTrainerFilter(!showTrainerFilter)}
                                className={`p-2 rounded-lg transition-colors border shadow-sm ${showTrainerFilter ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-400 hover:text-blue-600 hover:bg-blue-50 border-gray-100'}`}
                            >
                                <SlidersHorizontal className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Batch Actions Bar for Trainers */}
                {selectedTrainers.length > 0 && (
                    <div className="flex items-center gap-6 bg-blue-50 text-blue-800 px-5 py-3 rounded-xl border border-blue-200 shadow-sm w-full animate-in fade-in slide-in-from-top-2 mb-6">
                        <span className="font-bold whitespace-nowrap">{selectedTrainers.length} selected</span>
                        <div className="w-px h-5 bg-blue-200"></div>
                        <div className="flex items-center gap-3 w-full">
                            <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm text-gray-700 border border-gray-100 flex-1">Profile</button>
                            <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm text-gray-700 border border-gray-100 flex-1">Reassign</button>
                            <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm text-gray-700 border border-gray-100 flex-1">Edit</button>
                            <button className="px-3 py-1.5 bg-white text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-200 hover:text-red-700 border border-gray-100 transition-colors shadow-sm flex-1">Remove Faculty</button>
                        </div>
                        <button onClick={() => setSelectedTrainers([])} className="ml-auto text-blue-400 hover:text-blue-600 p-1 flex-shrink-0 text-xl leading-none">
                            &times;
                        </button>
                    </div>
                )}

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
                                            <span className="text-blue-600 font-bold text-[10px]">●</span>
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
                                            <button 
                                                onClick={() => handleEditUser(tx)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100 shadow-sm"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(tx.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-100 shadow-sm"
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
        );
    };

    const renderAdministratorsView = () => {
        return (
            <div className="min-h-screen font-sans bg-gray-50 text-gray-900 pb-20 p-8">
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
                                            <button 
                                                onClick={() => handleEditUser(tx)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
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