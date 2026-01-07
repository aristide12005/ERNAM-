"use client";

import { useTranslations } from 'next-intl';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
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

interface SystemSettings {
    platform_name: string;
    support_email: string;
    maintenance_mode: boolean;
    registration_open: boolean;
}

export default function AdminSettings() {
    const t = useTranslations('AdminSettings');
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState<SystemSettings>({
        platform_name: 'ERNAM DIGITAL TWIN',
        support_email: 'ops@ernam.edu.sn',
        maintenance_mode: false,
        registration_open: true
    });

    const tabs = [
        { id: 'general', label: t('tabs.general'), icon: Globe },
        { id: 'security', label: t('tabs.security'), icon: Lock },
        { id: 'notifications', label: t('tabs.notifications'), icon: Bell },
        { id: 'database', label: t('tabs.database'), icon: Database },
    ];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('system_settings').select('*');
        if (!error && data) {
            const newSettings: any = { ...settings };
            data.forEach((row: any) => {
                if (row.key === 'platform_name') newSettings.platform_name = row.value.value;
                if (row.key === 'support_email') newSettings.support_email = row.value.value; // Assuming we add this key
                if (row.key === 'maintenance_mode') newSettings.maintenance_mode = row.value.enabled;
                if (row.key === 'registration_open') newSettings.registration_open = row.value.enabled;
            });
            setSettings(newSettings);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setLoading(true);
        const updates = [
            { key: 'platform_name', value: { value: settings.platform_name } },
            { key: 'support_email', value: { value: settings.support_email } }, // Ensure key exists or insert
            { key: 'maintenance_mode', value: { enabled: settings.maintenance_mode } },
            { key: 'registration_open', value: { enabled: settings.registration_open } }
        ];

        for (const update of updates) {
            await supabase.from('system_settings').upsert({
                key: update.key,
                value: update.value,
                updated_at: new Date().toISOString()
            });
        }

        // Audit Log
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('audit_logs').insert({
                action: 'System Settings Updated',
                target_resource: 'Global Config',
                performed_by: user.id
            });
        }

        setLoading(false);
        setLoading(false);
        alert(t('actions.success_message'));
    };

    return (
        <div className="space-y-6 pb-12">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Settings className="h-6 w-6 text-slate-400" /> {t('title')}
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
                            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-4">{t('general.title')}</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('general.platform_name')}</label>
                                    <input
                                        type="text"
                                        value={settings.platform_name}
                                        onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('general.support_email')}</label>
                                    <input
                                        type="email"
                                        value={settings.support_email}
                                        onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4">
                                <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div>
                                        <div className="text-sm font-bold text-white uppercase italic">{t('general.maintenance_mode')}</div>
                                        <div className="text-[10px] text-gray-500">{t('general.maintenance_desc')}</div>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.maintenance_mode}
                                            onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div>
                                        <div className="text-sm font-bold text-white uppercase italic">{t('general.public_registration')}</div>
                                        <div className="text-[10px] text-gray-500">{t('general.registration_desc')}</div>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.registration_open}
                                            onChange={(e) => setSettings({ ...settings, registration_open: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'security' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-4">{t('security.title')}</h3>

                            <div className="space-y-4">
                                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                                    <h4 className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase mb-2">
                                        <Shield className="h-3 w-3" /> {t('security.critical_logic')}
                                    </h4>
                                    <p className="text-[10px] text-gray-500 leading-relaxed mb-4">
                                        {t('security.critical_desc')}
                                    </p>
                                    <button className="text-[10px] font-bold text-red-500 hover:underline border border-red-500/20 px-3 py-1 rounded">{t('security.force_logout')}</button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-[#0A0A0A] rounded-xl border border-white/5 space-y-3">
                                        <div className="flex items-center gap-2 text-white text-xs font-black uppercase">
                                            <Smartphone className="h-3 w-3 text-blue-500" /> {t('security.two_factor')}
                                        </div>
                                        <button className="w-full py-2 bg-blue-600/10 text-blue-500 text-[10px] font-bold rounded-lg border border-blue-600/20">{t('security.configure_otp')}</button>
                                    </div>
                                    <div className="p-4 bg-[#0A0A0A] rounded-xl border border-white/5 space-y-3">
                                        <div className="flex items-center gap-2 text-white text-xs font-black uppercase">
                                            <Mail className="h-3 w-3 text-emerald-500" /> {t('security.domain_whitelist')}
                                        </div>
                                        <button className="w-full py-2 bg-emerald-600/10 text-emerald-500 text-[10px] font-bold rounded-lg border border-emerald-600/20">{t('security.manage_domains')}</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div className="flex justify-end gap-3 pt-8 border-t border-white/5">
                        <button
                            onClick={fetchSettings}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-sm font-bold transition-all"
                            disabled={loading}
                        >
                            <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {t('actions.reset')}
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                            disabled={loading}
                        >
                            <Save className="h-4 w-4" /> {loading ? t('actions.saving') : t('actions.save_changes')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
