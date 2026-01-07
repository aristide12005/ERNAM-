"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { FileText, Plus } from 'lucide-react';

export default function InstructorActivitiesView() {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (user) fetchActivities();
    }, [user]);

    const fetchActivities = async () => {
        try {
            // 1. Get my session IDs
            const { data: mySessions } = await supabase.from('session_instructors').select('session_id').eq('instructor_id', user?.id);
            const sessionIds = mySessions?.map(s => s.session_id) || [];

            if (sessionIds.length === 0) {
                setLoading(false);
                return;
            }

            // 2. Fetch activities
            const { data: acts } = await supabase
                .from('planned_activities')
                .select(`
                    id, title, description, day_order,
                    session:sessions(start_date, training_standard:training_standards(title))
                `)
                .in('session_id', sessionIds)
                .order('day_order', { ascending: true }); // Ideally ideally sort by calculated date, but day_order is proxy

            if (acts) setActivities(acts);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Activity Planner</h1>
            <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm p-8">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading activities...</div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No planned activities found. Add them in 'My Sessions'.</div>
                ) : (
                    <div className="relative border-l-2 border-gray-200 dark:border-white/10 ml-4 space-y-8">
                        {activities.map((act) => (
                            <div key={act.id} className="relative pl-8">
                                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-blue-500 border-4 border-white dark:border-[#141414]"></div>
                                <div className="mb-1 text-xs font-bold uppercase text-blue-600 tracking-wider">
                                    Day {act.day_order} • {(act.session?.training_standard as any)?.title}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{act.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 mt-1 max-w-2xl text-sm leading-relaxed">
                                    {act.description}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
