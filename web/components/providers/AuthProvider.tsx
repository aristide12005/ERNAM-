"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    impersonator: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    startImpersonation: (target: UserProfile) => void;
    stopImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    impersonator: null,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
    startImpersonation: () => { },
    stopImpersonation: () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [impersonator, setImpersonator] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Impersonation state is now handled internally within initAuth and fetchProfile
    // to prevent race conditions during authentication lifecycle.

    const startImpersonation = (target: UserProfile) => {
        if (!profile) return;
        sessionStorage.setItem('ernam_impersonator', JSON.stringify(profile));
        sessionStorage.setItem('ernam_impersonated_user', JSON.stringify(target));
        setImpersonator(profile);
        setProfile(target);
        window.location.href = '/dashboard';
    };

    const stopImpersonation = () => {
        if (!impersonator) return;
        sessionStorage.removeItem('ernam_impersonator');
        sessionStorage.removeItem('ernam_impersonated_user');
        setProfile(impersonator);
        setImpersonator(null);
        window.location.href = '/dashboard';
    };

    const fetchProfile = async (realUserId: string, retries = 1) => {
        try {
            // INTERCEPT: Check if we are impersonating before fetching the profile
            const savedImpersonatorStr = sessionStorage.getItem('ernam_impersonator');
            const savedTargetStr = sessionStorage.getItem('ernam_impersonated_user');

            let targetId = realUserId;

            if (savedImpersonatorStr && savedTargetStr) {
                const parsedTarget = JSON.parse(savedTargetStr);
                targetId = parsedTarget.id;
                setImpersonator(JSON.parse(savedImpersonatorStr));
            } else {
                setImpersonator(null);
            }

            // Fetch profile with admin role and permissions
            const { data, error } = await supabase
                .from('users')
                .select(`
                    *,
                    admin_role:admin_roles (
                        id,
                        name,
                        is_system,
                        role_permissions (
                            permission:permissions (
                                module,
                                action
                            )
                        )
                    )
                `)
                .eq('id', targetId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                if (retries > 0) {
                    await new Promise(r => setTimeout(r, 2000));
                    return fetchProfile(realUserId, retries - 1);
                }
            } else {
                // Flatten granular permissions into ['module:action', ...]
                const rawProfile = data as any;
                let granularPerms: string[] = [];

                if (rawProfile.admin_role?.role_permissions) {
                    granularPerms = rawProfile.admin_role.role_permissions
                        .map((rp: any) => rp.permission ? `${rp.permission.module}:${rp.permission.action}` : null)
                        .filter(Boolean);
                }

                const profileWithPerms: UserProfile = {
                    ...rawProfile,
                    granular_permissions: granularPerms
                };

                setProfile(profileWithPerms);
                return profileWithPerms;
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
            if (retries > 0) {
                await new Promise(r => setTimeout(r, 2000));
                return fetchProfile(realUserId, retries - 1);
            }
        }
    };

    const refreshProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) await fetchProfile(session.user.id);
    };

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Auth timeout')), 15000)
                );

                const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;

                if (!mounted) return;

                let currentUser = session?.user ?? null;

                if (currentUser) {
                    // Spoof the `user` object if impersonating, so components using `user.id` get the target's ID
                    const savedTargetStr = sessionStorage.getItem('ernam_impersonated_user');
                    if (savedTargetStr) {
                        const parsedTarget = JSON.parse(savedTargetStr);
                        currentUser = { ...currentUser, id: parsedTarget.id, email: parsedTarget.email };
                    }
                    
                    setUser(currentUser);
                    
                    // fetchProfile handles the impersonation routing internally
                    await fetchProfile(session!.user.id).finally(() => {
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
                
                let currentUser = session?.user ?? null;
                
                if (currentUser) {
                    const savedTargetStr = sessionStorage.getItem('ernam_impersonated_user');
                    if (savedTargetStr) {
                        const parsedTarget = JSON.parse(savedTargetStr);
                        currentUser = { ...currentUser, id: parsedTarget.id, email: parsedTarget.email };
                    }
                    setUser(currentUser);
                    await fetchProfile(session!.user.id);
                } else {
                    setProfile(null);
                    setImpersonator(null);
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
            // Role-based protection check for admin sub-paths
            const isAdminPath = pathRef.startsWith('/dashboard/admin');
            const isAdmin = profile.role === 'ernam_admin' || profile.role === 'org_admin' || profile.role === 'admin';
            
            if (isAdminPath && !isAdmin) {
                console.warn(`[AuthProvider] Unauthorized access attempt to ${pathRef} by role ${profile.role}`);
                router.push('/dashboard');
                return;
            }

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
        <AuthContext.Provider value={{
            user,
            profile,
            impersonator,
            loading,
            signOut,
            refreshProfile,
            startImpersonation,
            stopImpersonation
        }}>
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
                            <div className="relative bg-white p-4 rounded-2xl shadow-2xl shadow-blue-500/20">
                                <img src="/logos/ernam-logo.png" alt="ERNAM" className="h-20 w-20 object-contain" />
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
