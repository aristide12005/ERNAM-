-- FIX: Allow course owners/staff to update course status
-- This enables the publish/draft toggle button to work

-- Add UPDATE policy for course owners
DROP POLICY IF EXISTS "Owners can update course" ON public.courses;

CREATE POLICY "Owners can update course"
ON public.courses FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.course_staff
        WHERE course_staff.course_id = courses.id
        AND course_staff.user_id = auth.uid()
        AND course_staff.role IN ('owner', 'trainer')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.course_staff
        WHERE course_staff.course_id = courses.id
        AND course_staff.user_id = auth.uid()
        AND course_staff.role IN ('owner', 'trainer')
    )
);
