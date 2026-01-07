"use client";

import { useTranslations } from 'next-intl';
import { Settings, Bell, Lock, Globe } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function OrgSettingsView() {
    // const t = useTranslations('OrgAdmin.settings'); // If we had specific settings keys

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Settings className="h-6 w-6 text-slate-600" />
                    Settings
                </h2>
                <p className="text-slate-500 text-sm mt-1">Manage your dashboard preferences.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-8">

                {/* Language */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Globe className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Language</h3>
                            <p className="text-xs text-slate-500">Select your preferred interface language.</p>
                        </div>
                    </div>
                    <LanguageSwitcher />
                </div>

                {/* Notifications (Mock) */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Bell className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Email Notifications</h3>
                            <p className="text-xs text-slate-500">Receive weekly summaries and critical alerts.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Security (Mock) */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                            <Lock className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Security</h3>
                            <p className="text-xs text-slate-500">Two-factor authentication is currently disabled.</p>
                        </div>
                    </div>
                    <button className="text-sm font-bold text-blue-600 hover:text-blue-700">Manage</button>
                </div>

            </div>
        </div>
    );
}
