"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(data as UserProfile);
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
        }
    };

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id);
    };

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                // Add timeout to prevent hanging if Supabase is unreachable
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Auth timeout')), 8000)
                );

                const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;

                if (!mounted) return;

                setUser(session?.user ?? null);

                if (session?.user) {
                    // Don't block loading for profile - fetch but continue
                    fetchProfile(session.user.id).finally(() => {
                        if (mounted) setLoading(false);
                    });
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                if (mounted) setLoading(false);
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (!mounted) return;
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                }
            });

            return () => {
                subscription.unsubscribe();
            };
        };

        initAuth();

        return () => { mounted = false; };
    }, []);

    // Protection Logic
    useEffect(() => {
        if (loading) return;

        // Normalizing path to handle locales (e.g., /en/auth/login -> /auth/login)
        const pathRef = pathname?.replace(/^\/[a-z]{2}(\/|$)/, '/') || '/';

        console.log(`[AuthProvider] Path: ${pathname}, Normalized: ${pathRef}, User: ${!!user}`);

        const isAuthRoute = pathRef.startsWith('/auth');
        // Simple robust check for application portal, bypassing regex complexity
        const isPublicRoute = pathRef === '/' || pathname?.includes('/apply'); // Landing page or Application Portal

        if (!user && !isAuthRoute && !isPublicRoute) {
            router.push('/auth/login');
        } else if (user && profile) {
            // If logged in, check user status
            if (profile.status === 'pending') {
                if (pathname !== '/auth/pending') router.push('/auth/pending');
            } else if (profile.status === 'rejected') {
                // simple alert or page for rejected
                if (pathname !== '/auth/rejected') router.push('/auth/pending'); // Reuse pending or separate
            } else if (profile.status === 'approved') {
                // If on auth pages, send to dashboard
                if (isAuthRoute) router.push('/dashboard');
            }
        } else if (user && !profile) {
            // GHOST USER STATE: Auth exists, but Profile missing/unreadable.
            // Redirect to Dashboard, where the "Access Denied" view handles this gracefully.
            if (isAuthRoute) router.push('/dashboard');
        }
    }, [user, profile, loading, pathname, router]);

    const signOut = async () => {
        await supabase.auth.signOut();
        // Force full reload to clear all state/cache
        window.location.href = '/auth/login';
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
            {!loading && children}
            {loading && (
                <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden relative">
                    {/* Background animated elements */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
                        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-indigo-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-8">
                        {/* ERNAM Logo */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
                            <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-2xl shadow-blue-500/20">
                                <svg className="h-16 w-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                </svg>
                            </div>
                        </div>

                        {/* Brand Name */}
                        <div className="text-center">
                            <h1 className="text-4xl font-black tracking-tight text-white mb-2">
                                ERNAM
                            </h1>
                            <p className="text-sm font-medium text-blue-300/80 uppercase tracking-[0.3em]">
                                Digital Twin
                            </p>
                        </div>

                        {/* Loading indicator */}
                        <div className="flex flex-col items-center gap-4 mt-4">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-xs text-slate-400 font-medium tracking-wider uppercase">
                                Initializing secure connection...
                            </span>
                        </div>
                    </div>

                    {/* Bottom branding */}
                    <div className="absolute bottom-8 text-center">
                        <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">
                            Maritime Training Excellence
                        </p>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
}
