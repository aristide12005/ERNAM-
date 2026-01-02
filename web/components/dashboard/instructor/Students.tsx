import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Search, UserCheck, UserX, MoreVertical, Mail, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function Students({ instructorId }: { instructorId: string }) {
    const t = useTranslations('InstructorDashboard');
    const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchStudents();

        // Realtime subscription
        const channel = supabase
            .channel('enrollments-students-view')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'enrollments' },
                () => fetchStudents()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeTab]);

    const fetchStudents = async () => {
        setLoading(true);
        // Fetch enrollments for courses owned by this instructor (simplified for now to all enrollments pending RLS)
        const { data, error } = await supabase
            .from('enrollments')
            .select(`
                id,
                status,
                course:courses(title_en),
                student:profiles(id, full_name, email, role)
            `)
            .eq('status', activeTab);

        if (error) {
            console.error('Error fetching students:', error);
        } else {
            // Client-side filter for instructor ownership if RLS doesn't cover it fully yet
            // For safety, we assume RLS handles it, but we can double check 'course.instructor_id' if needed.
            setStudents(data || []);
        }
        setLoading(false);
    };

    const handleAction = async (id: string, action: 'active' | 'failed') => {
        const { error } = await supabase.from('enrollments').update({ status: action }).eq('id', id);
        if (!error) {
            fetchStudents();
        }
    };

    const filtered = students.filter(s =>
        s.student?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.student?.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.course?.title_en?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight">{t('students_title')}</h1>
                    <p className="text-muted-foreground text-sm">{t('students_desc')}</p>
                </div>

                <div className="flex bg-secondary/50 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'active'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {t('active_students')}
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pending'
                            ? 'bg-amber-500/10 text-amber-600 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {t('pending_requests')}
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder={t('search_students')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>

            {/* List */}
            <div className="grid gap-3">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">{t('loading_students')}</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 bg-card border border-border rounded-xl border-dashed">
                        <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">
                            {activeTab === 'active' ? t('no_active_students') : t('no_pending_requests')}
                        </p>
                    </div>
                ) : (
                    // Deduplicate logic: groupBy student ID
                    Object.values(
                        filtered.reduce((acc: any, item: any) => {
                            if (!item.student?.id) return acc;
                            if (!acc[item.student.id]) {
                                acc[item.student.id] = {
                                    ...item.student,
                                    enrollments: []
                                };
                            }
                            acc[item.student.id].enrollments.push(item);
                            return acc;
                        }, {})
                    ).map((student: any) => (
                        <motion.div
                            key={student.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => {
                                // Future: Open student detail modal
                                console.log("Open details for", student.full_name);
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {student.full_name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{student.full_name || 'Unknown User'}</h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Mail className="h-3 w-3" />
                                        <span>{student.email || 'No Email'}</span>
                                        <span className="w-1 h-1 bg-border rounded-full" />

                                        {/* Course Display Logic */}
                                        <span className="bg-secondary px-2 py-0.5 rounded-md text-foreground font-medium">
                                            {student.enrollments.length > 1
                                                ? `${student.enrollments.length} ${t('active_courses')}`
                                                : student.enrollments[0]?.course?.title_en || 'Unknown Course'}
                                        </span>
                                    </div>
                                    {student.enrollments.length > 1 && (
                                        <div className="text-[10px] text-muted-foreground mt-1 pl-5">
                                            {t('includes')} {student.enrollments.map((e: any) => e.course?.title_en).join(', ')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {activeTab === 'active' ? (
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Active
                                        </span>
                                        <button className="p-2 hover:bg-secondary rounded-lg text-muted-foreground transition-colors">
                                            <MoreVertical className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {/* Simplification: Just show actions for the FIRST request for now, or expand to show all */}
                                        {student.enrollments.map((enrollment: any) => (
                                            <div key={enrollment.id} className="flex gap-2">
                                                {student.enrollments.length > 1 && <span className="text-[10px] self-center truncate max-w-[100px]">{enrollment.course?.title_en}</span>}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleAction(enrollment.id, 'active'); }}
                                                    className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
                                                >
                                                    <UserCheck className="h-3 w-3" />
                                                    {t('approve')}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleAction(enrollment.id, 'failed'); }}
                                                    className="px-3 py-1.5 bg-red-500/10 text-red-600 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
                                                >
                                                    <UserX className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

function Users(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
