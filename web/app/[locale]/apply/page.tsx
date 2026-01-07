"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
    User,
    Mail,
    Phone,
    Building2,
    ShieldCheck,
    ArrowRight,
    Loader2,
    CheckCircle2,
    MapPin
} from "lucide-react";
import { motion } from "framer-motion";

export default function ApplyPage() {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const router = useRouter();

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        phone: "",
        organization: "",
        country: "", // Added missing field
        message: "",  // Added missing field
        password: "", // Added password
        confirmPassword: "" // Added confirm password
    });

    // 1. Fetch User on Mount (To link application to account)
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUser(user);
                // Pre-fill email if available
                setForm(prev => ({ ...prev, email: user.email || "" }));
            }
        };
        checkUser();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            // 1. Sign Up New User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    data: {
                        full_name: form.full_name,
                        role: 'org_admin', // Requesting role
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("User creation failed");

            // 2. Create Organization (Pending)
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .insert([{
                    name: form.organization,
                    type: 'other', // Fixed: 'pending_classification' violates DB constraint. Using 'other' as safe default.
                    country: form.country,
                    status: 'pending', // Pending Admin Approval
                    contact_email: form.email,
                    contact_phone: form.phone
                }])
                .select()
                .single();

            if (orgError) {
                // Determine if error is RLS or constraint
                console.error("Org Creation Error:", orgError);
                throw new Error("Failed to register organization. " + orgError.message);
            };

            // 3. Create Application (Linked to User & Org)
            const payload = {
                application_type: 'organization',
                status: 'pending',
                applicant_user_id: authData.user.id,
                organization_name: form.organization,
                applicant_name: form.full_name,
                applicant_email: form.email,
                applicant_phone: form.phone,
                organization_country: form.country,
                details: { // Store Org ID in details or we need a column? 
                    // Ideally applications table should have organization_id column if we link them. 
                    // For now putting in details to trace it.
                    organization_id: orgData.id,
                    message: form.message
                }
            };

            const { error: appError } = await supabase.from('applications').insert([payload]);
            if (appError) throw appError;

            // 4. Link User to Organization
            // Note: This often fails if RLS doesn't allow user to update themselves immediately, 
            // but usually 'own profile' update is allowed.
            const { error: linkError } = await supabase
                .from('users')
                .update({
                    organization_id: orgData.id,
                    role: 'org_admin' // Ensure role is set in public table too
                })
                .eq('id', authData.user.id);

            if (linkError) console.warn("User Link Warning (Admin will fix):", linkError);

            setSubmitted(true);

        } catch (err: any) {
            console.error('Registration Error:', err);
            setError(err.message || "Failed to submit application.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-[#0b1220] dark:to-[#020617] px-6 py-10">
            {/* MAIN CONTAINER */}
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.08)] bg-white dark:bg-[#09090b]">

                {/* LEFT — GUIDANCE */}
                <div className="hidden lg:flex flex-col justify-center px-14 py-12 bg-blue-600 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative z-10">
                        <h2 className="text-3xl font-semibold leading-tight">
                            Authorization Required
                        </h2>

                        <p className="mt-6 text-blue-100 leading-relaxed">
                            ERNAM Digital is restricted to approved aviation organizations,
                            instructors, and professionals operating under regulatory frameworks.
                        </p>

                        <ul className="mt-8 space-y-4 text-sm text-blue-50 font-medium">
                            <li className="flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                                No public self-registration
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                                Applications reviewed by ERNAM Authority
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                                Access granted based on role & compliance
                            </li>
                        </ul>

                        <div className="mt-12 pt-8 border-t border-white/20">
                            <p className="text-sm text-blue-100 mb-2">Already authorized?</p>
                            <Link
                                href="/auth/login"
                                className="inline-flex items-center gap-2 font-medium text-white hover:text-blue-200 transition-colors group"
                            >
                                <span className="underline underline-offset-4">Sign in to your account</span>
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* RIGHT — APPLICATION FORM */}
                <div className="flex flex-col justify-between px-10 py-12 lg:px-14 bg-white dark:bg-[#09090b]">
                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="relative w-9 h-9">
                                <Image
                                    src="/logos/logo.png"
                                    alt="ERNAM"
                                    fill
                                    className="object-contain dark:invert"
                                />
                            </div>
                            <span className="font-semibold text-lg tracking-tight text-gray-900 dark:text-white">
                                ERNAM Portal
                            </span>
                        </div>

                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
                            Apply for Authorization
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
                            Submit an application to request access to the ERNAM Aviation
                            Training Authority system.
                        </p>
                    </div>

                    {/* Form or Success State */}
                    {submitted ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex flex-col justify-center items-center text-center py-10"
                        >
                            <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 p-4 rounded-full mb-4">
                                <CheckCircle2 className="h-12 w-12" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Application Received</h3>
                            <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">
                                Our administration team has been notified. We will contact you at <span className="font-bold text-gray-900 dark:text-white">{form.email}</span> regarding your status.
                            </p>
                            <Link href="/auth/login" className="text-blue-600 font-bold hover:underline">
                                Return to Login
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">

                            {/* Full Name */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full legal name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={form.full_name}
                                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                        required
                                        placeholder="Capt. John Doe"
                                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-md px-4 py-2.5 pl-11 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                    />
                                    <User className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Official work email</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        required
                                        placeholder="name@organization.com"
                                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-md px-4 py-2.5 pl-11 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                    />
                                    <Mail className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone number</label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        required
                                        placeholder="+237 ..."
                                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-md px-4 py-2.5 pl-11 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                    />
                                    <Phone className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                                </div>
                            </div>

                            {/* Organization */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Organization / Institution</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={form.organization}
                                        onChange={(e) => setForm({ ...form, organization: e.target.value })}
                                        required
                                        placeholder="Airport Authority / Airline / Ministry"
                                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-md px-4 py-2.5 pl-11 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                    />
                                    <Building2 className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                                </div>
                            </div>

                            {/* Country (Added missing field) */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Country of Operation</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={form.country}
                                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                                        required
                                        placeholder="e.g. Cameroon"
                                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-md px-4 py-2.5 pl-11 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                    />
                                    <MapPin className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                                </div>
                            </div>

                            {/* Message (Added missing field) */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message (Optional)</label>
                                <textarea
                                    rows={3}
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    placeholder="Briefly describe your request..."
                                    className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-md px-4 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all resize-none"
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Create Password</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        required
                                        minLength={6}
                                        placeholder="••••••••"
                                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-md px-4 py-2.5 pl-11 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                    />
                                    <ShieldCheck className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={form.confirmPassword}
                                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                        required
                                        minLength={6}
                                        placeholder="••••••••"
                                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-md px-4 py-2.5 pl-11 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                    />
                                    <ShieldCheck className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-md text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99]"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit application"}
                            </button>

                            <p className="text-center text-xs text-gray-500 mt-2">
                                Applications are reviewed manually by ERNAM administrators.
                            </p>
                        </form>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-10 lg:mt-0">
                        <ShieldCheck className="h-4 w-4 text-blue-600" />
                        <span>Authority-Controlled Access</span>
                    </div>
                </div>
            </div>
        </div>
    );
}