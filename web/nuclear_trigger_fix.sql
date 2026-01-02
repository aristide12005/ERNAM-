-- DYNAMICALLY DROP ALL TRIGGERS ON 'enrollments'
-- This prevents any "hidden" legacy triggers from firing
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'enrollments'
        AND trigger_schema = 'public'
    LOOP
        RAISE NOTICE 'Dropping trigger: %', r.trigger_name;
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.enrollments CASCADE';
    END LOOP;
END $$;

-- Drop legacy functions that might be attached to those triggers
DROP FUNCTION IF EXISTS public.notify_instructor_on_enrollment() CASCADE;
DROP FUNCTION IF EXISTS public.fn_notify_on_enrollment_request() CASCADE;
DROP FUNCTION IF EXISTS public.check_instructor_id() CASCADE;
DROP FUNCTION IF EXISTS public.validate_instructor() CASCADE;

-- Ensure 'active' status exists
DO $$
BEGIN
    ALTER TYPE public.enrollment_status ADD VALUE IF NOT EXISTS 'active';
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN OTHERS THEN null;
END $$;

-- Re-create the RPC (Safe Version)
CREATE OR REPLACE FUNCTION public.approve_enrollment(request_id UUID)
RETURNS VOID AS $$
DECLARE
    v_req RECORD;
    v_course_id UUID;
    v_student_id UUID;
    v_course_title TEXT;
BEGIN
    -- Fetch Request
    SELECT * INTO v_req FROM public.enrollment_requests WHERE id = request_id;
    
    IF v_req IS NULL THEN
        RAISE EXCEPTION 'Request not found';
    END IF;

    v_course_id := v_req.course_id;
    v_student_id := v_req.requester_id;

    -- Verify Staff Permissions (Using course_staff)
    IF NOT EXISTS (
        SELECT 1 FROM public.course_staff 
        WHERE course_id = v_course_id 
        AND user_id = auth.uid()
        AND role IN ('owner', 'instructor', 'assistant')
    ) AND NOT (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: You are not staff for this course.';
    END IF;

    -- Insert/Update Enrollment - THIS IS WHERE THE LEGACY TRIGGER WOULD FIRE
    INSERT INTO public.enrollments (user_id, course_id, status, created_at)
    VALUES (v_student_id, v_course_id, 'active'::public.enrollment_status, NOW())
    ON CONFLICT (user_id, course_id) 
    DO UPDATE SET status = 'active'::public.enrollment_status;

    -- Mark Request Approved
    UPDATE public.enrollment_requests 
    SET status = 'approved'
    WHERE id = request_id;

    -- Notify Student
    SELECT title_fr INTO v_course_title FROM public.courses WHERE id = v_course_id;
    
    INSERT INTO public.notifications (type, actor_id, recipient_id, target_id, payload)
    VALUES (
        'enrollment_approved',
        auth.uid(),
        v_student_id,
        v_course_id,
        jsonb_build_object(
            'title', 'Enrollment Approved',
            'message', 'Welcome to ' || COALESCE(v_course_title, 'the course') || '!',
            'course_id', v_course_id
        )
    );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
