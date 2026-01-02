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
        duration_hours,
        level
      )
    `)
        .eq('user_id', userId);

    // 2b. Fetch Pending Requests
    const { data: requests, error: reqError } = await supabase
        .from('enrollment_requests')
        .select(`
            status,
            courses (
                id,
                title_en,
                description_en,
                thumbnail_url,
                duration_hours,
                level
            )
        `)
        .eq('requester_id', userId)
        .eq('status', 'pending');

    if (enrollError) {
        console.error('Enrollment fetch error:', enrollError);
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

    // 3. Fetch instructor names via course_staff
    const enrolledCourseIds = enrollments?.map((e: any) => e.courses?.id).filter(Boolean) || [];
    const requestedCourseIds = requests?.map((r: any) => r.courses?.id).filter(Boolean) || [];
    const allCourseIds = [...new Set([...enrolledCourseIds, ...requestedCourseIds])];

    let instructorMap = new Map();

    if (allCourseIds.length > 0) {
        const { data: staffData } = await supabase
            .from('course_staff')
            .select(`
                course_id,
                profiles (full_name)
            `)
            .in('course_id', allCourseIds)
            .in('role', ['owner', 'trainer', 'instructor']);

        if (staffData) {
            staffData.forEach((s: any) => {
                if (!instructorMap.has(s.course_id)) {
                    instructorMap.set(s.course_id, s.profiles?.full_name || 'Staff');
                }
            });
        }
    }

    // Map Active Enrollments
    const activeCourses: StudentCourse[] = enrollments?.map((e: any) => ({
        courseId: e.courses?.id || '',
        title: e.courses?.title_en || 'Untitled Course',
        instructorName: instructorMap.get(e.courses?.id) || 'TBA',
        progress: 0,
        status: e.status as EnrollmentStatus,
        thumbnail_url: e.courses?.thumbnail_url,
        description_en: e.courses?.description_en,
        level: e.courses?.level || 'Aviation Specialist',
        duration_hours: e.courses?.duration_hours || 0
    })) || [];

    // Map Pending Requests (Avoid duplicates if already enrolled)
    requests?.forEach((r: any) => {
        if (!activeCourses.find(c => c.courseId === r.courses?.id)) {
            activeCourses.push({
                courseId: r.courses?.id || '',
                title: r.courses?.title_en || 'Untitled Course',
                instructorName: instructorMap.get(r.courses?.id) || 'TBA',
                progress: 0,
                status: 'pending', // Explicitly pending
                thumbnail_url: r.courses?.thumbnail_url,
                description_en: r.courses?.description_en,
                level: r.courses?.level || 'Aviation Specialist',
                duration_hours: r.courses?.duration_hours || 0
            });
        }
    });

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
    // Check if already requested
    const { data: existing } = await supabase
        .from('enrollment_requests')
        .select('id')
        .eq('course_id', courseId)
        .eq('requester_id', userId)
        .eq('status', 'pending')
        .single();

    if (existing) {
        return { success: false, message: "⚠️ Request already pending approval." };
    }

    const { error } = await supabase.from('enrollment_requests').insert({
        requester_id: userId,
        course_id: courseId,
        status: 'pending'
    });

    if (error) return { success: false, message: error.message };
    return { success: true, message: "✅ Request Sent! Awaiting Instructor Approval." };
};
