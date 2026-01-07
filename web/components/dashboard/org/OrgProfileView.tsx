"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/providers/AuthProvider';
import { Building2, Save, Mail, Phone, Globe, Info } from 'lucide-react';

export default function OrgProfileView() {
    const t = useTranslations('OrgAdmin.profile');
    const { profile } = useAuth();
    const [org, setOrg] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Editable fields
    const [formData, setFormData] = useState({
        contact_email: '',
        phone: '',
        website: ''
    });

    useEffect(() => {
        if (profile?.organization_id) {
            fetchOrg();
        }
    }, [profile?.organization_id]);

    const fetchOrg = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profile?.organization_id)
            .single();

        if (data) {
            setOrg(data);
            setFormData({
                contact_email: data.contact_email || '',
                phone: data.phone || '',
                website: data.website || ''
            });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('organizations')
            .update(formData)
            .eq('id', profile?.organization_id);

        if (error) {
            alert('Error updating profile');
        } else {
            // Success notification could be added here
        }
        setSaving(false);
    };

    if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />;

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-indigo-600" />
                    {t('title')}
                </h2>
                <p className="text-slate-500 text-sm mt-1">{t('subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Read Only Identity */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Info className="h-4 w-4 text-slate-400" />
                            {t('identity')}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('fields.legal_name')}</label>
                                <div className="text-lg font-black text-slate-800">{org?.name}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('fields.type')}</label>
                                    <div className="font-medium text-slate-700 capitalize">{org?.type}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('fields.status')}</label>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        {org?.status}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Country</label>
                                <div className="font-medium text-slate-700">{org?.country}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editable Contact */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-400" />
                            {t('contact')}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('fields.email')}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="email"
                                        value={formData.contact_email}
                                        onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('fields.phone')}</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Website</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="url"
                                        value={formData.website}
                                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full mt-4 flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-slate-200 transition-all disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? 'Updating...' : t('save')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
