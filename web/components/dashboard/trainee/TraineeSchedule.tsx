"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import {
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Video,
    ChevronLeft,
    ChevronRight,
    Users,
    Plane,
    Radio
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function TraineeSchedule() {
    const { user } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        // Mocking some sequence for the timeline
        setEvents([
            { id: 1, title: 'Simulator Training: Session A', type: 'sim', time: '09:00 - 11:00', location: 'SIM ROOM 04', instructor: 'Capt. Diallo', icon: Plane },
            { id: 2, title: 'Radio Communications Workshop', type: 'lecture', time: '13:00 - 15:00', location: 'HALL B', instructor: 'Dr. Fall', icon: Radio },
            { id: 3, title: 'Meteorology Advanced Exam', type: 'exam', time: 'Tomorrow, 10:00', location: 'CBT LAB 1', instructor: 'Proctor Kane', icon: Clock },
        ]);
    }, []);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <CalendarIcon className="h-6 w-6 text-blue-600" /> Training Schedule
                    </h2>
                    <p className="text-sm text-slate-500">Track your upcoming simulator sessions and lecture times.</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><ChevronLeft className="h-4 w-4" /></button>
                    <div className="font-bold text-sm text-slate-900 min-w-32 text-center">
                        {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </div>
                    <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><ChevronRight className="h-4 w-4" /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calendar Grid View */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                        <div className="grid grid-cols-7 gap-1 mb-4">
                            {days.map(d => (
                                <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">
                                    {d}
                                </div>
                            ))}
                            {Array.from({ length: 31 }).map((_, i) => (
                                <button
                                    key={i}
                                    className={`aspect-square flex flex-col items-center justify-center rounded-xl transition-all ${(i + 1) === 14 ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/20 scale-105' : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                >
                                    <span className="text-sm">{i + 1}</span>
                                    {(i + 1) === 14 && <div className="h-1 w-1 bg-white rounded-full mt-1" />}
                                    {((i + 1) === 15 || (i + 1) === 20) && <div className="h-1 w-1 bg-blue-400 rounded-full mt-1" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-600/20">
                        <div className="relative z-10 space-y-4">
                            <h3 className="text-lg font-bold">Upcoming Exam Alert</h3>
                            <p className="text-blue-100 text-sm leading-relaxed max-w-md">Your **Meteorology Advanced Exam** is scheduled for tomorrow at 10:00 AM. Ensure you have your student ID and required calculator.</p>
                            <button className="bg-white text-blue-600 px-6 py-2 rounded-xl font-bold text-sm hover:shadow-lg transition-all">REVIEW MATERIALS</button>
                        </div>
                        <CalendarIcon className="absolute -right-8 -bottom-8 h-48 w-48 text-white/10 rotate-12" />
                    </div>
                </div>

                {/* Vertical Timeline */}
                <div className="space-y-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                        Today&apos;s Sequence <div className="flex-1 h-px bg-slate-100" />
                    </h3>

                    <div className="space-y-4 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                        {events.map((e) => {
                            const Icon = e.icon;
                            return (
                                <motion.div
                                    key={e.id}
                                    whileHover={{ x: 5 }}
                                    className="relative flex gap-6 pl-10 group"
                                >
                                    <div className={`absolute left-0 top-1 h-10 w-10 rounded-full border-4 border-[#F8FAFC] flex items-center justify-center transition-colors shadow-sm z-10 ${e.type === 'sim' ? 'bg-blue-600 text-white' : e.type === 'lecture' ? 'bg-slate-900 text-white' : 'bg-red-500 text-white'
                                        }`}>
                                        <Icon className="h-4 w-4" />
                                    </div>

                                    <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md group-hover:border-blue-200">
                                        <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{e.time}</div>
                                        <h4 className="font-bold text-slate-900 mb-3">{e.title}</h4>
                                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-medium">
                                            <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {e.location}</div>
                                            <div className="flex items-center gap-1.5"><Users className="h-3 w-3" /> {e.instructor}</div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                        <Video className="h-4 w-4" /> JOIN VIRTUAL CLASS
                    </button>
                </div>
            </div>
        </div>
    );
}
