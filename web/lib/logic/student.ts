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

export type EnrollmentStatus = 'pending' | 'active' | 'completed' | 'failed';

export interface StudentProfile {
    id: string;
    fullName: string;
    email: string;
    studentId: string;
    avatarUrl?: string;
    qualifications: string[];
}

export interface StudentCourse {
    courseId: string;
    title: string;
    instructorName: string;
    progress: number;
    status: EnrollmentStatus;
    nextSessionDate?: Date;
    thumbnail_url?: string;
    description_en?: string;
    level?: string;
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
    // 1. Fetch Profile
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profileError) throw profileError;

    // 2. Fetch Enrollments with Course data
    const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
      status,
      courses (
        id,
        title_en,
        description_en,
        thumbnail_url,
        instructor_id
      )
    `)
        .eq('user_id', userId);

    if (enrollError) {
        console.error('Enrollment fetch error:', enrollError);
        // Return empty courses if error
        return {
            profile: {
                id: userId,
                fullName: profileData.full_name,
                email: profileData.email || '',
                studentId: `ERN-2025-${userId.substring(0, 3).toUpperCase()}`,
                qualifications: [],
                avatarUrl: profileData.avatar_url
            },
            activeCourses: []
        };
    }

    // 3. Fetch instructor names separately
    const instructorIds = enrollments?.map((e: any) => e.courses?.instructor_id).filter(Boolean) || [];
    const { data: instructors } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', instructorIds);

    const instructorMap = new Map(instructors?.map(i => [i.id, i.full_name]) || []);

    const activeCourses: StudentCourse[] = enrollments?.map((e: any) => ({
        courseId: e.courses?.id || '',
        title: e.courses?.title_en || 'Untitled Course',
        instructorName: instructorMap.get(e.courses?.instructor_id) || 'TBA',
        progress: 0, // In a real app, calculate from module completion
        status: e.status as EnrollmentStatus,
        thumbnail_url: e.courses?.thumbnail_url,
        description_en: e.courses?.description_en,
        level: 'Aviation Specialist' // Mocking level for now or fetch from course meta
    })) || [];

    return {
        profile: {
            id: userId,
            fullName: profileData.full_name,
            email: profileData.email || '',
            studentId: `ERN-2025-${userId.substring(0, 3).toUpperCase()}`,
            qualifications: [],
            avatarUrl: profileData.avatar_url
        },
        activeCourses
    };
};

/**
 * Logic for a student attempting to join a class.
 */
export const requestEnrollment = async (userId: string, courseId: string) => {
    const { error } = await supabase.from('enrollments').insert({
        user_id: userId,
        course_id: courseId,
        status: 'pending'
    });

    if (error) return { success: false, message: error.message };
    return { success: true, message: "✅ Request Sent! Awaiting Instructor Approval." };
};
