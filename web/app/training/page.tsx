"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Calendar, Users, ArrowRight, Plane } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

type Course = {
    id: string;
    title_fr: string;
    description_fr: string;
    start_date: string;
    status: 'upcoming' | 'active' | 'completed';
}

export default function TrainingPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            const { data } = await supabase
                .from('courses')
                .select('*')
                .order('start_date', { ascending: true });

            if (data) setCourses(data);
            setLoading(false);
        };

        fetchCourses();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 flex justify-between items-end"
            >
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                        Training Hangar
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Active missions and upcoming qualifications.
                    </p>
                </div>
                <div className="hidden md:block">
                    <div className="flex items-center gap-2 text-sm text-blue-400 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Live Campus Status: Operational
                    </div>
                </div>
            </motion.div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course, index) => (
                    <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative bg-card border border-border hover:border-blue-500/50 rounded-2xl p-6 transition-all hover:bg-secondary/40 hover:shadow-2xl hover:-translate-y-1 overflow-hidden flex flex-col"
                    >
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Plane className="h-24 w-24 -rotate-12" />
                        </div>

                        {/* Status Badge */}
                        <div className="mb-6 flex justify-between items-start">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider border ${course.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                }`}>
                                {course.status.toUpperCase()}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 min-h-[3.5rem]">
                            {course.title_fr}
                        </h3>

                        <p className="text-muted-foreground text-sm mb-6 line-clamp-3">
                            {course.description_fr}
                        </p>

                        {/* Metadata Footer */}
                        <div className="space-y-3 pt-4 border-t border-border/50 mt-auto">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Calendar className="h-4 w-4 text-blue-400" />
                                <span>Start: {new Date(course.start_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Users className="h-4 w-4 text-blue-400" />
                                <span>24 Enrolled</span>
                            </div>
                        </div>

                        {/* Action Button - Updated to Link */}
                        <Link
                            href={`/training/${course.id}`}
                            className="mt-6 w-full py-3 bg-secondary hover:bg-primary/20 hover:text-white border border-border hover:border-primary/50 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white"
                        >
                            view_mission_details
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </motion.div>
                ))}
            </div>

            {courses.length === 0 && !loading && (
                <div className="text-center py-20 text-muted-foreground">
                    <p>No active courses found.</p>
                </div>
            )}

        </div>
    )
}
