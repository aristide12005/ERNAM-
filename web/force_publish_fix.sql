-- FORCE VISIBILITY: Set all courses to published
-- This will immediately make them visible in "My Learning" if the code is correct
UPDATE public.courses
SET course_status = 'published';

-- FIX RECURSION: Drop the problematic policies on course_staff
-- The recursion happens because courses -> course_staff -> courses
DROP POLICY IF EXISTS "Staff manage enrollments" ON public.course_staff;
DROP POLICY IF EXISTS "Instructors can view their own course staff" ON public.course_staff;

-- Simple non-recursive policy for course_staff
CREATE POLICY "View own staff entry"
ON public.course_staff FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins/Trainers view all staff"
ON public.course_staff FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'trainer')
  )
);
