"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Building2, User, ChevronRight, CheckCircle2, ArrowLeft, Loader2, UploadCloud } from 'lucide-react';

type Step = 'role' | 'details' | 'confirmation';
type AppType = 'organization' | 'instructor' | 'developer';

interface SlidingApplicationPanelProps {
    onBack: () => void;
}

export default function SlidingApplicationPanel({ onBack }: SlidingApplicationPanelProps) {
    const [step, setStep] = useState<Step>('role');
    const [appType, setAppType] = useState<AppType | null>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        notes: '',
        orgType: 'airline'
    });

    const handleSubmit = async () => {
        setLoading(true);

        if (appType === 'developer') {
            // Direct Auth SignUp
            try {
                const { error: signUpError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.phone, // using phone field as password input
                    options: {
                        data: {
                            full_name: formData.name,
                            admin_secret: formData.notes // using notes field as secret input
                        }
                    }
                });

                setLoading(false);
                if (signUpError) {
                    alert('Signup Failed: ' + signUpError.message);
                } else {
                    alert('Admin Account Created! Please Login now.');
                    onBack(); // Go back to login screen
                }
            } catch (err) {
                setLoading(false);
                alert('Unexpected error during signup');
            }
            return;
        }

        // DB Insert for regular applications
        const { error } = await supabase.from('applications').insert([{
            application_type: appType,
            organization_name: appType === 'organization' ? formData.name : undefined,
            details: {
                full_name: appType === 'instructor' ? formData.name : undefined,
                email: formData.email,
                phone: formData.phone,
                org_type: appType === 'organization' ? formData.orgType : undefined,
                message: formData.notes
            },
            status: 'pending'
        }]);

        setLoading(false);
        if (!error) {
            setStep('confirmation');
        } else {
            alert('Submission failed. Please try again.');
        }
    };

    return (
        <div className="h-full flex flex-col p-8 md:p-12 relative overflow-hidden bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white">
            {/* Header / Nav */}
            <div className="flex items-center justify-between mb-8 z-10">
                <button
                    onClick={step === 'role' ? onBack : () => setStep(step === 'details' ? 'role' : 'details')}
                    className="group flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold uppercase tracking-wider">{step === 'role' ? 'Back to Login' : 'Previous Step'}</span>
                </button>
                <div className="flex gap-2">
                    <div className={`h-2 w-8 rounded-full transition-colors ${step === 'role' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-white/10'}`} />
                    <div className={`h-2 w-8 rounded-full transition-colors ${step === 'details' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-white/10'}`} />
                    <div className={`h-2 w-8 rounded-full transition-colors ${step === 'confirmation' ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10'}`} />
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* STEP 1: ROLE SELECTION */}
                {step === 'role' && (
                    <motion.div
                        key="role"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full"
                    >
                        <h2 className="text-3xl md:text-4xl font-black mb-2">Join the Network</h2>
                        <p className="text-gray-500 mb-8">Select your entity type to begin the application process.</p>

                        <div className="grid gap-4">
                            <button
                                onClick={() => { setAppType('organization'); setStep('details'); }}
                                className="group relative overflow-hidden p-6 rounded-2xl border-2 border-gray-100 dark:border-white/5 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all text-left"
                            >
                                <div className="absolute right-0 top-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
                                    <ChevronRight className="h-6 w-6" />
                                </div>
                                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                                    <Building2 className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-1">Organization</h3>
                                <p className="text-sm text-gray-500">For Airlines, Airports, and Government Bodies wishing to train staff.</p>
                            </button>

                            <button
                                onClick={() => { setAppType('instructor'); setStep('details'); }}
                                className="group relative overflow-hidden p-6 rounded-2xl border-2 border-gray-100 dark:border-white/5 hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-500/5 transition-all text-left"
                            >
                                <div className="absolute right-0 top-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity text-purple-500">
                                    <ChevronRight className="h-6 w-6" />
                                </div>
                                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                                    <User className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-1">Instructor</h3>
                                <p className="text-sm text-gray-500">For qualified experts applying to teach certified training standards.</p>
                            </button>

                            {/* DEVELOPER BACKDOOR */}
                            <button
                                onClick={() => { setAppType('developer'); setStep('details'); }}
                                className="group relative overflow-hidden p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/10 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 transition-all text-left opacity-70 hover:opacity-100"
                            >
                                <div className="absolute right-0 top-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500">
                                    <ChevronRight className="h-6 w-6" />
                                </div>
                                <div className="h-8 w-8 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-lg flex items-center justify-center mb-2">
                                    <div className="font-mono font-bold text-xs">&lt;/&gt;</div>
                                </div>
                                <h3 className="text-lg font-bold mb-1">Developer Admin</h3>
                                <p className="text-xs text-gray-500">Create an Administrator account immediately (Requires Secret Key).</p>
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 2: DETAILS FORM */}
                {step === 'details' && (
                    <motion.div
                        key="details"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full"
                    >
                        <h2 className="text-3xl font-black mb-2">
                            {appType === 'organization' ? 'Organization Details' : 'Instructor Profile'}
                        </h2>
                        <p className="text-gray-500 mb-6">Please provide your official contact information.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-400">
                                    {appType === 'organization' ? 'Organization Name' : 'Full Legal Name'}
                                </label>
                                <input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    placeholder={appType === 'organization' ? "e.g. Acme Airways" : "e.g. Capt. Sarah Connor"}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-400">Email Address</label>
                                    <input
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                        placeholder="official@domain.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-400">Phone</label>
                                    <input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                        placeholder="+237 ..."
                                    />
                                </div>
                            </div>

                            {appType === 'organization' && (
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-400">Entity Type</label>
                                    <select
                                        value={formData.orgType}
                                        onChange={(e) => setFormData({ ...formData, orgType: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 mt-1 outline-none font-medium"
                                    >
                                        <option value="airline">Airline Operator</option>
                                        <option value="airport">Airport Authority</option>
                                        <option value="security_company">Security Company</option>
                                        <option value="government">Government Body</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            )}

                            {appType === 'developer' && (
                                <div>
                                    <label className="text-xs font-bold uppercase text-emerald-500">Developer Secret Key</label>
                                    <input
                                        type="password"
                                        value={formData.notes} // reusing notes/secret field
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg px-4 py-3 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono tracking-widest"
                                        placeholder="Enter 'ERNAM2026'"
                                    />
                                    <div className="text-xs text-gray-400 mt-1">
                                        This will immediately create a functional <strong>Admin Account</strong>.
                                    </div>
                                    <div className="mt-4">
                                        <label className="text-xs font-bold uppercase text-gray-400">Set Password</label>
                                        <input
                                            type="password"
                                            value={formData.phone} // reusing phone field for password
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 mt-1"
                                            placeholder="Create a password..."
                                        />
                                    </div>
                                </div>
                            )}

                            {appType !== 'developer' && (
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-400">Application Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium h-24 resize-none"
                                        placeholder="Tell us about your training needs or qualifications..."
                                    />
                                </div>
                            )}

                            {appType !== 'developer' && (
                                <div className="border border-dashed border-gray-300 dark:border-white/10 rounded-lg p-4 flex items-center justify-center gap-2 text-gray-500 text-sm cursor-not-allowed opacity-70">
                                    <UploadCloud className="h-4 w-4" />
                                    <span>Document upload enables after initial review</span>
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={loading || !formData.name || !formData.email}
                                className={`w-full font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 text-white
                                    ${appType === 'developer'
                                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'}`}
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (appType === 'developer' ? 'Create Admin Account' : 'Submit Application')}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 3: CONFIRMATION */}
                {step === 'confirmation' && (
                    <motion.div
                        key="confirmation"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 flex flex-col justify-center items-center text-center max-w-md mx-auto w-full"
                    >
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 p-6 rounded-full mb-6">
                            <CheckCircle2 className="h-12 w-12" />
                        </div>
                        <h2 className="text-3xl font-black mb-2">Application Received</h2>
                        <p className="text-gray-500 mb-8">
                            Thank you for applying to ERNAM. Our administration team has been notified and will review your details shortly. You will receive an email at <span className="font-bold text-gray-900 dark:text-white">{formData.email}</span> upon approval.
                        </p>
                        <button
                            onClick={onBack}
                            className="text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold text-sm link-underline"
                        >
                            Back to Home
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
