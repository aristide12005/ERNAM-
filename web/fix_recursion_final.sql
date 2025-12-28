-- FINAL FIX: RLS Recursion Buster
-- Problem: Policies referencing each other create infinite loops (500 Error).
-- Solution: Use SECURITY DEFINER functions to check permissions without triggering RLS.

-- ============================================================================
-- 1. Helper Functions (Bypass RLS)
-- ============================================================================

-- Check if user is Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Check if user is Staff for a course (Safe Lookup)
CREATE OR REPLACE FUNCTION public.is_staff_of(target_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER -- Critical: Runs as owner, bypassing RLS recursion
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_staff
    WHERE course_id = target_course_id
    AND user_id = auth.uid()
  );
$$;

-- Check if user is Enrolled in a course (Safe Lookup)
CREATE OR REPLACE FUNCTION public.is_enrolled_in(target_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER -- Critical: Runs as owner, bypassing RLS recursion
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE course_id = target_course_id
    AND user_id = auth.uid()
    AND status = 'active'
  );
$$;

-- ============================================================================
-- 2. Apply Safe Policies (Using Functions)
-- ============================================================================

-- --- COURSES ---
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Unified Course Visibility" ON public.courses;

CREATE POLICY "Unified Course Visibility"
ON public.courses FOR SELECT
USING (
  status = 'active' OR
  -- status = 'published' OR -- REMOVED: Invalid enum value
  is_admin() OR
  is_staff_of(id) OR      -- Uses safe function
  is_enrolled_in(id)      -- Uses safe function
);

-- --- ENROLLMENTS ---
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Staff view course enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins view all enrollments" ON public.enrollments;
-- Drop old/conflicting policies just in case
DROP POLICY IF EXISTS "Instructors view course enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.enrollments;
DROP POLICY IF EXISTS "Users can enroll themselves" ON public.enrollments;

-- Policy 1: Users see their own
CREATE POLICY "Users view own enrollments"
ON public.enrollments FOR SELECT
USING ( user_id = auth.uid() );

-- Policy 2: Staff see enrollments for their courses (using safe function)
CREATE POLICY "Staff view course enrollments"
ON public.enrollments FOR SELECT
USING (
  is_staff_of(course_id) OR is_admin()
);

-- Policy 3: Creation (Users enrolling themselves)
CREATE POLICY "Users can enroll themselves"
ON public.enrollments FOR INSERT
WITH CHECK ( user_id = auth.uid() );

-- Policy 4: Management (Staff/Admin updates)
DROP POLICY IF EXISTS "Staff manage enrollments" ON public.enrollments;
CREATE POLICY "Staff manage enrollments"
ON public.enrollments FOR ALL
USING (
  is_staff_of(course_id) OR is_admin()
);

-- --- COURSE STAFF ---
ALTER TABLE public.course_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own staff roles" ON public.course_staff;
DROP POLICY IF EXISTS "Unified Staff Visibility" ON public.course_staff;

-- Simple visibility: You see records where YOU are the user, or you are admin
CREATE POLICY "Users view own staff roles"
ON public.course_staff FOR SELECT
USING ( user_id = auth.uid() OR is_admin() );

-- ============================================================================
-- 3. Cleanup
-- ============================================================================
-- Ensure no old recursive policies remain on related tables
DROP POLICY IF EXISTS "Enable read access for all users" ON public.courses;
