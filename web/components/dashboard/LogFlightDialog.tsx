"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plane, Clock, FileText, Loader2 } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    traineeId: string;
    onSuccess: () => void;
}

export default function LogFlightDialog({ isOpen, onClose, traineeId, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        duration: '',
        aircraft: 'Cessna 172',
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.from('flight_logs').insert({
            trainee_id: traineeId,
            date: formData.date,
            duration_hours: Number(formData.duration),
            aircraft_type: formData.aircraft,
            notes: formData.notes
        });

        setLoading(false);

        if (error) {
            alert("Error logging flight: " + error.message);
        } else {
            onSuccess();
            onClose();
            // Reset form (keep date current)
            setFormData({
                date: new Date().toISOString().split('T')[0],
                duration: '',
                aircraft: 'Cessna 172',
                notes: ''
            });
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
                                <Plane className="h-5 w-5 text-blue-400" />
                                Log Flight Time
                            </h2>
                            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                                    <input
                                        required
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-blue-500/50 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Duration (Hrs)</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                        <input
                                            required
                                            type="number"
                                            step="0.1"
                                            value={formData.duration}
                                            onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 pl-9 text-sm text-white focus:border-blue-500/50 outline-none"
                                            placeholder="1.5"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Aircraft</label>
                                <select
                                    value={formData.aircraft}
                                    onChange={e => setFormData({ ...formData, aircraft: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-blue-500/50 outline-none appearance-none"
                                >
                                    <option>Cessna 172</option>
                                    <option>Piper PA-28</option>
                                    <option>DA40 Diamond</option>
                                    <option>Simulator (Generic)</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Notes / Remarks</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                    <textarea
                                        rows={3}
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 pl-9 text-sm text-white focus:border-blue-500/50 outline-none resize-none"
                                        placeholder="Practice stalls, steep turns..."
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all mt-4"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Log Entry'}
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
