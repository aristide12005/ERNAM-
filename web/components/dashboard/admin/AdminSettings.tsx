"use client";

import { useState } from 'react';
import {
    Settings,
    Shield,
    Bell,
    Globe,
    Database,
    Lock,
    Save,
    RotateCcw,
    Mail,
    Smartphone
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminSettings() {
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'Platform Settings', icon: Globe },
        { id: 'security', label: 'Security & Access', icon: Lock },
        { id: 'notifications', label: 'Alert Config', icon: Bell },
        { id: 'database', label: 'Data Registry', icon: Database },
    ];

    return (
        <div className="space-y-6 pb-12">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Settings className="h-6 w-6 text-slate-400" /> Platform Governance
            </h2>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Tabs */}
                <div className="lg:w-64 space-y-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-[#141414] border border-white/5 rounded-2xl p-8 space-y-8">
                    {activeTab === 'general' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-4">General Platform Configuration</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Platform Name</label>
                                    <input
                                        type="text"
                                        defaultValue="ERNAM DIGITAL TWIN"
                                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Support Email</label>
                                    <input
                                        type="email"
                                        defaultValue="ops@ernam.edu.sn"
                                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4">
                                <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div>
                                        <div className="text-sm font-bold text-white uppercase italic">Maintenance Mode</div>
                                        <div className="text-[10px] text-gray-500">Enable to restrict access for scheduled upgrades.</div>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div>
                                        <div className="text-sm font-bold text-white uppercase italic">Public Registration</div>
                                        <div className="text-[10px] text-gray-500">Allow new users to sign up without invitations.</div>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" defaultChecked className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'security' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-4">Security Protocols</h3>

                            <div className="space-y-4">
                                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                                    <h4 className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase mb-2">
                                        <Shield className="h-3 w-3" /> Critical Security Logic
                                    </h4>
                                    <p className="text-[10px] text-gray-500 leading-relaxed mb-4">
                                        All administrative actions are logged in the audit trail. Session timeout is currently set to 30 minutes.
                                    </p>
                                    <button className="text-[10px] font-bold text-red-500 hover:underline border border-red-500/20 px-3 py-1 rounded">FORCE LOGOUT ALL SESSIONS</button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-[#0A0A0A] rounded-xl border border-white/5 space-y-3">
                                        <div className="flex items-center gap-2 text-white text-xs font-black uppercase">
                                            <Smartphone className="h-3 w-3 text-blue-500" /> Two-Factor (2FA)
                                        </div>
                                        <button className="w-full py-2 bg-blue-600/10 text-blue-500 text-[10px] font-bold rounded-lg border border-blue-600/20">CONFIGURE SMS/OTP</button>
                                    </div>
                                    <div className="p-4 bg-[#0A0A0A] rounded-xl border border-white/5 space-y-3">
                                        <div className="flex items-center gap-2 text-white text-xs font-black uppercase">
                                            <Mail className="h-3 w-3 text-emerald-500" /> Domain Whitelist
                                        </div>
                                        <button className="w-full py-2 bg-emerald-600/10 text-emerald-500 text-[10px] font-bold rounded-lg border border-emerald-600/20">MANAGE DOMAINS</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div className="flex justify-end gap-3 pt-8 border-t border-white/5">
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-sm font-bold transition-all">
                            <RotateCcw className="h-4 w-4" /> RESET
                        </button>
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20">
                            <Save className="h-4 w-4" /> SAVE CHANGES
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
