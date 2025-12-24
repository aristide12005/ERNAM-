import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function StudentListDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchStudents();

            // Set up real-time subscription for enrollment changes
            const channel = supabase
                .channel('enrollments-instructor-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'enrollments'
                    },
                    (payload) => {
                        console.log('Enrollment change detected:', payload);
                        // Refresh student list
                        fetchStudents();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [isOpen, activeTab]);

    const fetchStudents = async () => {
        setLoading(true);
        // In a real app, filtering by 'course.instructor_id' requires more complex query or RLS
        // For now, we fetch enrollments and filter client-side if needed, or rely on RLS returning only relevant data
        const { data } = await supabase
            .from('enrollments')
            .select(`
                id,
                status,
                course:courses(title, instructor_id),
                student:profiles(id, full_name, role)
            `)
            .eq('status', activeTab);

        if (data) {
            setStudents(data);
        }
        setLoading(false);
    };

    const handleAction = async (id: string, action: 'active' | 'failed') => {
        const { error } = await supabase.from('enrollments').update({ status: action }).eq('id', id);
        if (!error) {
            setStudents(prev => prev.filter(s => s.id !== id));
        }
    };

    const filtered = students.filter(s =>
        s.student?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.course?.title?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 m-auto z-50 w-full max-w-2xl h-[80vh] bg-[#1a1d24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div>
                                <h2 className="text-xl font-bold text-white">Class Management</h2>
                                <p className="text-xs text-muted-foreground">Manage student roster & requests</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/10">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'active' ? 'bg-white/5 text-white border-b-2 border-emerald-500' : 'text-gray-400 hover:text-white'}`}
                            >
                                Active Students
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'pending' ? 'bg-white/5 text-white border-b-2 border-amber-500' : 'text-gray-400 hover:text-white'}`}
                            >
                                Pending Requests
                            </button>
                        </div>

                        <div className="p-4 border-b border-white/10">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto p-4 space-y-2 flex-1">
                            {loading ? (
                                <div className="text-center py-8 text-muted-foreground animate-pulse">Loading list...</div>
                            ) : filtered.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">No {activeTab} records found.</div>
                            ) : (
                                filtered.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg border border-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                                                {item.student?.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-200">{item.student?.full_name || 'Unknown'}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-gray-500 font-mono bg-black/20 px-1.5 rounded">{item.course?.title || 'Unknown Course'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {activeTab === 'active' ? (
                                            <div className="text-xs uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                                                Active
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAction(item.id, 'active')}
                                                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1.5 rounded transition-colors border border-emerald-500/20"
                                                >
                                                    APPROVE
                                                </button>
                                                <button
                                                    onClick={() => handleAction(item.id, 'failed')}
                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold px-3 py-1.5 rounded transition-colors border border-red-500/20"
                                                >
                                                    REJECT
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
