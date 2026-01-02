-- FIX COLUMN "instructor_id" does not exist ERROR
-- Purpose: Remove legacy triggers and functions that reference the deleted 'instructor_id' column.

-- 1. Drop Legacy Triggers (The likely culprit)
DROP TRIGGER IF EXISTS trg_notify_enrollment_request ON public.enrollment_requests;

-- 2. Drop Legacy Functions
DROP FUNCTION IF EXISTS public.fn_notify_on_enrollment_request();

-- 3. Cleanup Legacy RLS targeting 'instructor_id'
DROP POLICY IF EXISTS "instructor_can_manage_own_course" ON public.courses;
DROP POLICY IF EXISTS "instructor_select_requests_for_their_course" ON public.enrollment_requests;

-- 4. Verify courses table structure (Safety check)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'instructor_id'
    ) THEN
        ALTER TABLE public.courses DROP COLUMN instructor_id;
    END IF;
END $$;
