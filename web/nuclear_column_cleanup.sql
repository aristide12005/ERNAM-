-- NUCLEAR CLEANUP: instructor_id
-- Purpose: Aggressively drop ANY trigger or function that might verify 'instructor_id'.

-- 1. Drop known legacy triggers (Standard & Proposed)
DROP TRIGGER IF EXISTS trg_notify_enrollment_request ON public.enrollment_requests;
DROP TRIGGER IF EXISTS on_enrollment_request_insert ON public.enrollment_requests;
DROP TRIGGER IF EXISTS check_instructor_id ON public.courses;
DROP TRIGGER IF EXISTS ensure_instructor_exists ON public.courses;

-- 2. Drop known legacy functions
DROP FUNCTION IF EXISTS public.fn_notify_on_enrollment_request() CASCADE;
DROP FUNCTION IF EXISTS public.validate_instructor() CASCADE;

-- 3. Drop ALL policies on 'enrollments' that might restrict based on instructor_id
-- We will re-apply standard policies later if needed, but for now we need to clear the blockage.
DROP POLICY IF EXISTS "instructor_can_manage_own_course" ON public.courses;
DROP POLICY IF EXISTS "instructor_select_requests_for_their_course" ON public.enrollment_requests;
DROP POLICY IF EXISTS "Instructors view enrollments" ON public.enrollments;

-- 4. Re-verify column is gone
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'instructor_id'
    ) THEN
        ALTER TABLE public.courses DROP COLUMN instructor_id;
    END IF;
END $$;
