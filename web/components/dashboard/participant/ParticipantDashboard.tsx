"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bell, 
    Calendar, 
    BookOpen, 
    User, 
    Award, 
    ArrowRight, 
    Clock, 
    MapPin, 
    CheckCircle, 
    FileText, 
    Settings,
    LogOut,
    Search,
    MessageSquare,
    ClipboardList,
    HelpCircle,
    ChevronRight,
    LayoutGrid,
    Loader2
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Import sub-views
import TraineeProfile from '@/components/dashboard/trainee/TraineeProfile';
import CertificatesView from './CertificatesView';
import MyLearningView from './MyLearningView';
import Resources from '@/components/dashboard/trainee/Resources';
import TraineeSchedule from '@/components/dashboard/trainee/TraineeSchedule';
import ParticipantSessionView from './ParticipantSessionView';

export default function ParticipantDashboard() {
    const { user, profile, signOut } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [currentSession, setCurrentSession] = useState<any>(null);
    const [stats, setStats] = useState({
        materialsCount: 0,
        assessmentStatus: 'Pending',
        certificateStatus: 'not_issued',
        messagesCount: 0,
        progress: 0
    });

    const searchParams = useSearchParams();
    const activeView = searchParams.get('view') || 'dashboard';

    useEffect(() => {
        if (profile) fetchCurrentTraining();
    }, [profile]);

    const fetchCurrentTraining = async () => {
        setLoading(true);
        try {
            const { data: participation } = await supabase
                .from('session_participants')
                .select('session_id')
                .eq('participant_id', profile?.id || user?.id)
                .limit(1)
                .single();

            if (participation?.session_id) {
                const sid = participation.session_id;
                const { data: session } = await supabase
                    .from('sessions')
                    .select('*, training_standard:training_standards(title, code)')
                    .eq('id', sid)
                    .single();

                if (session) {
                    setCurrentSession(session);
                    
                    // Fetch stats concurrently
                    const [docs, msgs, assessments, certs] = await Promise.all([
                        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('session_id', sid),
                        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('session_id', sid),
                        supabase.from('assessments').select('result').eq('session_id', sid).eq('participant_id', profile?.id || user?.id).single(),
                        supabase.from('certificates').select('id').eq('session_id', sid).eq('participant_id', profile?.id || user?.id).single()
                    ]);

                    // Calculate progress
                    const start = new Date(session.start_date).getTime();
                    const end = new Date(session.end_date).getTime();
                    const now = new Date().getTime();
                    const progress = end > start ? Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100))) : 0;

                    setStats({
                        materialsCount: docs.count || 0,
                        assessmentStatus: assessments.data?.result || 'Pending',
                        certificateStatus: certs.data ? 'issued' : 'not_issued',
                        messagesCount: msgs.count || 0,
                        progress
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching trainee data:", err);
        }
        setLoading(false);
    };

    const handleNavigate = (view: string) => {
        router.push(`/dashboard?view=${view}`);
    };

    // Sub-components for cleaner structure
    const Sidebar = () => (
        <aside className="w-[300px] bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 shrink-0">
            {/* Branding */}
            {/* Institutional Branding Header */}
            <div className="p-8">
                <div className="flex items-center gap-3 bg-white hover:bg-gray-50 transition-all border border-gray-100 rounded-full pr-5 pl-1.5 py-1.5 shadow-sm cursor-pointer group w-fit">
                    <div className="flex items-center -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 border-2 border-[#12388D] relative z-10 group-hover:-translate-x-1 transition-transform">
                            <img src="/logos/asecna-logo.png" alt="ASECNA" className="w-full h-full object-contain rounded-full" />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 border-2 border-[#12388D] relative z-20 shadow-sm group-hover:translate-x-1 transition-transform">
                            <img src="/logos/ernam-logo.png" alt="ERNAM" className="w-full h-full object-contain rounded-full" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-900 font-black text-xs leading-tight tracking-wide">ASECNA - ERNAM</span>
                        <span className="text-[#12388D] font-bold text-[8px] leading-tight flex items-center gap-1 uppercase tracking-widest opacity-90">
                            Digital Twin <span className="w-1 h-1 rounded-full bg-blue-600 animate-pulse"></span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Profile Section */}
            <div className="px-8 py-6 mb-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                    <div className="w-12 h-12 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-black text-lg">
                        {profile?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm text-gray-900 truncate">{profile?.full_name || 'My Profile'}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Trainee Member</span>
                    </div>
                </div>
            </div>

            {/* Navigation Groups */}
            <nav className="flex-1 px-6 space-y-8 overflow-y-auto">
                <div>
                    <h4 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Learning Hub</h4>
                    <div className="space-y-1">
                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
                            { id: 'schedule', label: 'Time Schedule', icon: Calendar },
                            { id: 'messages', label: 'Notifications', icon: Bell },
                            { id: 'courses', label: 'Learning Plan', icon: ClipboardList }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleNavigate(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all",
                                    activeView === item.id 
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Support & Care</h4>
                    <div className="space-y-1">
                        {[
                            { id: 'help', label: 'Help / Report', icon: HelpCircle },
                            { id: 'contact', label: 'Contact Us', icon: User }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleNavigate(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all",
                                    activeView === item.id 
                                        ? "bg-blue-600 text-white" 
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

        </aside>
    );

    const DashboardContent = () => (
        <div className="flex-1 bg-[#F8FAFC]">
            {/* Top Bar */}
            <div className="h-[100px] px-12 flex items-center justify-between sticky top-0 bg-[#F8FAFC]/80 backdrop-blur-md z-40">
                <div className="flex items-center gap-8 flex-1 max-w-2xl">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight shrink-0">Dashboard</h2>
                    <div className="relative w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search courses, materials..." 
                            className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">1 Hour remaining</span>
                    </div>
                    <button className="px-6 py-3.5 bg-[#12388D] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-800 transition-all active:scale-95">
                        New Courses
                    </button>
                    <button 
                        onClick={() => signOut()}
                        className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm border border-gray-100"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <main className="px-12 pb-12 space-y-10">
                {/* Hero Card */}
                <div className="bg-white rounded-[40px] border border-gray-100 p-10 flex flex-col md:flex-row items-center justify-between relative overflow-hidden group shadow-sm min-h-[340px]">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-blue-100 transition-all duration-700" />
                    
                    <div className="relative z-10 space-y-6 max-w-lg">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                                Hello Mr/Mrs. {profile?.full_name?.split(' ')[0] || ''},
                            </h1>
                            <p className="text-gray-500 font-medium leading-relaxed">
                                You have completed <span className="text-blue-600 font-black">{stats.progress}%</span> of your current training path. 
                                Maintain your momentum to stay on schedule.
                            </p>
                        </div>
                        <button 
                            onClick={() => handleNavigate('courses')}
                            className="px-8 py-4 bg-[#12388D] text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/10 hover:-translate-y-1 transition-all"
                        >
                            View Result
                        </button>
                    </div>

                    <div className="relative z-10 flex items-center justify-center pt-8 md:pt-0">
                        <div className="relative w-[340px] h-[220px]">
                             <img 
                                src="/illustrations/trainee_hero.png" 
                                alt="Dashboard Illustration" 
                                className="w-full h-full object-contain filter drop-shadow-2xl group-hover:scale-105 transition-transform duration-700" 
                             />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8 items-start">
                    {/* Your Courses Section */}
                    <div className="col-span-12 lg:col-span-7 space-y-6">
                        <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8 px-4">
                                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-900 border-b-2 border-blue-600 pb-2">Your Courses</h3>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                        <input type="text" placeholder="Search Course" className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-100" />
                                    </div>
                                    <button className="p-2.5 border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-400"><Settings className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[currentSession].filter(Boolean).map((session, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-6 bg-white border border-gray-50 rounded-3xl hover:border-blue-100 hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                {(session.training_standard as any)?.title?.charAt(0) || 'C'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{ (session.training_standard as any)?.title }</h4>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{ (session.training_standard as any)?.code }</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-10">
                                            <div className="text-right">
                                                <span className="font-black text-xl text-gray-900">{stats.progress}%</span>
                                            </div>
                                            <button 
                                                onClick={() => handleNavigate(`session`)}
                                                className="px-6 py-3 bg-gray-50 text-gray-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#12388D] hover:text-white transition-all flex items-center gap-2 group/btn"
                                            >
                                                View <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-all" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                {!currentSession && (
                                    <div className="py-20 text-center flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                                            <BookOpen className="w-8 h-8" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No Active Enrollments</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex justify-center gap-4">
                                <button className="px-8 py-3.5 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 rounded-xl transition-all">View More</button>
                                <button className="px-8 py-3.5 bg-[#12388D] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/10">Enroll Course</button>
                            </div>
                        </div>
                    </div>

                    {/* Right Results & Actions Section */}
                    <div className="col-span-12 lg:col-span-5 space-y-8">
                        {/* Recent Results */}
                        <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8 px-2">
                                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-900 tracking-widest">Recent Results</h3>
                                <button className="text-[10px] font-bold text-blue-600 flex items-center gap-1">View More <ChevronRight className="w-3 h-3" /></button>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { name: "Progress Result", val: stats.progress, color: "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]" },
                                    { name: "Documentation", val: 87, color: "bg-[#00D7AA] shadow-[0_0_10px_rgba(0,215,170,0.3)]" },
                                    { name: "Attendance", val: 50, color: "bg-gray-900 shadow-[0_0_10px_rgba(0,0,0,0.1)]" },
                                    { name: "Module Check", val: 37, color: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" }
                                ].map((item, i) => (
                                    <div key={i} className="space-y-3">
                                        <div className="flex justify-between items-end px-1">
                                            <span className="text-[11px] font-bold text-gray-500 tracking-tight">{item.name}</span>
                                            <span className="text-[11px] font-black text-gray-900">{item.val}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.val}%` }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                className={cn("h-full rounded-full", item.color)} 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Cards */}
                        <div className="space-y-4">
                            {[
                                { title: "Leave", desc: "Want to take a Leave?", icon: <User className="w-5 h-5" /> },
                                { title: "Complaint", desc: "Want to complaint against someone?", icon: <MessageSquare className="w-5 h-5" /> }
                            ].map((card, i) => (
                                <button key={i} className="w-full bg-white border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 rounded-3xl p-6 flex items-center justify-between group transition-all shadow-sm">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-gray-100 group-hover:scale-110 group-hover:bg-white group-hover:text-[#12388D] transition-all duration-300">
                                            {card.icon}
                                        </div>
                                        <div className="text-left">
                                            <h5 className="font-bold text-sm text-gray-900 leading-none">{card.title}</h5>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{card.desc}</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-700" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Synchronizing Environment</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-white">
            <Sidebar />
            
            <AnimatePresence mode="wait">
                {activeView === 'dashboard' ? (
                    <motion.div key="dashboard" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="flex-1">
                        <DashboardContent />
                    </motion.div>
                ) : (
                    <motion.div key="subview" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }} className="flex-1 p-12 bg-[#F8FAFC] flex flex-col">
                        <div className="max-w-6xl w-full mx-auto flex flex-col flex-1">
                            <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-3 text-gray-400 hover:text-gray-900 font-black text-[10px] uppercase tracking-widest mb-10 transition-colors group self-start">
                                <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" /> Back to Intelligence Dashboard
                            </button>
                            
                            <div className="bg-white rounded-[40px] border border-gray-100 p-10 shadow-sm flex-1 min-h-[600px]">
                                {activeView === 'schedule' && <TraineeSchedule />}
                                {activeView === 'courses' && <MyLearningView onLaunch={(id) => handleNavigate(`session&sessionId=${id}`)} />}
                                {activeView === 'messages' && (
                                    <div className="py-20 text-center flex flex-col items-center gap-8">
                                        <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center text-blue-100 border border-gray-100">
                                            <Bell className="w-10 h-10" />
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-3xl font-black text-gray-900 tracking-tight">Notification Studio</h3>
                                            <p className="text-gray-400 max-w-sm mx-auto font-medium leading-relaxed">Stay updated with the latest course alerts and institutional messages in real-time.</p>
                                        </div>
                                    </div>
                                )}
                                {activeView === 'session' && currentSession && <ParticipantSessionView sessionId={currentSession.id} onBack={() => handleNavigate('dashboard')} />}
                                {activeView === 'help' && (
                                    <div className="py-12 max-w-2xl mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 border border-blue-100 mb-6 shadow-sm">
                                            <HelpCircle className="w-8 h-8" />
                                        </div>
                                        <div className="text-center space-y-2 mb-10">
                                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Request Assistance</h3>
                                            <p className="text-gray-500 text-sm font-medium">Describe your issue below and our technical team will review it.</p>
                                        </div>
                                        <form className="w-full space-y-6" onSubmit={async (e) => {
                                            e.preventDefault();
                                            const btn = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement;
                                            btn.disabled = true;
                                            btn.innerHTML = 'Submitting...';
                                            btn.innerHTML = 'Submitting...';
                                            toast.success("Support request submitted successfully. Check your email for updates.");
                                            (e.target as HTMLFormElement).reset();
                                            btn.disabled = false;
                                            btn.innerHTML = 'Submit Request';
                                        }}>
                                            <div className="space-y-4">
                                                <input required type="text" name="subject" placeholder="Brief subject/title" className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                                                <select required name="category" className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none cursor-pointer">
                                                    <option value="">Select Category</option>
                                                    <option value="technical">Technical Issue</option>
                                                    <option value="account">Account Access</option>
                                                    <option value="content">Course Content</option>
                                                    <option value="other">Other</option>
                                                </select>
                                                <textarea required name="description" rows={5} placeholder="Describe your problem in detail..." className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none resize-none transition-all" />
                                            </div>
                                            <button type="submit" className="w-full py-4 bg-[#12388D] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/10 hover:bg-blue-800 transition-all active:scale-[0.98]">
                                                Submit Request
                                            </button>
                                        </form>
                                    </div>
                                )}
                                {activeView === 'contact' && (
                                    <div className="py-12 max-w-2xl mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="w-20 h-20 bg-[#F3F4F6] rounded-3xl flex items-center justify-center text-gray-700 border border-gray-200 mb-6 shadow-sm">
                                            <User className="w-8 h-8" />
                                        </div>
                                        <div className="text-center space-y-2 mb-10">
                                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Contact Administration</h3>
                                            <p className="text-gray-500 text-sm font-medium">Send a direct message to your assigned faculty instructors.</p>
                                        </div>
                                        <form className="w-full space-y-6" onSubmit={async (e) => {
                                            e.preventDefault();
                                            const btn = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement;
                                            btn.disabled = true;
                                            btn.innerHTML = 'Sending...';
                                            btn.innerHTML = 'Sending...';
                                            toast.success("Message sent to administration successfully.");
                                            (e.target as HTMLFormElement).reset();
                                            btn.disabled = false;
                                            btn.innerHTML = 'Send Message';
                                        }}>
                                            <div className="space-y-4">
                                                <input required type="text" name="subject" placeholder="Message Subject" className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all" />
                                                <textarea required name="message" rows={5} placeholder="Type your message here..." className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none resize-none transition-all" />
                                            </div>
                                            <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all active:scale-[0.98]">
                                                Send Message
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

