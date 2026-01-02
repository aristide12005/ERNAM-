-- Enable RLS on enrollments if not already
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be broken or restrictive
DROP POLICY IF EXISTS "Instructors can view enrollments for their courses" ON public.enrollments;
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;

-- Policy: Admin Access
CREATE POLICY "Admins can view all enrollments" 
ON public.enrollments FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Student Access (View Own)
CREATE POLICY "Students can view their own enrollments" 
ON public.enrollments FOR SELECT 
USING (
    user_id = auth.uid()
);

-- Policy: Instructor/Staff Access (View Course Enrollments)
-- This checks if the current user is in 'course_staff' for the enrollment's course
CREATE POLICY "Staff can view enrollments for their courses" 
ON public.enrollments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.course_staff
        WHERE course_staff.course_id = enrollments.course_id
        AND course_staff.user_id = auth.uid()
    )
);

-- Policy: Staff can UPDATE enrollments (e.g. approve/reject/grade)
CREATE POLICY "Staff can update enrollments for their courses" 
ON public.enrollments FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.course_staff
        WHERE course_staff.course_id = enrollments.course_id
        AND course_staff.user_id = auth.uid()
        AND course_staff.role IN ('owner', 'instructor', 'assistant')
    )
);

-- Ensure enrollment_requests has similar visibility
ALTER TABLE public.enrollment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view requests" ON public.enrollment_requests;

CREATE POLICY "Staff can view requests" 
ON public.enrollment_requests FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.course_staff
        WHERE course_staff.course_id = enrollment_requests.course_id
        AND course_staff.user_id = auth.uid()
    )
);

CREATE POLICY "Staff can update requests" 
ON public.enrollment_requests FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.course_staff
        WHERE course_staff.course_id = enrollment_requests.course_id
        AND course_staff.user_id = auth.uid()
        AND course_staff.role IN ('owner', 'instructor', 'assistant')
    )
);
