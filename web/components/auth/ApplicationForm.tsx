"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Building2, User, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ApplicationForm() {
    const [type, setType] = useState<'organization' | 'instructor'>('organization');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        details: '',
        org_type: 'airline' // specific for orgs
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const payload = {
            application_type: type,
            organization_name: type === 'organization' ? formData.name : null,
            details: {
                full_name: formData.name,
                email: formData.email,
                phone: formData.phone,
                message: formData.details,
                org_type: type === 'organization' ? formData.org_type : undefined
            },
            status: 'pending'
        };

        const { error: err } = await supabase
            .from('applications')
            .insert([payload]);

        if (err) {
            setError(err.message);
        } else {
            setSubmitted(true);
        }
        setLoading(false);
    };

    if (submitted) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl text-center border border-emerald-100">
                <div className="bg-emerald-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                    <CheckCircle className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Received</h2>
                <p className="text-gray-600 mb-6">
                    Thank you! Your request to join ERNAM as a {type === 'organization' ? 'Partner Organization' : 'Certified Instructor'} has been submitted.
                    Our team will review your details and contact you via <b>{formData.email}</b> shortly.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-500">
                    Application ID: <span className="font-mono text-gray-700">PENDING-{Math.floor(Math.random() * 10000)}</span>
                </div>
                <button onClick={() => window.location.href = '/'} className="mt-8 text-blue-600 font-bold hover:underline">
                    Return to Home
                </button>
            </motion.div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">Join the ERNAM Network</h1>
                <p className="text-gray-600">Apply to become an accredited partner or certified instructor.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                        onClick={() => setType('organization')}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${type === 'organization'
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-blue-200 text-gray-500'
                            }`}
                    >
                        <Building2 className="h-6 w-6" />
                        <span className="font-bold text-sm">Organization</span>
                    </button>
                    <button
                        onClick={() => setType('instructor')}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${type === 'instructor'
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-blue-200 text-gray-500'
                            }`}
                    >
                        <User className="h-6 w-6" />
                        <span className="font-bold text-sm">Instructor</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Dynamic Fields */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                            {type === 'organization' ? 'Organization Name' : 'Full Name'}
                        </label>
                        <input
                            required
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder={type === 'organization' ? 'e.g. Acme Airlines' : 'e.g. Jane Doe'}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                            <input
                                required
                                type="email"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="name@company.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                            <input
                                required
                                type="tel"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="+1 (555) 000-0000"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    {type === 'organization' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Organization Type</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.org_type}
                                onChange={e => setFormData({ ...formData, org_type: e.target.value })}
                            >
                                <option value="airline">Airline</option>
                                <option value="airport">Airport</option>
                                <option value="security_company">Security Company</option>
                                <option value="government">Government Body</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Additional Details / Motivation</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[120px]"
                            placeholder="Tell us about your accreditation needs or teaching experience..."
                            value={formData.details}
                            onChange={e => setFormData({ ...formData, details: e.target.value })}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Submitting...' : (
                            <>
                                Determine Eligibility <Send className="h-4 w-4" />
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4">
                        By submitting this form, you agree to ERNAM's data processing policies.
                        Your application will be reviewed by an administrator.
                    </p>
                </form>
            </div>
        </div>
    );
}
