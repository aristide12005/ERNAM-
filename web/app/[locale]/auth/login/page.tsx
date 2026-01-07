"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            router.refresh();
            setTimeout(() => {
                router.push('/dashboard');
            }, 500);

        } catch (err: any) {
            setError(err.message || 'Authentication failed');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-[#0b1220] dark:to-[#020617] px-6">

            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.08)] bg-white dark:bg-[#09090b]">

                {/* LEFT — Login Card */}
                <div className="flex flex-col justify-between px-10 py-12 lg:px-14 bg-white dark:bg-[#09090b]">

                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-3 mb-10">
                            <div className="relative w-10 h-10">
                                <Image
                                    src="/logos/logo.png"
                                    alt="ERNAM"
                                    fill
                                    className="object-contain dark:invert"
                                />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">ERNAM Portal</span>
                        </div>

                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
                            Secure Sign In
                        </h1>
                        <p className="text-sm text-gray-500 mt-2">
                            Authorized access to the ERNAM Aviation Training Authority
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="flex flex-col gap-5 mt-10">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md px-4 py-3 pl-11 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                    placeholder="name@company.com"
                                    required
                                />
                                <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md px-4 py-3 pl-11 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                            </label>
                            <Link href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-md text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-11 rounded-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2 active:scale-[0.99]"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in to Dashboard"}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-10">
                        <ShieldCheck className="h-4 w-4 text-blue-600" />
                        <span>ERNAM Certified Secure Access</span>
                    </div>
                </div>

                {/* RIGHT — Guidance Panel */}
                <div className="hidden lg:flex flex-col justify-center px-14 py-12 bg-blue-600 text-white relative overflow-hidden">
                    {/* Subtle Texture */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative z-10">
                        <h2 className="text-3xl font-semibold leading-tight mb-6">
                            Aviation Training,<br />Governed Digitally
                        </h2>

                        <p className="text-blue-100 leading-relaxed text-lg">
                            This platform is used by authorized aviation professionals, instructors,
                            and partner organizations under ERNAM supervision.
                        </p>

                        <ul className="mt-8 space-y-4 text-sm text-blue-50 font-medium">
                            <li className="flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                                ICAO & IATA-aligned training standards
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                                Instructor-led certification sessions
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                                Secure participant & organization management
                            </li>
                        </ul>

                        <div className="mt-12 pt-8 border-t border-white/20">
                            <p className="text-sm text-blue-100 mb-2">
                                Don’t have an ERNAM digital account?
                            </p>
                            <Link
                                href="/apply"
                                className="inline-flex items-center gap-2 font-medium text-white hover:text-blue-200 transition-colors group"
                            >
                                <span className="underline underline-offset-4">Apply for authorization</span>
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}