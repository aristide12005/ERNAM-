"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Plane, Lock, Mail, ArrowRight, User, AlertCircle, CheckCircle2, GraduationCap, Medal, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type AuthMode = 'login' | 'signup';
type Role = 'trainer' | 'trainee';

export default function AuthPage() {
    const [mode, setMode] = useState<AuthMode>('login');
    const [role, setRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: ''
    });
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                });
                if (error) throw error;
                // AuthProvider handles redirect
            } else {
                // SIGNUP LOGIC
                if (!role) throw new Error("Please select a role (Student or Instructor).");

                // 1. Sign Up causing Trigger to create Profile
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.fullName,
                            role: role,
                            status: 'pending'
                        }
                    }
                });

                if (authError) throw authError;
                if (!authData.user) throw new Error("Account creation failed.");

                if (authError) throw authError;
                if (!authData.user) throw new Error("Account creation failed.");

                // HYBRID APPROACH:
                // 1. Wait briefly for Trigger to fire
                // 2. If profile doesn't exist, Create it manually (Backup)

                const userId = authData.user.id;

                // Small delay to allow trigger to win race
                await new Promise(r => setTimeout(r, 1000));

                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', userId)
                    .single();

                if (!existingProfile) {
                    console.log("Trigger didn't fire? Attempting manual insert...");
                    const { error: manualInsertError } = await supabase
                        .from('profiles')
                        .insert({
                            id: userId,
                            full_name: formData.fullName,
                            role: role,
                            status: 'pending'
                        });

                    if (manualInsertError) {
                        // Ignore duplicate key error in case of race condition
                        if (!manualInsertError.message.includes('duplicate key')) {
                            console.error("Manual fallback failed:", manualInsertError);
                            // Don't throw, let's see if we can proceed
                        }
                    }
                }

                router.push('/auth/pending');
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden p-4">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
                <div
                    className="absolute inset-0 opacity-20 transition-all duration-1000 ease-in-out"
                    style={{
                        backgroundImage: mode === 'login'
                            ? "url('https://images.unsplash.com/photo-1517616186800-ea118c353f2c?q=80&w=2670&auto=format&fit=crop')"
                            : "url('https://images.unsplash.com/photo-1478860409698-8707f313ee8b?q=80&w=2670&auto=format&fit=crop')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            </div>

            <motion.div
                layout
                className="relative z-10 w-full max-w-md bg-card/80 border border-border backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden"
            >
                {/* Header Toggle */}
                <div className="flex border-b border-border">
                    <button
                        onClick={() => setMode('login')}
                        className={`flex-1 py-4 text-sm font-bold tracking-wide transition-colors relative ${mode === 'login' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        LOGIN
                        {mode === 'login' && <motion.div layoutId="tab-highlight" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                    </button>
                    <button
                        onClick={() => setMode('signup')}
                        className={`flex-1 py-4 text-sm font-bold tracking-wide transition-colors relative ${mode === 'signup' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        REGISTER
                        {mode === 'signup' && <motion.div layoutId="tab-highlight" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                    </button>
                </div>

                <div className="p-8">
                    {/* Brand Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center p-1 rounded-2xl bg-white/5 border border-white/10 mb-4 shadow-2xl">
                            <img
                                src="/logos/logo.jpg"
                                alt="ERNAM Logo"
                                className="h-20 w-auto rounded-xl"
                            />
                        </div>
                        <h1 className="text-2xl font-black text-foreground tracking-tighter uppercase leading-none">ERNAM</h1>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mt-2">Digital Twin</p>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 mx-1 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs flex items-center gap-2"
                            >
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {mode === 'signup' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4"
                                >
                                    {/* Role Selection */}
                                    <div className="grid grid-cols-2 gap-3 mb-2">
                                        <div
                                            onClick={() => setRole('trainee')}
                                            className={`cursor-pointer border rounded-xl p-3 text-center transition-all ${role === 'trainee' ? 'bg-primary/10 border-primary' : 'bg-secondary/50 border-transparent hover:bg-secondary'}`}
                                        >
                                            <GraduationCap className={`h-5 w-5 mx-auto mb-2 ${role === 'trainee' ? 'text-primary' : 'text-muted-foreground'}`} />
                                            <div className={`text-xs font-bold ${role === 'trainee' ? 'text-foreground' : 'text-muted-foreground'}`}>Student</div>
                                        </div>
                                        <div
                                            onClick={() => setRole('trainer')}
                                            className={`cursor-pointer border rounded-xl p-3 text-center transition-all ${role === 'trainer' ? 'bg-amber-500/10 border-amber-500' : 'bg-secondary/50 border-transparent hover:bg-secondary'}`}
                                        >
                                            <Medal className={`h-5 w-5 mx-auto mb-2 ${role === 'trainer' ? 'text-amber-500' : 'text-muted-foreground'}`} />
                                            <div className={`text-xs font-bold ${role === 'trainer' ? 'text-foreground' : 'text-muted-foreground'}`}>Instructor</div>
                                        </div>
                                    </div>

                                    {/* Full Name */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <input
                                                type="text"
                                                required={mode === 'signup'}
                                                value={formData.fullName}
                                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                                className="w-full bg-secondary/50 border border-input rounded-lg py-2 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                                placeholder="Capt. John Doe"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-secondary/50 border border-input rounded-lg py-2 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                        placeholder="name@ernam.cm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-secondary/50 border border-input rounded-lg py-2 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 mt-4 text-sm font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : ''} ${mode === 'login' ? 'bg-primary hover:bg-blue-500 text-primary-foreground' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                <>
                                    {mode === 'login' ? 'ACCESS DASHBOARD' : 'SUBMIT APPLICATION'}
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>

                    </form>
                </div>
            </motion.div>
        </div>
    );
}
