"use client";

import { useState } from 'react';
import {
    Book,
    Video,
    FileText,
    Download,
    Search,
    Filter,
    MoreVertical,
    Folder,
    ChevronRight,
    PlayCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Resources() {
    const [activeCategory, setActiveCategory] = useState('all');

    const resources = [
        { id: 1, title: 'Flight Training Manual v4.0', type: 'doc', category: 'manuals', size: '12.4 MB', date: '2024-01-10' },
        { id: 2, title: 'Meteorology Fundamentals - Video Lecture', type: 'video', category: 'lectures', size: '450 MB', date: '2024-02-15' },
        { id: 3, title: 'Landing Procedures - Checklist', type: 'doc', category: 'checklists', size: '1.2 MB', date: '2024-03-01' },
        { id: 4, title: 'Engine Troubleshooting (Interactive)', type: 'video', category: 'sim-guides', size: '890 MB', date: '2023-12-20' },
    ];

    const categories = [
        { id: 'all', label: 'All Resources', icon: Folder },
        { id: 'manuals', label: 'Manuals & PDF', icon: Book },
        { id: 'lectures', label: 'Video Lectures', icon: Video },
        { id: 'checklists', label: 'Quick Checklists', icon: FileText },
    ];

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Book className="h-6 w-6 text-blue-600" /> Resource Library
                </h2>
                <p className="text-sm text-slate-500">Access your training materials, manuals, and technical documentations.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Categories Sidebar */}
                <div className="lg:w-72 space-y-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search library..."
                            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none shadow-sm"
                        />
                        <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-1">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-4 mt-2">Classified Folders</h3>
                        {categories.map((cat) => {
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${activeCategory === cat.id
                                            ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20'
                                            : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className={`h-4 w-4 ${activeCategory === cat.id ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                                        <span className="text-sm">{cat.label}</span>
                                    </div>
                                    <ChevronRight className={`h-3 w-3 opacity-50 ${activeCategory === cat.id ? 'block' : 'hidden md:block'}`} />
                                </button>
                            );
                        })}
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 text-center space-y-3">
                        <div className="h-12 w-12 bg-white rounded-2xl shadow-sm mx-auto flex items-center justify-center text-blue-600">
                            <Download className="h-6 w-6" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">Download All Assets?</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Get the complete module package (1.2GB) for offline viewing.</p>
                        <button className="w-full py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-black shadow-sm hover:bg-blue-600 hover:text-white transition-all">START DOWNLOAD</button>
                    </div>
                </div>

                {/* Resource Grid */}
                <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{activeCategory.replace('-', ' ')} Feed</h3>
                        <button className="text-[10px] font-bold text-slate-500 flex items-center gap-1 hover:text-blue-600 transition-colors">
                            <Filter className="h-3 w-3" /> Latest Additions
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {resources.filter(r => activeCategory === 'all' || r.category === activeCategory).map((res) => (
                            <motion.div
                                key={res.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group transition-all hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 shadow-sm"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center border-2 border-slate-50 transition-all group-hover:bg-blue-50 group-hover:border-blue-100 ${res.type === 'video' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                        {res.type === 'video' ? <PlayCircle className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors italic">{res.title}</h4>
                                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <span>{res.size}</span>
                                            <span className="h-1 w-1 bg-slate-300 rounded-full" />
                                            <span>Added {res.date}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <button className="flex-1 sm:flex-none px-6 py-3 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2">
                                        <Download className="h-4 w-4" /> VIEW ASSET
                                    </button>
                                    <button className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl">
                                        <MoreVertical className="h-5 w-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
