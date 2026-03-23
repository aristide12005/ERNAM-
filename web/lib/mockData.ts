/**
 * Centralized Mock Data for ERNAM Dashboards
 * This file isolates hardcoded dummy data to prepare for full database integration.
 */

// --- Shared Types ---

export interface Participant {
    id: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
    status?: 'enrolled' | 'completed' | 'inactive';
    progress?: number;
}

// --- Home Dashboard Views ---

export const SYSTEM_HEALTH_DATA = [
    { name: "Optimal Running", value: 85, color: "#10B981" },
    { name: "Minor Warnings", value: 12, color: "#F59E0B" },
    { name: "Active Errors", value: 3, color: "#EF4444" },
];

export const KEY_INDICATORS_DATA = [
    { name: "Jan", blue: 40, green: 24 },
    { name: "Feb", blue: 30, green: 35 },
    { name: "Mar", blue: 55, green: 48 },
    { name: "Apr", blue: 25, green: 65 },
    { name: "Mai", blue: 70, green: 45 },
    { name: "Juin", blue: 85, green: 60 },
];

export const SKILLS_EVALUATION_DATA = [
    { name: "High", value: 80, color: "#0288D1" },
    { name: "Medium", value: 60, color: "#00897B" },
    { name: "Borderline", value: 40, color: "#F57C00" },
    { name: "Needs Work", value: 20, color: "#E53935" },
];

export const EVOLUTION_DATA = [
    { name: "Jan", val: 10 },
    { name: "Feb", val: 40 },
    { name: "Mar", val: 25 },
    { name: "Apr", val: 65 },
    { name: "Mai", val: 80 },
];

export const COURSE_AVG_DATA = [
    { name: "Math", value: 75, color: "#1976D2" },
    { name: "Physics", value: 60, color: "#388E3C" },
    { name: "French", value: 55, color: "#29B6F6" },
    { name: "English", value: 50, color: "#78909C" },
];

export const ACCESS_DISTRIBUTION = [
    { name: 'Admins', value: 12, total: 100, color: 'from-indigo-500 to-purple-600' },
    { name: 'Trainers', value: 36, total: 100, color: 'from-blue-500 to-indigo-600' },
    { name: 'Trainees', value: 52, total: 100, color: 'from-emerald-400 to-teal-500' },
];

// --- Admin Overview (Compat) ---

export const ADMIN_CHART_DATA = [
    { name: 'Jan', enrolled: 40, certified: 24 },
    { name: 'Feb', enrolled: 30, certified: 13 },
    { name: 'Mar', enrolled: 20, certified: 98 },
    { name: 'Apr', enrolled: 27, certified: 39 },
    { name: 'May', enrolled: 18, certified: 48 },
    { name: 'Jun', enrolled: 23, certified: 38 },
];

export const ADMIN_PIE_DATA = [
    { name: 'Approved', value: 400 },
    { name: 'Pending', value: 300 },
];

// --- Roles & KPIs ---

export const TRAINEE_KPI_CARDS = [
    { icon: "👥", name: "Active Trainees", balance: "1,245", crypto: "Out of 1,500 registered", rate: "+12% active users this month", progress: 83, color: "#1D4ED8" },
    { icon: "🛡️", name: "Global Compliance", balance: "88.5%", crypto: "1,101 Fully Certified", rate: "Target: 95% by Q3", progress: 88, color: "#10B981" },
    { icon: "⚠️", name: "Pending Renewals", balance: "142", crypto: "Expiring in 30 days", rate: "12 critical expirations today", progress: 15, color: "#EF4444" },
    { icon: "✅", name: "Avg. Pass Rate", balance: "94.2%", crypto: "First-attempt success", rate: "+2.1% improvement from last cohort", progress: 94, color: "#059669" },
    { icon: "⏳", name: "Hours Logged", balance: "8,450 hrs", crypto: "Total learning time this month", rate: "Avg. 6.7 hours per trainee", progress: 75, color: "#F59E0B" },
    { icon: "📚", name: "Modules Completed", balance: "3,210", crypto: "Across 45 active courses", rate: "\"Aviation Safety\" is top module", progress: 60, color: "#8B5CF6" },
];

export const LEVEL2_KPI_CARDS = [
    { icon: "🎓", name: "Advanced Trainees", balance: "412", crypto: "Out of 500 eligible", rate: "+5% advanced enrollments", progress: 82, color: "#1D4ED8" },
    { icon: "🏆", name: "Specialist Certs", balance: "94.5%", crypto: "389 Fully Certified", rate: "Target: 98% by EOY", progress: 94, color: "#10B981" },
    { icon: "⏳", name: "Pending Evaluations", balance: "28", crypto: "Final assessments due", rate: "Needs Review", progress: 8, color: "#EF4444" },
    { icon: "✨", name: "Avg. Distinction Rate", balance: "88.4%", crypto: "High honors achieved", rate: "+4.2% from Level 1", progress: 88, color: "#059669" },
    { icon: "🧪", name: "Lab Hours", balance: "12,400 hrs", crypto: "Practical training time", rate: "Avg. 30 hours per trainee", progress: 90, color: "#F59E0B" },
    { icon: "🗺️", name: "Simulations Passed", balance: "1,840", crypto: "Across 12 scenarios", rate: "\"Radar ATC\" is lowest pass", progress: 78, color: "#8B5CF6" },
];

export const TRAINER_KPI_CARDS = [
    { icon: "👨‍🏫", name: "Active Trainers", balance: "42", crypto: "Out of 45 rostered", rate: "93% Core Availability", progress: 93, color: "#1D4ED8" },
    { icon: "⭐", name: "Average Rating", balance: "4.8/5", crypto: "From 1.2k reviews", rate: "Top 10% Industry", progress: 96, color: "#10B981" },
    { icon: "🗓️", name: "Sessions Conducted", balance: "384", crypto: "This Month", rate: "+12% vs Last Month", progress: 75, color: "#8B5CF6" },
    { icon: "⌚", name: "Hours Taught", balance: "1,420", crypto: "Total classroom hours", rate: "Target: 1,500 hrs", progress: 94, color: "#F59E0B" },
    { icon: "📜", name: "Certifications", balance: "128", crypto: "Active teaching certs", rate: "4 pending renewal", progress: 97, color: "#059669" },
    { icon: "📋", name: "Open Slots", balance: "18", crypto: "Available this week", rate: "High demand expected", progress: 15, color: "#EF4444" },
];

export const ADMIN_KPI_CARDS = [
    { icon: "🛡️", name: "System Health", balance: "99.9%", crypto: "All services operational", rate: "Uptime: 30 days", progress: 99, color: "#10B981" },
    { icon: "🔑", name: "Active Admins", balance: "5", crypto: "Currently logged in", rate: "Staff: 8 Total", progress: 62, color: "#3B82F6" },
    { icon: "⚠️", name: "Security Alerts", balance: "0", crypto: "No critical threats", rate: "Last scan: 2m ago", progress: 0, color: "#F59E0B" },
    { icon: "🕒", name: "Recent Logs", balance: "1.2k", crypto: "Generated today", rate: "+5% vs Avg", progress: 70, color: "#6366F1" },
    { icon: "✅", name: "Pending Tasks", balance: "12", crypto: "System approvals", rate: "4 high priority", progress: 40, color: "#8B5CF6" },
    { icon: "💾", name: "DB Storage", balance: "42%", crypto: "1.2GB/5GB used", rate: "Healthy growth", progress: 42, color: "#EC4899" },
];

// --- Rosters & Users ---

export const TRAINEE_ROSTER_DATA = [
    { id: 1, date: "20 Jul 2023", time: "18:42 PM", trainee: "John Doe", role: "Pilot Cadet", status: "ON TRACK", statusColor: "#10B981", moduleTitle: "Aviation Safety", moduleProgress: "Module 3 of 5", performanceNum: "85%", performanceText: "Grade: B", traineeId: "#TRN-381782", email: "john.doe@email.com" },
    { id: 2, date: "18 Jul 2023", time: "12:35 PM", trainee: "Sarah Smith", role: "Air Traffic Controller", status: "AT RISK", statusColor: "#EF4444", moduleTitle: "Radar Operations", moduleProgress: "Module 1 of 4", performanceNum: "42%", performanceText: "Grade: F", traineeId: "#TRN-192834", email: "sarah.smith@email.com" },
    { id: 3, date: "15 Jul 2023", time: "19:11 PM", trainee: "Michael Johnson", role: "Meteorologist", status: "IN PROGRESS", statusColor: "#F59E0B", moduleTitle: "Weather Patterns", moduleProgress: "Module 4 of 5", performanceNum: "72%", performanceText: "Grade: C", traineeId: "#TRN-948271", email: "michael.j@email.com" },
    { id: 4, date: "11 Jul 2023", time: "12:00 PM", trainee: "Emma Davis", role: "Pilot Cadet", status: "ON TRACK", statusColor: "#10B981", moduleTitle: "Navigation Systems", moduleProgress: "Module 5 of 5", performanceNum: "96%", performanceText: "Grade: A", traineeId: "#TRN-562910", email: "emma.davis@email.com" },
    { id: 5, date: "10 Jul 2023", time: "16:17 PM", trainee: "Robert Wilson", role: "Maintenance Engineer", status: "IN PROGRESS", statusColor: "#F59E0B", moduleTitle: "Engine Diagnostics", moduleProgress: "Module 2 of 6", performanceNum: "68%", performanceText: "Grade: D", traineeId: "#TRN-827364", email: "r.wilson@email.com" },
    { id: 6, date: "9 Jul 2023", time: "15:24 PM", trainee: "Emily Brown", role: "Air Traffic Controller", status: "ON TRACK", statusColor: "#10B981", moduleTitle: "Emergency Protocols", moduleProgress: "Module 2 of 3", performanceNum: "91%", performanceText: "Grade: A-", traineeId: "#TRN-349812", email: "emily.b@email.com" },
    { id: 7, date: "6 Jul 2023", time: "20:18 PM", trainee: "David Miller", role: "Meteorologist", status: "ON TRACK", statusColor: "#10B981", moduleTitle: "Climate Modeling", moduleProgress: "Module 1 of 2", performanceNum: "88%", performanceText: "Grade: B+", traineeId: "#TRN-718293", email: "david.miller@email.com" },
    { id: 8, date: "2 Jul 2023", time: "14:21 PM", trainee: "Sophia Taylor", role: "Pilot Cadet", status: "AT RISK", statusColor: "#EF4444", moduleTitle: "Aerodynamics", moduleProgress: "Module 1 of 5", performanceNum: "55%", performanceText: "Grade: D-", traineeId: "#TRN-293847", email: "sophia.t@email.com" },
];

export const LEVEL2_ROSTER_DATA = [
    { id: 101, date: "22 Jul 2023", time: "09:15 AM", trainee: "Alice Smith", role: "Senior ATC", status: "ON TRACK", statusColor: "#10B981", moduleTitle: "Advanced Radar", moduleProgress: "Simulation 4 of 5", performanceNum: "92%", performanceText: "Grade: A", traineeId: "#TRN-LV2-001", email: "alice.smith@email.com" },
    { id: 102, date: "21 Jul 2023", time: "14:30 PM", trainee: "Bob Jones", role: "Captain Cadet", status: "IN PROGRESS", statusColor: "#F59E0B", moduleTitle: "Complex Weather Navigation", moduleProgress: "Simulation 2 of 4", performanceNum: "78%", performanceText: "Grade: C", traineeId: "#TRN-LV2-045", email: "bob.jones@email.com" },
    { id: 103, date: "19 Jul 2023", time: "11:05 AM", trainee: "Carol Williams", role: "Senior ATC", status: "ON TRACK", statusColor: "#10B981", moduleTitle: "Emergency Comm Protocol", moduleProgress: "Simulation 3 of 3", performanceNum: "98%", performanceText: "Grade: A+", traineeId: "#TRN-LV2-089", email: "carol.w@email.com" },
    { id: 104, date: "18 Jul 2023", time: "16:45 PM", trainee: "David Brown", role: "Chief Mechanic", status: "AT RISK", statusColor: "#EF4444", moduleTitle: "Turbine Overhaul", moduleProgress: "Practical 1 of 5", performanceNum: "58%", performanceText: "Grade: D-", traineeId: "#TRN-LV2-112", email: "david.b@email.com" },
];

export const TRAINER_ROSTER_DATA = [
    { id: 201, date: "22 Jul 2023", time: "08:30 AM", trainer: "Dr. Alan Grant", role: "Aviation History", status: "AVAILABLE", statusColor: "#10B981", specialization: "Core Curriculum", activeSessions: "3 Classes", performanceNum: "4.9", performanceText: "Rating: Excellent", trainerId: "#INS-042", email: "a.grant@ernam.org" },
    { id: 202, date: "21 Jul 2023", time: "11:15 AM", trainer: "Capt. Sarah Jenkins", role: "Radar Expert", status: "IN SESSION", statusColor: "#3B82F6", specialization: "Air Traffic Control", activeSessions: "1 Class", performanceNum: "4.7", performanceText: "Rating: Very Good", trainerId: "#INS-089", email: "s.jenkins@ernam.org" },
    { id: 203, date: "20 Jul 2023", time: "16:45 PM", trainer: "Marcus Cole", role: "Meteorology Lead", status: "UNAVAILABLE", statusColor: "#EF4444", specialization: "Weather Systems", activeSessions: "0 Classes", performanceNum: "4.8", performanceText: "Rating: Excellent", trainerId: "#INS-112", email: "m.cole@ernam.org" },
    { id: 204, date: "18 Jul 2023", time: "09:00 AM", trainer: "Elena Rostova", role: "Navigation Tech", status: "AVAILABLE", statusColor: "#10B981", specialization: "Instruments", activeSessions: "2 Classes", performanceNum: "4.5", performanceText: "Rating: Good", trainerId: "#INS-056", email: "e.rostova@ernam.org" },
];

export const ADMIN_ROSTER_DATA = [
    { id: 301, date: "22 Jul 2023", time: "10:00 AM", admin: "Edward Day", role: "Super Admin", status: "ACTIVE", statusColor: "#10B981", lastAction: "System Config Update", securityLevel: "Lv. 5", adminId: "#ADM-001", email: "e.day@ernam.org" },
    { id: 302, date: "22 Jul 2023", time: "09:45 AM", admin: "Lisa Ray", role: "Mod / Support", status: "AWAY", statusColor: "#F59E0B", lastAction: "User Approval", securityLevel: "Lv. 3", adminId: "#ADM-012", email: "l.ray@ernam.org" },
    { id: 303, date: "21 Jul 2023", time: "18:20 PM", admin: "Tom Harding", role: "System Admin", status: "OFFLINE", statusColor: "#6B7280", lastAction: "Database Maintenance", securityLevel: "Lv. 4", adminId: "#ADM-005", email: "t.harding@ernam.org" },
];

export const USERS_DATA = [
    { id: 1, name: "Alice Dupont", role: "Trainee", email: "alice@example.com", phone: "+33 6 12 34 56 78", status: "excellent", avatar: "AD", color: "#1976D2" },
    { id: 2, name: "Bob Martin", role: "Trainer", email: "bob@example.com", phone: "+33 6 98 76 54 32", status: "average", avatar: "BM", color: "#FF9800" },
    { id: 3, name: "Charlie Durand", role: "Trainee", email: "charlie@example.com", phone: "+33 6 11 22 33 44", status: "failing", avatar: "CD", color: "#E53935" },
    { id: 4, name: "Diana Prince", role: "Administrator", email: "diana@ernam.com", phone: "+33 6 55 44 33 22", status: "excellent", avatar: "DP", color: "#388E3C" },
    { id: 5, name: "Eve Dubois", role: "Trainee", email: "eve@example.com", phone: "+33 6 99 88 77 66", status: "average", avatar: "ED", color: "#8E24AA" },
    { id: 6, name: "Frank Blanc", role: "Trainer", email: "frank@example.com", phone: "+33 6 77 66 55 44", status: "failing", avatar: "FB", color: "#E53935" },
];

// --- Enrichment Helpers ---

/**
 * Enriches database profiles with randomized mock status and progress for visual variety.
 * Should be swapped for real enrollment queries later.
 */
export const getEnrichedParticipants = (data: any[]): Participant[] => {
    return data.map(p => ({
        ...p,
        status: Math.random() > 0.6 ? 'completed' : Math.random() > 0.3 ? 'enrolled' : 'inactive',
        progress: Math.floor(Math.random() * 100)
    })) as Participant[];
};
