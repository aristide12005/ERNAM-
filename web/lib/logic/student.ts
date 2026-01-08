import { supabase } from '@/lib/supabaseClient';

/**
 * ✈️ ERNAM Digital Twin - Student Logic Module
 * ---------------------------------------------
 * This file contains the TypeScript definitions and logic functions
 * specific to the "Student" (Stagiaire) persona.
 */

// ==========================================
// 1. TYPE DEFINITIONS (The "Shape" of Data)
// ==========================================

export type EnrollmentStatus = 'nominated' | 'approved' | 'attended' | 'failed' | 'certified'; // Aligned with session_roster

export interface StudentProfile {
    id: string;
    fullName: string;
    email: string;
    studentId: string;
    avatarUrl?: string; // Not in users table, removed or ignored
    qualifications: string[];
}

export interface StudentCourse {
    courseId: string; // This is the SESSION ID
    title: string;
    instructorName: string;
    progress: number;
    status: EnrollmentStatus;
    nextSessionDate?: Date;
    thumbnail_url?: string;
    description_en?: string;
    level?: string;
    duration_hours?: number;
}

// ==========================================
// 2. API / SERVICE LAYER (Real Logic)
// ==========================================

/**
 * Fetches dashboard data for a student using Supabase.
 */
export const getStudentDashboard = async (userId: string): Promise<{
    profile: StudentProfile;
    activeCourses: StudentCourse[];
}> => {
    // 1. Fetch Profile (from users table)
    const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (profileError) throw profileError;

    // 2. Fetch Enrollments (from session_roster)
    // We get both pending ('nominated') and active ('approved', 'attended') here
    const { data: rosterData, error: rosterError } = await supabase
        .from('session_roster')
        .select(`
            status,
            session:sessions (
                id,
                start_date,
                end_date,
                training_standard:training_standards (
                    title,
                    description,
                    details
                )
            )
        `)
        .eq('user_id', userId);

    if (rosterError) {
        console.error('Enrollment fetch error:', rosterError);
        return {
            profile: {
                id: userId,
                fullName: profileData.full_name,
                email: profileData.email || '',
                studentId: `ERN-2025-${userId.substring(0, 3).toUpperCase()}`,
                qualifications: [],
                avatarUrl: undefined
            },
            activeCourses: []
        };
    }

    // 3. Helper to get instructor name (Naive approach: fetch one instructor per session)
    // In a real app, we might want to batch this or use a view
    const sessionIds = rosterData?.map((r: any) => r.session?.id).filter(Boolean) || [];
    const instructorMap = new Map();

    if (sessionIds.length > 0) {
        const { data: staffData } = await supabase
            .from('session_instructors')
            .select(`
                session_id,
                instructor:users (full_name)
            `)
            .in('session_id', sessionIds);

        if (staffData) {
            staffData.forEach((s: any) => {
                if (!instructorMap.has(s.session_id)) {
                    instructorMap.set(s.session_id, s.instructor?.full_name || 'TBA');
                }
            });
        }
    }

    // 4. Map Data to StudentCourse Interface
    const activeCourses: StudentCourse[] = rosterData?.map((r: any) => {
        const session = r.session;
        const standard = session?.training_standard;
        const details = standard?.details || {};

        return {
            courseId: session?.id || '',
            title: standard?.title || 'Untitled Session',
            instructorName: instructorMap.get(session?.id) || 'TBA',
            progress: r.status === 'certified' ? 100 : (r.status === 'attended' ? 80 : 0),
            status: r.status as EnrollmentStatus,
            nextSessionDate: session?.start_date ? new Date(session.start_date) : undefined,
            thumbnail_url: details.thumbnail_url || null,
            description_en: standard?.description,
            level: details.level || 'Aviation Specialist',
            duration_hours: details.duration_hours || 0
        };
    }) || [];

    return {
        profile: {
            id: userId,
            fullName: profileData.full_name,
            email: profileData.email || '',
            studentId: `ERN-2025-${userId.substring(0, 3).toUpperCase()}`,
            qualifications: [],
            avatarUrl: undefined // users table doesn't have avatar_url
        },
        activeCourses
    };
};

/**
 * Logic for a student attempting to join a class.
 */
export const requestEnrollment = async (userId: string, sessionId: string) => {
    // Check if already requested (in session_roster)
    const { data: existing } = await supabase
        .from('session_roster')
        .select('id, status')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .single();

    if (existing) {
        return { success: false, message: `⚠️ You are already in this session (Status: ${existing.status}).` };
    }

    // Insert into session_roster with status 'nominated'
    const { error } = await supabase.from('session_roster').insert({
        user_id: userId,
        session_id: sessionId,
        status: 'nominated'
    });

    if (error) return { success: false, message: error.message };
    return { success: true, message: "✅ Request Sent! Awaiting Instructor/Admin Approval." };
};
