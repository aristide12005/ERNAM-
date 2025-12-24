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
                .from('profiles')
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
        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);

            if (session?.user) {
                await fetchProfile(session.user.id);
            }
            setLoading(false);

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                }
                setLoading(false);
            });

            return () => {
                subscription.unsubscribe();
            };
        };

        initAuth();
    }, []);

    // Protection Logic
    useEffect(() => {
        if (loading) return;

        const isAuthRoute = pathname?.startsWith('/auth');
        const isPublicRoute = pathname === '/'; // Maybe landing page?

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
                <div className="h-screen w-full flex items-center justify-center bg-background text-white">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-muted-foreground animate-pulse">Authenticating...</span>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
}
