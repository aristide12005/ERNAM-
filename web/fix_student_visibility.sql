-- FIX STUDENT LIST VISIBILITY
-- The issue: "Never see the list of active/pending students"
-- Root Cause:
-- 1. The frontend (Students.tsx) fetches enrollments and joins 'profiles' (student:profiles(...)).
-- 2. It does this via direct client-side query, which enforces RLS.
-- 3. If RLS on 'profiles' prevents the instructor from seeing the student's profile, the 'student' object returns NULL.
-- 4. The frontend code filters out rows where student name is missing/null.
--
-- Solution:
-- 1. Ensure 'profiles' are viewable by authenticated users (or at least by course staff).
-- 2. Ensure 'enrollments' are viewable by course staff.

-- ============================================================================
-- 1. PROFILES VISIBILITY
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop acts-as-restrictive policies if they exist (common default: only own profile)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Create a policy allowing authenticated users to view basic profile info
-- This is standard for social/collaboration apps so you can see who you are messaging/teaching.
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles FOR SELECT
USING ( auth.role() = 'authenticated' );

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING ( id = auth.uid() );


-- ============================================================================
-- 2. ENROLLMENTS VISIBILITY (Refresher)
-- ============================================================================
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Ensure Staff can view enrollments for their courses
DROP POLICY IF EXISTS "Staff can view enrollments for their courses" ON public.enrollments;

CREATE POLICY "Staff can view enrollments for their courses" 
ON public.enrollments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.course_staff
        WHERE course_staff.course_id = enrollments.course_id
        AND course_staff.user_id = auth.uid()
    )
);

-- Ensure Admins can view everything
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;

CREATE POLICY "Admins can view all enrollments" 
ON public.enrollments FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================================================
-- 3. VERIFICATION QUERY (Run this manually to check)
-- ============================================================================
-- SELECT 
--    e.id, 
--    e.status, 
--    p.full_name as student_name
-- FROM enrollments e
-- LEFT JOIN profiles p ON e.user_id = p.id;
