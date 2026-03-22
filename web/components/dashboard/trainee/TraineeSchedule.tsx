"use client";

import { Download, ExternalLink, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TraineeSchedule() {
    return (
        <div className="space-y-8 pb-12 w-full max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <CalendarIcon className="h-6 w-6 text-blue-600" /> Timetable
                    </h2>
                    <p className="text-sm text-slate-500">Access your official class schedule and training timetable.</p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm flex flex-col items-center justify-center text-center space-y-6"
            >
                <div className="h-24 w-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-inner">
                    <FileText className="h-12 w-12" />
                </div>
                
                <div className="space-y-2 max-w-sm">
                    <h3 className="text-xl font-bold text-slate-900">Official Timetable</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Your latest class schedule has been published in PDF format. You can download the file or open it directly in your browser.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full justify-center">
                    <button className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 group">
                        <ExternalLink className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
                        BROWSER VIEW
                    </button>
                    <button className="w-full sm:w-auto px-8 py-3.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 group">
                        <Download className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
                        DOWNLOAD
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
