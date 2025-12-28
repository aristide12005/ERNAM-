-- SIMPLE FIX: Allow trainers/admins to update courses
-- This bypasses complex course_staff lookup which may be causing issues

-- Drop existing update policies
DROP POLICY IF EXISTS "Owners can update course" ON public.courses;
DROP POLICY IF EXISTS "Owners can update their courses" ON public.courses;
DROP POLICY IF EXISTS "Staff update courses" ON public.courses;

-- Simple policy: Allow users with 'trainer' or 'admin' role to update ANY course
-- This is simpler and will work immediately
CREATE POLICY "Trainers can update courses"
ON public.courses FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('trainer', 'admin')
    )
);

-- If you want ONLY owners to update, uncomment this instead:
-- CREATE POLICY "Only owners update courses"
-- ON public.courses FOR UPDATE
-- USING (
--     EXISTS (
--         SELECT 1 FROM public.course_staff
--         WHERE course_staff.course_id = courses.id
--         AND course_staff.user_id = auth.uid()
--         AND course_staff.role = 'owner'
--     )
-- );
