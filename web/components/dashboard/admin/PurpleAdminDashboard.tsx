"use client";

import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { Bell, Moon, Sun, ChevronLeft, ChevronRight, Settings, MoreVertical, Edit2, Trash2, Download, SlidersHorizontal, Triangle, Circle, Hexagon, Diamond, Focus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";

// --- EXISTING DATA (Home View) ---
const SYSTEM_HEALTH_DATA = [
    { name: "Optimal Running", value: 85, color: "#10B981" },
    { name: "Minor Warnings", value: 12, color: "#F59E0B" },
    { name: "Active Errors", value: 3, color: "#EF4444" },
];

const KEY_INDICATORS_DATA = [
    { name: "Jan", blue: 40, green: 24 },
    { name: "Feb", blue: 30, green: 35 },
    { name: "Mar", blue: 55, green: 48 },
    { name: "Apr", blue: 25, green: 65 },
    { name: "Mai", blue: 70, green: 45 },
    { name: "Juin", blue: 85, green: 60 },
];

const SKILLS_EVALUATION_DATA = [
    { name: "High", value: 80, color: "#0288D1" },
    { name: "Medium", value: 60, color: "#00897B" },
    { name: "Borderline", value: 40, color: "#F57C00" },
    { name: "Needs Work", value: 20, color: "#E53935" },
];

const EVOLUTION_DATA = [
    { name: "Jan", val: 10 },
    { name: "Feb", val: 40 },
    { name: "Mar", val: 25 },
    { name: "Apr", val: 65 },
    { name: "Mai", val: 80 },
];

const COURSE_AVG_DATA = [
    { name: "Math", value: 75, color: "#1976D2" },
    { name: "Physics", value: 60, color: "#388E3C" },
    { name: "French", value: 55, color: "#29B6F6" },
    { name: "English", value: 50, color: "#78909C" },
];

const getDynamicStatsCategories = (stats: any) => [
    { name: "Documents", current: stats?.documents || 0, last24h: 0, thisWeek: stats?.documents || 0, thisMonth: stats?.documents || 0, total: stats?.documents?.toLocaleString() || "0" },
    { name: "Signups", current: stats?.totalUsers || 0, last24h: 0, thisWeek: stats?.totalUsers || 0, thisMonth: stats?.totalUsers || 0, total: stats?.totalUsers?.toLocaleString() || "0" },
    { name: "Courses", current: stats?.sessions || 0, last24h: 0, thisWeek: stats?.sessions || 0, thisMonth: stats?.sessions || 0, total: stats?.sessions?.toLocaleString() || "0" },
    { name: "Exams", current: 0, last24h: 0, thisWeek: 0, thisMonth: 0, total: "0" },
    { name: "Certificates", current: stats?.certificates || 0, last24h: 0, thisWeek: stats?.certificates || 0, thisMonth: stats?.certificates || 0, total: stats?.certificates?.toLocaleString() || "0" },
    { name: "Attendances", current: stats?.attendances || 0, last24h: 0, thisWeek: stats?.attendances || 0, thisMonth: stats?.attendances || 0, total: stats?.attendances?.toLocaleString() || "0" }
];

const STATS_CATEGORIES = [
    { name: "Documents", current: 12, last24h: 34, thisWeek: 156, thisMonth: 642, total: "2,890" },
    { name: "Signups", current: 5, last24h: 18, thisWeek: 89, thisMonth: 412, total: "1,250" },
    { name: "Courses", current: 2, last24h: 8, thisWeek: 45, thisMonth: 120, total: "450" },
    { name: "Exams", current: 0, last24h: 12, thisWeek: 67, thisMonth: 289, total: "890" },
    { name: "Certificates", current: 8, last24h: 45, thisWeek: 210, thisMonth: 850, total: "3,420" },
    { name: "Attendances", current: 145, last24h: 450, thisWeek: 2100, thisMonth: 8500, total: "45,000" }
];

const USERS_DATA = [
    { id: 1, name: "Alice Dupont", role: "Trainee", email: "alice@example.com", phone: "+33 6 12 34 56 78", status: "excellent", avatar: "AD", color: "#1976D2" },
    { id: 2, name: "Bob Martin", role: "Trainer", email: "bob@example.com", phone: "+33 6 98 76 54 32", status: "average", avatar: "BM", color: "#FF9800" },
    { id: 3, name: "Charlie Durand", role: "Trainee", email: "charlie@example.com", phone: "+33 6 11 22 33 44", status: "failing", avatar: "CD", color: "#E53935" },
    { id: 4, name: "Diana Prince", role: "Administrator", email: "diana@ernam.com", phone: "+33 6 55 44 33 22", status: "excellent", avatar: "DP", color: "#388E3C" },
    { id: 5, name: "Eve Dubois", role: "Trainee", email: "eve@example.com", phone: "+33 6 99 88 77 66", status: "average", avatar: "ED", color: "#8E24AA" },
    { id: 6, name: "Frank Blanc", role: "Trainer", email: "frank@example.com", phone: "+33 6 77 66 55 44", status: "failing", avatar: "FB", color: "#E53935" },
];

// --- NEW DATA (Training KPIs View) ---
const getDynamicTraineeKpis = (stats: any) => [
    { icon: "👥", name: "Active Trainees", balance: stats?.trainees?.toLocaleString() || "0", crypto: `Out of ${stats?.totalUsers || 0} registered`, rate: "Live Database Count", progress: stats?.totalUsers > 0 ? (stats.trainees / stats.totalUsers) * 100 : 0, color: "#1D4ED8" },
    { icon: "🛡️", name: "Global Compliance", balance: "88.5%", crypto: "1,101 Fully Certified", rate: "Target: 95% by Q3", progress: 88, color: "#10B981" },
    { icon: "⚠️", name: "Pending Renewals", balance: "142", crypto: "Expiring in 30 days", rate: "12 critical expirations today", progress: 15, color: "#EF4444" },
    { icon: "✅", name: "Avg. Pass Rate", balance: "N/A", crypto: "First-attempt success", rate: "Awaiting exam data", progress: 0, color: "#059669" },
    { icon: "⏳", name: "Hours Logged", balance: "8,450 hrs", crypto: "Total learning time this month", rate: "Avg. 6.7 hours per trainee", progress: 75, color: "#F59E0B" },
    { icon: "📚", name: "Modules Completed", balance: stats?.certificates?.toLocaleString() || "0", crypto: `Across ${stats?.sessions || 0} active sessions`, rate: "Based on certificates", progress: 0, color: "#8B5CF6" },
];

const TRAINEE_KPI_CARDS = [
    { icon: "👥", name: "Active Trainees", balance: "1,245", crypto: "Out of 1,500 registered", rate: "+12% active users this month", progress: 83, color: "#1D4ED8" },
    { icon: "🛡️", name: "Global Compliance", balance: "88.5%", crypto: "1,101 Fully Certified", rate: "Target: 95% by Q3", progress: 88, color: "#10B981" },
    { icon: "⚠️", name: "Pending Renewals", balance: "142", crypto: "Expiring in 30 days", rate: "12 critical expirations today", progress: 15, color: "#EF4444" },
    { icon: "✅", name: "Avg. Pass Rate", balance: "94.2%", crypto: "First-attempt success", rate: "+2.1% improvement from last cohort", progress: 94, color: "#059669" },
    { icon: "⏳", name: "Hours Logged", balance: "8,450 hrs", crypto: "Total learning time this month", rate: "Avg. 6.7 hours per trainee", progress: 75, color: "#F59E0B" },
    { icon: "📚", name: "Modules Completed", balance: "3,210", crypto: "Across 45 active courses", rate: "\"Aviation Safety\" is top module", progress: 60, color: "#8B5CF6" },
];

const TRAINEE_ROSTER_DATA = [
    { id: 1, date: "20 Jul 2023", time: "18:42 PM", trainee: "John Doe", role: "Pilot Cadet", status: "ON TRACK", statusColor: "#10B981", moduleTitle: "Aviation Safety", moduleProgress: "Module 3 of 5", performanceNum: "85%", performanceText: "Grade: B", traineeId: "#TRN-381782", email: "john.doe@email.com" },
    { id: 2, date: "18 Jul 2023", time: "12:35 PM", trainee: "Sarah Smith", role: "Air Traffic Controller", status: "AT RISK", statusColor: "#EF4444", moduleTitle: "Radar Operations", moduleProgress: "Module 1 of 4", performanceNum: "42%", performanceText: "Grade: F", traineeId: "#TRN-192834", email: "sarah.smith@email.com" },
    { id: 3, date: "15 Jul 2023", time: "19:11 PM", trainee: "Michael Johnson", role: "Meteorologist", status: "IN PROGRESS", statusColor: "#F59E0B", moduleTitle: "Weather Patterns", moduleProgress: "Module 4 of 5", performanceNum: "72%", performanceText: "Grade: C", traineeId: "#TRN-948271", email: "michael.j@email.com" },
    { id: 4, date: "11 Jul 2023", time: "12:00 PM", trainee: "Emma Davis", role: "Pilot Cadet", status: "ON TRACK", statusColor: "#10B981", moduleTitle: "Navigation Systems", moduleProgress: "Module 5 of 5", performanceNum: "96%", performanceText: "Grade: A", traineeId: "#TRN-562910", email: "emma.davis@email.com" },
    { id: 5, date: "10 Jul 2023", time: "16:17 PM", trainee: "Robert Wilson", role: "Maintenance Engineer", status: "IN PROGRESS", statusColor: "#F59E0B", moduleTitle: "Engine Diagnostics", moduleProgress: "Module 2 of 6", performanceNum: "68%", performanceText: "Grade: D", traineeId: "#TRN-827364", email: "r.wilson@email.com" },
    { id: 6, date: "9 Jul 2023", time: "15:24 PM", trainee: "Emily Brown", role: "Air Traffic Controller", status: "ON TRACK", statusColor: "#10B981", moduleTitle: "Emergency Protocols", moduleProgress: "Module 2 of 3", performanceNum: "91%", performanceText: "Grade: A-", traineeId: "#TRN-349812", email: "emily.b@email.com" },
    { id: 7, date: "6 Jul 2023", time: "20:18 PM", trainee: "David Miller", role: "Meteorologist", status: "ON TRACK", statusColor: "#10B981", moduleTitle: "Climate Modeling", moduleProgress: "Module 1 of 2", performanceNum: "88%", performanceText: "Grade: B+", traineeId: "#TRN-718293", email: "david.miller@email.com" },
    { id: 8, date: "2 Jul 2023", time: "14:21 PM", trainee: "Sophia Taylor", role: "Pilot Cadet", status: "AT RISK", statusColor: "#EF4444", moduleTitle: "Aerodynamics", moduleProgress: "Module 1 of 5", performanceNum: "55%", performanceText: "Grade: D-", traineeId: "#TRN-293847", email: "sophia.t@email.com" },
];

const LEVEL2_KPI_CARDS = [
    { icon: "🎓", name: "Advanced Trainees", balance: "412", crypto: "Out of 500 eligible", rate: "+5% advanced enrollments", progress: 82, color: "#1D4ED8" },
    { icon: "🏆", name: "Specialist Certs", balance: "94.5%", crypto: "389 Fully Certified", rate: "Target: 98% by EOY", progress: 94, color: "#10B981" },
    { icon: "⏳", name: "Pending Evaluations", balance: "28", crypto: "Final assessments due", rate: "Needs Review", progress: 8, color: "#EF4444" },
    { icon: "✨", name: "Avg. Distinction Rate", balance: "88.4%", crypto: "High honors achieved", rate: "+4.2% from Level 1", progress: 88, color: "#059669" },
    { icon: "🧪", name: "Lab Hours", balance: "12,400 hrs", crypto: "Practical training time", rate: "Avg. 30 hours per trainee", progress: 90, color: "#F59E0B" },
    { icon: "🗺️", name: "Simulations Passed", balance: "1,840", crypto: "Across 12 scenarios", rate: "\"Radar ATC\" is lowest pass", progress: 78, color: "#8B5CF6" },
];

const LEVEL2_ROSTER_DATA = [
    { id: 101, date: "22 Jul 2023", time: "09:15 AM", trainee: "Alice Smith", role: "Senior ATC", status: "ON TRACK", statusColor: "#10B981", moduleTitle: "Advanced Radar", moduleProgress: "Simulation 4 of 5", performanceNum: "92%", performanceText: "Grade: A", traineeId: "#TRN-LV2-001", email: "alice.smith@email.com" },
    { id: 102, date: "21 Jul 2023", time: "14:30 PM", trainee: "Bob Jones", role: "Captain Cadet", status: "IN PROGRESS", statusColor: "#F59E0B", moduleTitle: "Complex Weather Navigation", moduleProgress: "Simulation 2 of 4", performanceNum: "78%", performanceText: "Grade: C", traineeId: "#TRN-LV2-045", email: "bob.jones@email.com" },
    { id: 103, date: "19 Jul 2023", time: "11:05 AM", trainee: "Carol Williams", role: "Senior ATC", status: "ON TRACK", statusColor: "#10B981", moduleTitle: "Emergency Comm Protocol", moduleProgress: "Simulation 3 of 3", performanceNum: "98%", performanceText: "Grade: A+", traineeId: "#TRN-LV2-089", email: "carol.w@email.com" },
    { id: 104, date: "18 Jul 2023", time: "16:45 PM", trainee: "David Brown", role: "Chief Mechanic", status: "AT RISK", statusColor: "#EF4444", moduleTitle: "Turbine Overhaul", moduleProgress: "Practical 1 of 5", performanceNum: "58%", performanceText: "Grade: D-", traineeId: "#TRN-LV2-112", email: "david.b@email.com" },
];

const TRAINER_KPI_CARDS = [
    { icon: "👨‍🏫", name: "Active Trainers", balance: "42", crypto: "Out of 45 rostered", rate: "93% Core Availability", progress: 93, color: "#1D4ED8" },
    { icon: "⭐", name: "Average Rating", balance: "4.8/5", crypto: "From 1.2k reviews", rate: "Top 10% Industry", progress: 96, color: "#10B981" },
    { icon: "🗓️", name: "Sessions Conducted", balance: "384", crypto: "This Month", rate: "+12% vs Last Month", progress: 75, color: "#8B5CF6" },
    { icon: "⌚", name: "Hours Taught", balance: "1,420", crypto: "Total classroom hours", rate: "Target: 1,500 hrs", progress: 94, color: "#F59E0B" },
    { icon: "📜", name: "Certifications", balance: "128", crypto: "Active teaching certs", rate: "4 pending renewal", progress: 97, color: "#059669" },
    { icon: "📋", name: "Open Slots", balance: "18", crypto: "Available this week", rate: "High demand expected", progress: 15, color: "#EF4444" },
];

const TRAINER_ROSTER_DATA = [
    { id: 201, date: "22 Jul 2023", time: "08:30 AM", trainer: "Dr. Alan Grant", role: "Aviation History", status: "AVAILABLE", statusColor: "#10B981", specialization: "Core Curriculum", activeSessions: "3 Classes", performanceNum: "4.9", performanceText: "Rating: Excellent", trainerId: "#INS-042", email: "a.grant@ernam.org" },
    { id: 202, date: "21 Jul 2023", time: "11:15 AM", trainer: "Capt. Sarah Jenkins", role: "Radar Expert", status: "IN SESSION", statusColor: "#3B82F6", specialization: "Air Traffic Control", activeSessions: "1 Class", performanceNum: "4.7", performanceText: "Rating: Very Good", trainerId: "#INS-089", email: "s.jenkins@ernam.org" },
    { id: 203, date: "20 Jul 2023", time: "16:45 PM", trainer: "Marcus Cole", role: "Meteorology Lead", status: "UNAVAILABLE", statusColor: "#EF4444", specialization: "Weather Systems", activeSessions: "0 Classes", performanceNum: "4.8", performanceText: "Rating: Excellent", trainerId: "#INS-112", email: "m.cole@ernam.org" },
    { id: 204, date: "18 Jul 2023", time: "09:00 AM", trainer: "Elena Rostova", role: "Navigation Tech", status: "AVAILABLE", statusColor: "#10B981", specialization: "Instruments", activeSessions: "2 Classes", performanceNum: "4.5", performanceText: "Rating: Good", trainerId: "#INS-056", email: "e.rostova@ernam.org" },
];

const ADMIN_KPI_CARDS = [
    { icon: "🛡️", name: "System Health", balance: "99.9%", crypto: "All services operational", rate: "Uptime: 30 days", progress: 99, color: "#10B981" },
    { icon: "🔑", name: "Active Admins", balance: "5", crypto: "Currently logged in", rate: "Staff: 8 Total", progress: 62, color: "#3B82F6" },
    { icon: "⚠️", name: "Security Alerts", balance: "0", crypto: "No critical threats", rate: "Last scan: 2m ago", progress: 0, color: "#F59E0B" },
    { icon: "🕒", name: "Recent Logs", balance: "1.2k", crypto: "Generated today", rate: "+5% vs Avg", progress: 70, color: "#6366F1" },
    { icon: "✅", name: "Pending Tasks", balance: "12", crypto: "System approvals", rate: "4 high priority", progress: 40, color: "#8B5CF6" },
    { icon: "💾", name: "DB Storage", balance: "42%", crypto: "1.2GB/5GB used", rate: "Healthy growth", progress: 42, color: "#EC4899" },
];

const ADMIN_ROSTER_DATA = [
    { id: 301, date: "22 Jul 2023", time: "10:00 AM", admin: "Edward Day", role: "Super Admin", status: "ACTIVE", statusColor: "#10B981", lastAction: "System Config Update", securityLevel: "Lv. 5", adminId: "#ADM-001", email: "e.day@ernam.org" },
    { id: 302, date: "22 Jul 2023", time: "09:45 AM", admin: "Lisa Ray", role: "Mod / Support", status: "AWAY", statusColor: "#F59E0B", lastAction: "User Approval", securityLevel: "Lv. 3", adminId: "#ADM-012", email: "l.ray@ernam.org" },
    { id: 303, date: "21 Jul 2023", time: "18:20 PM", admin: "Tom Harding", role: "System Admin", status: "OFFLINE", statusColor: "#6B7280", lastAction: "Database Maintenance", securityLevel: "Lv. 4", adminId: "#ADM-005", email: "t.harding@ernam.org" },
];

export default function PurpleAdminDashboard() {
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
    const [loading, setLoading] = useState(true);
    const [dashboardStats, setDashboardStats] = useState<any>(null);

    useEffect(() => {
        setIsMounted(true);
        fetchTrainees();
        fetchStats();
    }, []);

    async function fetchStats() {
        try {
            const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
            const { count: participantCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'participant');
            const { count: sessionCount } = await supabase.from('sessions').select('*', { count: 'exact', head: true });
            const { count: certCount } = await supabase.from('certificates').select('*', { count: 'exact', head: true });
            const { count: attendanceCount } = await supabase.from('session_participants').select('*', { count: 'exact', head: true }).eq('attendance_status', 'attended');

            setDashboardStats({
                totalUsers: usersCount || 0,
                trainees: participantCount || 0,
                sessions: sessionCount || 0,
                certificates: certCount || 0,
                attendances: attendanceCount || 0
            });
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    }

    async function fetchTrainees() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id,
                    full_name,
                    email,
                    role,
                    session_participants (
                        attendance_status,
                        sessions (
                            start_date,
                            training_standards (
                                title
                            )
                        )
                    )
                `)
                .eq('role', 'participant');

            if (error) throw error;

            if (data) {
                const formattedTrainees = data.map((u: any, idx: number) => {
                    const latestEnrollment = u.session_participants?.[0];
                    const session = latestEnrollment?.sessions;
                    const standard = session?.training_standards;

                    return {
                        id: u.id,
                        date: session?.start_date ? format(new Date(session.start_date), "dd MMM yyyy") : "N/A",
                        time: session?.start_date ? format(new Date(session.start_date), "HH:mm a") : "",
                        trainee: u.full_name || "Unknown",
                        role: "Student", // Defaulting role as 'role' in DB is 'participant'
                        status: latestEnrollment?.attendance_status?.toUpperCase().replace('_', ' ') || "PENDING",
                        statusColor: latestEnrollment?.attendance_status === 'enrolled' ? "#3B82F6" : 
                                     latestEnrollment?.attendance_status === 'attended' ? "#10B981" : "#EF4444",
                        moduleTitle: standard?.title || "No Module assigned",
                        moduleProgress: "N/A", // We'd need a separate 'progress' field or logic here
                        performanceNum: "N/A",
                        performanceText: "Grade: -",
                        traineeId: `#TRN-${u.id.substring(0,6).toUpperCase()}`,
                        email: u.email
                    };
                });
                setTrainees(formattedTrainees);
            }
        } catch (err) {
            console.error("Error fetching trainees:", err);
        } finally {
            setLoading(false);
        }
    }

    const navItems = ["Home", "Trainees", "Trainers", "Administrators"];

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
                        <span className="text-2xl font-black">80</span>
                    </div>
                    <div className="bg-emerald-600 text-white p-3 rounded-xl flex flex-col justify-center shadow-sm">
                        <span className="text-[11px] font-semibold opacity-90 mb-1">General Average</span>
                        <span className="text-2xl font-black">12.8%</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 text-gray-800 p-3 rounded-xl flex flex-col justify-center col-span-2 shadow-sm">
                        <span className="text-[11px] font-bold text-gray-500 mb-1">Teaching Hours</span>
                        <span className="text-2xl font-black">120 h</span>
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

    const renderHomeView = () => (
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
                            Dashboard <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
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
                        <span className="text-gray-800 text-sm font-semibold">Edward Day</span>
                        <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">E</div>
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
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider">Options</span>
                            <div className="flex items-center space-x-0.5">
                                <button onClick={prevStat} className="p-0.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button onClick={nextStat} className="p-0.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="text-blue-700 font-black text-xl truncate">{getDynamicStatsCategories(dashboardStats)[statsIndex].name}</div>
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
                                        <th className="px-3 py-3 font-bold text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {USERS_DATA.map((user) => (
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
                                                                <span className="text-sm leading-none opacity-80">Ã°Å¸â€˜ÂÃ¯Â¸Â</span> View Profile
                                                            </button>
                                                            <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 font-semibold transition-colors">
                                                                <span className="text-sm leading-none opacity-80">Ã°Å¸â€â€</span> Send Message
                                                            </button>
                                                            <div className="h-px bg-gray-100 my-1 mx-3" />
                                                            <button className="w-full text-left px-4 py-2 text-xs text-indigo-600 hover:bg-indigo-50 flex items-center gap-2.5 font-bold transition-colors">
                                                                <span className="text-sm leading-none opacity-90">🎭</span> Act As
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                                    <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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

    const renderTraineesView = () => {
        const currentKpis = traineeLevel === "Level 1" ? getDynamicTraineeKpis(dashboardStats) : LEVEL2_KPI_CARDS;
        const currentRoster = traineeLevel === "Level 1" 
            ? (trainees.length > 0 ? trainees : TRAINEE_ROSTER_DATA) 
            : LEVEL2_ROSTER_DATA;
        
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
                            Dashboard <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
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
                        <span className="text-gray-800 text-sm font-semibold">Edward Day</span>
                        <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">E</div>
                    </div>
                </div>
            </nav>

            {/* Main Wallet Content */}
            <div className="px-8 py-10 space-y-6 max-w-[1600px] mx-auto mt-4">
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
                    {currentKpis.map((card, idx) => (
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
                                <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm text-gray-700 border border-gray-100 flex-1">View As</button>
                                <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm text-gray-700 border border-gray-100 flex-1">Edit</button>
                                <button className="px-3 py-1.5 bg-white text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-200 hover:text-red-700 border border-gray-100 transition-colors shadow-sm flex-1">Delete</button>
                            </div>
                            <button onClick={() => setSelectedTrainees([])} className="ml-auto text-blue-400 hover:text-blue-600 p-1 flex-shrink-0 text-xl leading-none">
                                &times;
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
                                            <span className="text-blue-600 font-bold text-[10px]">●</span>
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
                            Dashboard <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
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
                        <span className="text-gray-800 text-sm font-semibold">Edward Day</span>
                        <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">E</div>
                    </div>
                </div>
            </nav>

            {/* Main Trainer Content */}
            <div className="px-8 py-10 space-y-6 max-w-[1600px] mx-auto mt-4">
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
                    {TRAINER_KPI_CARDS.map((card, idx) => (
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
                                <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm text-gray-700 border border-gray-100 flex-1">Reassign</button>
                                <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm text-gray-700 border border-gray-100 flex-1">Edit</button>
                                <button className="px-3 py-1.5 bg-white text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-200 hover:text-red-700 border border-gray-100 transition-colors shadow-sm flex-1">Remove Faculty</button>
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
                                        checked={TRAINER_ROSTER_DATA.length > 0 && selectedTrainers.length === TRAINER_ROSTER_DATA.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedTrainers(TRAINER_ROSTER_DATA.map(t => t.id));
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
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {TRAINER_ROSTER_DATA.map((tx) => (
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
        <div className="min-h-screen font-sans bg-gray-50 text-gray-900 pb-20">
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
                            Dashboard <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
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
                        <span className="text-gray-800 text-sm font-semibold">Edward Day</span>
                        <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">E</div>
                    </div>
                </div>
            </nav>

            {/* Main Admin Content */}
            <div className="px-8 py-10 space-y-6 max-w-[1600px] mx-auto mt-4">
                <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
                    <h2 className="text-2xl font-black text-gray-900 leading-tight">System Administrators</h2>
                    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Security:</span>
                        <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs">
                             <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                             Tier 1 Encrypted
                        </div>
                    </div>
                </div>

                {/* Admin KPI Cards */}
                <div className="grid grid-cols-6 gap-5">
                    {ADMIN_KPI_CARDS.map((card, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-[20px] p-5 flex flex-col relative overflow-hidden group hover:shadow-md transition-all cursor-pointer">
                            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] opacity-10" style={{ background: card.color }} />
                            <div className="flex justify-between items-center mb-4 relative z-10">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm" style={{ background: `${card.color}15` }}>
                                        {card.icon}
                                    </div>
                                    <span className="text-gray-800 font-bold text-[14px]">{card.name}</span>
                                </div>
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
                                    <span className="text-[10px] text-gray-500 font-medium tracking-tight truncate">{card.rate}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Admin Roster Header */}
                <div className="pt-10 pb-4 flex flex-col gap-4 border-b border-gray-200">
                    <div className="flex justify-between items-end">
                        <div className="transition-all">
                            <h2 className="text-2xl font-black text-gray-900 leading-tight mb-1">Administrator Roster</h2>
                            <p className="text-gray-500 text-sm font-medium">Manage security credentials, view access logs, and assign moderator roles.</p>
                        </div>
                        <div className="flex gap-3 pb-1 relative">
                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100 shadow-sm"><Download className="w-4 h-4"/></button>
                            <button 
                                onClick={() => setShowAdminFilter(!showAdminFilter)}
                                className={`p-2 rounded-lg transition-colors border shadow-sm ${showAdminFilter ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-400 hover:text-blue-600 hover:bg-blue-50 border-gray-100'}`}
                            >
                                <SlidersHorizontal className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>

                    {/* Batch Actions Bar for Admins */}
                    {selectedAdmins.length > 0 && (
                        <div className="flex items-center gap-6 bg-blue-50 text-blue-800 px-5 py-3 rounded-xl border border-blue-200 shadow-sm w-full animate-in fade-in slide-in-from-top-2">
                            <span className="font-bold whitespace-nowrap">{selectedAdmins.length} selected</span>
                            <div className="w-px h-5 bg-blue-200"></div>
                            <div className="flex items-center gap-3 w-full">
                                <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 text-gray-700 border border-gray-100 flex-1">Reset Password</button>
                                <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 text-gray-700 border border-gray-100 flex-1">Manage Keys</button>
                                <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 text-gray-700 border border-gray-100 flex-1">Edit Role</button>
                                <button className="px-3 py-1.5 bg-white text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 border border-gray-100 transition-colors shadow-sm flex-1">Revoke Access</button>
                            </div>
                            <button onClick={() => setSelectedAdmins([])} className="ml-auto text-blue-400 hover:text-blue-600 p-1 flex-shrink-0 text-xl leading-none">
                                &times;
                            </button>
                        </div>
                    )}
                </div>

                {/* Admin Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-widest font-bold border-b border-gray-100">
                                <th className="px-6 py-4 w-12 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-gray-300 text-blue-600"
                                        checked={ADMIN_ROSTER_DATA.length > 0 && selectedAdmins.length === ADMIN_ROSTER_DATA.length}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedAdmins(ADMIN_ROSTER_DATA.map(t => t.id));
                                            else setSelectedAdmins([]);
                                        }}
                                    />
                                </th>
                                <th className="px-2 py-4 text-center">Last Active</th>
                                <th className="px-4 py-4">Administrator</th>
                                <th className="px-4 py-4">Status</th>
                                <th className="px-4 py-4">Recent Action</th>
                                <th className="px-4 py-4 text-center">Security</th>
                                <th className="px-6 py-4">Account ID / Email</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {ADMIN_ROSTER_DATA.map((tx) => (
                                <tr key={tx.id} className={`transition-colors group ${selectedAdmins.includes(tx.id) ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}>
                                    <td className="px-6 py-5 w-12 text-center">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-gray-300 text-blue-600"
                                            checked={selectedAdmins.includes(tx.id)}
                                            onChange={() => {
                                                setSelectedAdmins(prev => 
                                                    prev.includes(tx.id) ? prev.filter(id => id !== tx.id) : [...prev, tx.id]
                                                );
                                            }}
                                        />
                                    </td>
                                    <td className="px-2 py-5 text-center">
                                        <div className="text-gray-900 font-bold text-xs">{tx.date}</div>
                                        <div className="text-gray-400 text-[10px] mt-0.5">{tx.time}</div>
                                    </td>
                                    <td className="px-4 py-5 font-bold text-[13px]">{tx.admin}</td>
                                    <td className="px-4 py-5">
                                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 w-fit">
                                            <div className="w-2 h-2 rounded-full" style={{ background: tx.statusColor }} />
                                            <span className="text-[11px] font-bold" style={{ color: tx.statusColor }}>{tx.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 text-gray-500 text-xs font-semibold">{tx.lastAction}</td>
                                    <td className="px-4 py-5 text-center">
                                        <span className="px-2.5 py-1 bg-gray-900 text-white rounded-md font-black text-[10px] tracking-widest">{tx.securityLevel}</span>
                                    </td>
                                    <td className="px-6 py-5 max-w-[200px]">
                                        <div className="text-gray-900 font-bold text-xs truncate">{tx.adminId}</div>
                                        <div className="text-gray-500 text-[11px] mt-0.5 truncate">{tx.email}</div>
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

    return (
        <React.Fragment>
            {activeNav === "Home" && renderHomeView()}
            {activeNav === "Trainees" && renderTraineesView()}
            {activeNav === "Trainers" && renderTrainersView()}
            {activeNav === "Administrators" && renderAdministratorsView()}
        </React.Fragment>
    );
}
