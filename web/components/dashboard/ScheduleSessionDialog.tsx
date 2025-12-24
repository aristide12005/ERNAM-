"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Loader2 } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    trainerId: string;
    onSuccess: () => void;
}

export default function ScheduleSessionDialog({ isOpen, onClose, trainerId, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        courseId: '',
        title: '',
        date: '',
        time: '',
        duration: '1',
        location: 'Standard Classroom'
    });

    // Fetch courses on mount (or when opening)
    useEffect(() => {
        if (isOpen) {
            const fetchCourses = async () => {
                const { data } = await supabase.from('courses').select('id, title');
                if (data) setCourses(data);
            };
            fetchCourses();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Calculate Start/End
        const startDateTime = new Date(`${formData.date}T${formData.time}`);
        const endDateTime = new Date(startDateTime.getTime() + Number(formData.duration) * 60 * 60 * 1000);

        const { error } = await supabase.from('sessions').insert({
            trainer_id: trainerId,
            course_id: formData.courseId || null, // Optional if general session
            title: formData.title,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            location: formData.location
        });

        setLoading(false);

        if (error) {
            alert("Error scheduling session: " + error.message);
        } else {
            onSuccess();
            onClose();
            // Reset form
            setFormData({ courseId: '', title: '', date: '', time: '', duration: '1', location: 'Standard Classroom' });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 m-auto z-50 w-full max-w-md h-fit bg-[#1a1d24] border border-white/10 rounded-xl shadow-2xl p-6"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-indigo-400" />
                                Schedule Class
                            </h2>
                            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Course Select */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Course (Optional)</label>
                                <select
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500/50 outline-none"
                                    value={formData.courseId}
                                    onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                                >
                                    <option value="">Select a Course...</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Session Title</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500/50 outline-none"
                                    placeholder="e.g. Navigation Basics"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                                    <input
                                        required
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500/50 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Start Time</label>
                                    <input
                                        required
                                        type="time"
                                        value={formData.time}
                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500/50 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Duration (Hours)</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                        <input
                                            required
                                            type="number"
                                            min="0.5"
                                            step="0.5"
                                            value={formData.duration}
                                            onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 pl-9 text-sm text-white focus:border-indigo-500/50 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                        <input
                                            required
                                            type="text"
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 pl-9 text-sm text-white focus:border-indigo-500/50 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all mt-4"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Schedule'}
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
