"use client";

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import {
    User,
    Mail,
    Shield,
    Save,
    Camera,
    Lock,
    Bell,
    Globe,
    CreditCard,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function TraineeProfile() {
    const { profile, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState('profile');

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <User className="h-6 w-6 text-blue-600" /> Account Settings
                </h2>
                <p className="text-sm text-slate-500">Manage your personal information, security, and notification preferences.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:w-72 space-y-2">
                    {[
                        { id: 'profile', label: 'Personal Information', icon: User },
                        { id: 'security', label: 'Security & Password', icon: Lock },
                        { id: 'notifications', label: 'Email & Alerts', icon: Bell },
                        { id: 'billing', label: 'Billing & History', icon: CreditCard },
                    ].map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeSection === item.id
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </div>
                                <ChevronRight className={`h-3 w-3 opacity-50 ${activeSection === item.id ? 'block' : 'hidden'}`} />
                            </button>
                        );
                    })}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white border border-slate-200 rounded-[32px] p-8 lg:p-12 shadow-sm shadow-blue-500/5">
                    {activeSection === 'profile' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                            {/* Avatar Section */}
                            <div className="flex items-center gap-8 border-b border-slate-100 pb-10">
                                <div className="relative group">
                                    <div className="h-28 w-28 rounded-[40px] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-4xl text-white font-black shadow-xl ring-4 ring-white">
                                        {profile?.full_name?.[0]}
                                    </div>
                                    <button className="absolute -bottom-2 -right-2 p-3 bg-white rounded-2xl shadow-lg border border-slate-100 text-blue-600 hover:scale-110 transition-transform">
                                        <Camera className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900">{profile?.full_name}</h3>
                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5" /> {user?.email}
                                    </p>
                                    <div className="flex items-center gap-2 mt-4">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                                            {profile?.role} ID: {profile?.id?.substring(0, 8) || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Form Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        defaultValue={profile?.full_name || ''}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                    <input
                                        type="text"
                                        placeholder="+221 ..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location / City</label>
                                    <div className="relative">
                                        <Globe className="absolute left-5 top-4 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            defaultValue="Dakar, Senegal"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 flex flex-col justify-end">
                                    <div className="p-4 bg-slate-900 rounded-2xl text-white flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Shield className="h-5 w-5 text-emerald-400" />
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Status</div>
                                                <div className="text-sm font-black italic">VERIFIED OPERATOR</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6">
                                <button className="bg-blue-600 hover:bg-blue-700 text-white font-black px-12 py-4 rounded-2xl flex items-center gap-3 transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                    SAVE PROFILE DATA
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
