"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';
import {
    Calendar,
    MapPin,
    Clock,
    CheckCircle2,
    ArrowLeft,
    ArrowRight,
    Plane,
    ShieldCheck,
    AlertTriangle,
    Lock,
    FileText,
    PlayCircle,
    HelpCircle,
    UserCheck,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// Types
type Course = {
    id: string;
    title_fr: string;
    description_fr: string;
    start_date: string;
    enrollment_mode: 'auto' | 'manual';
    status: string;
}

type Module = {
    id: string;
    title: string;
    sort_order: number;
    items: CourseItem[];
}

type CourseItem = {
    id: string;
    title: string;
    content_type: 'video' | 'pdf' | 'quiz' | 'text';
    sort_order: number;
}

// Helper icons map
const TypeIcon = {
    video: PlayCircle,
    pdf: FileText,
    quiz: HelpCircle,
    text: FileText
};

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();

    // Safely get ID
    const id = typeof params?.id === 'string' ? params.id : null;

    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [enrolling, setEnrolling] = useState(false);
    const [enrollmentStatus, setEnrollmentStatus] = useState<'idle' | 'success' | 'pending_approval' | 'error' | 'already_enrolled'>('idle');
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get authenticated user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setError('Please log in to view courses');
                    setLoading(false);
                    return;
                }
                setUserId(user.id);

                // 1. Fetch Course
                const { data: courseData, error: courseError } = await supabase
                    .from('courses')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (courseError) throw courseError;
                setCourse(courseData);

                // 2. Fetch Modules & Items
                const { data: modulesData, error: modulesError } = await supabase
                    .from('modules')
                    .select(`
    *,
    items: course_items(*)
          `)
                    .eq('course_id', id)
                    .eq('is_published', true)
                    .order('sort_order', { ascending: true });

                if (!modulesError && modulesData) {
                    const sorted = modulesData.map((m: any) => ({
                        ...m,
                        items: m.items ? m.items.sort((a: any, b: any) => a.sort_order - b.sort_order) : []
                    }));
                    const sortedModules = sorted.sort((a: any, b: any) => a.sort_order - b.sort_order);
                    setModules(sortedModules);
                }

                // 3. Check Enrollment
                const { data: enrollment } = await supabase
                    .from('enrollments')
                    .select('status')
                    .eq('course_id', id)
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (enrollment) {
                    if (enrollment.status === 'active') setEnrollmentStatus('already_enrolled');
                    else if (enrollment.status === 'pending') setEnrollmentStatus('pending_approval');
                }

            } catch (err: any) {
                console.error("Error fetching course:", err);
                setError(err.message || "Failed to load mission details.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleEnroll = async () => {
        if (!course || !userId) return;
        setEnrolling(true);

        // Simulate network delay for effect
        await new Promise(r => setTimeout(r, 800));

        const newStatus = course.enrollment_mode === 'manual' ? 'pending' : 'active';

        const { error } = await supabase
            .from('enrollments')
            .insert({
                user_id: userId,
                course_id: course.id,
                status: newStatus
            });

        if (error) {
            if (error.code === '23505') {
                setEnrollmentStatus('already_enrolled');
            } else {
                console.error("Enrollment error:", error);
                setEnrollmentStatus('error');
            }
        } else {
            setEnrollmentStatus(newStatus === 'pending' ? 'pending_approval' : 'success');
        }
        setEnrolling(false);
    };

    // Loading State
    if (loading) return (
        <div className="flex h-screen w-full items-center justify-center bg-background text-white">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <p className="text-muted-foreground animate-pulse tracking-widest uppercase text-xs">Accessing Secure Archives...</p>
            </div>
        </div>
    );

    // Error State
    if (error || !course) return (
        <div className="flex h-screen w-full items-center justify-center bg-background p-4">
            <div className="max-w-md w-full p-6 bg-card border border-red-500/20 rounded-xl text-center space-y-4">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
                <h2 className="text-xl font-bold text-white">Mission Data Unavailable</h2>
                <p className="text-muted-foreground">{error || "Course not found."}</p>
                <button
                    onClick={() => router.push('/training')}
                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-white rounded-lg transition-colors"
                >
                    Return to Hangar
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-full bg-background relative pb-20 overflow-x-hidden">
            {/* Background Ambience */}
            <div className="fixed top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-blue-900/10 via-blue-900/5 to-background z-0 pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">

                {/* Nav Back */}
                <button
                    onClick={() => router.push('/training')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-white mb-8 transition-all hover:-translate-x-1 group"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:text-blue-400 transition-colors" />
                    <span>Return to Hangar</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                    {/* LEFT COLUMN: Content Canvas (8 cols) */}
                    <div className="lg:col-span-8 space-y-10">

                        {/* Header */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`px - 3 py - 1 rounded - full text - xs font - bold tracking - wider uppercase border flex items - center gap - 2 ${course.enrollment_mode === 'manual'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    } `}>
                                    {course.enrollment_mode === 'manual' ? (
                                        <><Lock className="h-3 w-3" /> Restricted Access</>
                                    ) : (
                                        <><Plane className="h-3 w-3" /> Open Enrollment</>
                                    )}
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                                    ICAO Compliant
                                </span>
                            </div>

                            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
                                {course.title_fr}
                            </h1>

                            <div className="prose prose-invert max-w-none text-gray-400 text-lg leading-relaxed">
                                {course.description_fr}
                            </div>
                        </motion.div>

                        {/* THE CURRICULUM ARCHITECT VIEW (Roadmap) */}
                        <div className="space-y-6 pt-8 border-t border-white/5">
                            <div className="flex items-center justify-between pb-2">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-indigo-400" />
                                    Mission Roadmap
                                </h3>
                                <span className="text-xs font-mono text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                                    {modules.reduce((acc, m) => acc + m.items.length, 0)} UNITS
                                </span>
                            </div>

                            <div className="space-y-4">
                                {modules.length > 0 ? (
                                    modules.map((module, i) => (
                                        <motion.div
                                            key={module.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="bg-card/50 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm hover:border-white/10 transition-colors"
                                        >
                                            {/* Module Top Bar */}
                                            <div className="p-4 bg-secondary/20 flex items-center justify-between border-b border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 font-bold text-sm">
                                                        {i + 1}
                                                    </div>
                                                    <span className="font-semibold text-gray-200 tracking-wide">{module.title}</span>
                                                </div>
                                            </div>

                                            {/* Items List */}
                                            <div className="divide-y divide-white/5">
                                                {module.items.map((item) => {
                                                    const Icon = TypeIcon[item.content_type] || FileText;
                                                    const isUnlocked = enrollmentStatus === 'success' || enrollmentStatus === 'already_enrolled';

                                                    return (
                                                        <div key={item.id} className={`p - 4 flex items - center gap - 4 transition - colors group ${isUnlocked ? 'hover:bg-white/5 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                                                            } `}>
                                                            <div className={`p - 2 rounded - lg ${isUnlocked ? 'bg-blue-500/10 text-blue-400' : 'bg-secondary text-gray-600'} `}>
                                                                {isUnlocked ? <Icon className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                                            </div>

                                                            <div className="flex-1">
                                                                <p className={`text - sm font - medium ${isUnlocked ? 'text-gray-300' : 'text-gray-500'} `}>
                                                                    {item.title}
                                                                </p>
                                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{item.content_type}</span>
                                                            </div>

                                                            {isUnlocked && (
                                                                <div className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                                                    ACCESS
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                                {module.items.length === 0 && (
                                                    <div className="p-4 text-center text-xs text-muted-foreground italic">No materials declassified yet.</div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center border border-dashed border-gray-800 rounded-xl bg-secondary/10">
                                        <ShieldCheck className="h-10 w-10 text-gray-700 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">Curriculum strictly confidential.</p>
                                        <p className="text-gray-600 text-sm">Clearance required to view mission objectives.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Action & Status Card (The Cockpit) (4 cols) */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-8 space-y-6">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-card border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden"
                            >
                                {/* Decorative background glow */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />

                                {/* Artwork */}
                                <div className="relative h-48 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 mb-6 overflow-hidden flex items-center justify-center border border-white/5 group">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                                    <div className="text-center z-10 p-4 bg-black/30 backdrop-blur-md rounded-xl border border-white/10">
                                        <div className="text-3xl font-black text-white">
                                            {new Date(course.start_date).getDate()}
                                        </div>
                                        <div className="text-xs uppercase tracking-widest text-blue-200">
                                            {new Date(course.start_date).toLocaleString('default', { month: 'long' })}
                                        </div>
                                    </div>
                                </div>

                                {/* Meta Data */}
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-blue-500" /> Duration
                                        </span>
                                        <span className="text-white font-medium">4 Weeks</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Credits
                                        </span>
                                        <span className="text-white font-medium">12 ECTS</span>
                                    </div>
                                </div>

                                {/* GATEKEEPER SWITCH LOGIC */}
                                <AnimatePresence mode="wait">
                                    {enrollmentStatus === 'success' || enrollmentStatus === 'already_enrolled' ? (
                                        <motion.div
                                            key="active"
                                            initial={{ scale: 0.95, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-3"
                                        >
                                            <div className="h-12 w-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                                                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-emerald-400 font-bold text-lg">Mission Active</h3>
                                                <p className="text-xs text-emerald-500/70">Secure channel established.</p>
                                            </div>
                                            <button className="w-full py-3 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-900/20">
                                                ENTER CLASSROOM
                                            </button>
                                        </motion.div>

                                    ) : enrollmentStatus === 'pending_approval' ? (
                                        <motion.div
                                            key="pending"
                                            initial={{ scale: 0.95, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center space-y-3"
                                        >
                                            <div className="h-12 w-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
                                                <UserCheck className="h-6 w-6 text-amber-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-amber-400 font-bold text-lg">Clearance Pending</h3>
                                                <p className="text-xs text-amber-500/70">
                                                    Director review in progress.
                                                </p>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.button
                                            key="enroll-btn"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            onClick={handleEnroll}
                                            disabled={enrolling}
                                            className={`w - full py - 4 text - white font - bold rounded - xl shadow - xl transition - all active: scale - 95 flex items - center justify - center gap - 2 border - t border - white / 10 ${course.enrollment_mode === 'manual'
                                                ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-900/20'
                                                : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 shadow-blue-900/20'
                                                } `}
                                        >
                                            {enrolling ? (
                                                <Loader2 className="animate-spin h-5 w-5 text-white" />
                                            ) : (
                                                <>
                                                    {course.enrollment_mode === 'manual' ? 'REQUEST CLEARANCE' : 'CONFIRM ENROLLMENT'}
                                                    <ArrowRight className="h-5 w-5" />
                                                </>
                                            )}
                                        </motion.button>
                                    )}
                                </AnimatePresence>

                                {/* Error State */}
                                {enrollmentStatus === 'error' && (
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center text-xs text-red-400 flex items-center justify-center gap-1 font-medium bg-red-900/20 py-2 rounded-lg">
                                        <AlertTriangle className="h-3 w-3" />
                                        System Error. Retrying connection...
                                    </motion.p>
                                )}

                            </motion.div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
