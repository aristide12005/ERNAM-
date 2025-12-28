-- FIX: Infinite Recursion in RLS Policies (Idempotent Version)
-- Problem: 'courses' checks 'enrollments', and 'enrollments' checks 'courses'.
-- Solution: 'enrollments' should check 'course_staff' directly for instructor access.

-- 1. Reset Enrollments Policies (Drop ALL potential existing policies)
DROP POLICY IF EXISTS "Users view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Instructors view course enrollments" ON public.enrollments; -- Old name
DROP POLICY IF EXISTS "Staff view course enrollments" ON public.enrollments;        -- New name
DROP POLICY IF EXISTS "Admins view all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.enrollments;
DROP POLICY IF EXISTS "Users can enroll themselves" ON public.enrollments;
DROP POLICY IF EXISTS "Staff manage enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Enrolled users view own enrollments" ON public.enrollments;

-- 2. Create Clean Policies

-- A. Users can see their own enrollments
CREATE POLICY "Users view own enrollments"
ON public.enrollments FOR SELECT
USING ( user_id = auth.uid() );

-- B. Instructors/Staff can see enrollments for their courses
-- CRITICAL: Check 'course_staff', NOT 'courses' table, to avoid recursion loop.
CREATE POLICY "Staff view course enrollments"
ON public.enrollments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.course_staff
        WHERE course_staff.course_id = enrollments.course_id
        AND course_staff.user_id = auth.uid()
    )
    OR is_admin()
);

-- C. Users can create their own enrollments (Enrollment logic)
CREATE POLICY "Users can enroll themselves"
ON public.enrollments FOR INSERT
WITH CHECK ( user_id = auth.uid() );

-- D. Staff/Admins can update/delete enrollments
CREATE POLICY "Staff manage enrollments"
ON public.enrollments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.course_staff
        WHERE course_staff.course_id = enrollments.course_id
        AND course_staff.user_id = auth.uid()
    )
    OR is_admin()
);

-- 3. Ensure 'course_staff' is readable by user (Required for the check above)
DROP POLICY IF EXISTS "Users view own staff roles" ON public.course_staff;
CREATE POLICY "Users view own staff roles"
ON public.course_staff FOR SELECT
USING ( user_id = auth.uid() OR is_admin() );
