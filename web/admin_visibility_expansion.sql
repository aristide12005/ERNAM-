-- Admin Visibility Expansion

-- 1. Enrollments: Ensure Admins see EVERYTHING
-- Currently, they might only see what they instruct.
DROP POLICY IF EXISTS "Admins view all enrollments" ON public.enrollments;

CREATE POLICY "Admins view all enrollments"
ON public.enrollments
FOR SELECT
USING ( is_admin() );

-- 2. Courses: Ensure Admins can Manage EVERYTHING
-- (Existing policy checks role='admin' in EXISTS clause, which is okay, but let's be explicit and robust)

DROP POLICY IF EXISTS "Admins manage all courses" ON public.courses;

CREATE POLICY "Admins manage all courses"
ON public.courses
FOR ALL
USING ( is_admin() );

-- 3. Course Enrollments (if the table exists - explicit check)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_enrollments') THEN
        DROP POLICY IF EXISTS "Admins view all course_enrollments" ON public.course_enrollments;
        CREATE POLICY "Admins view all course_enrollments"
        ON public.course_enrollments
        FOR SELECT
        USING ( is_admin() );
    END IF;
END $$;
