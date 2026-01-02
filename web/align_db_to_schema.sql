-- MASTER FIX: ALIGN DB & CLEANUP LEGACY
-- Purpose: 
-- 1. Remove "instructor_id" triggers (Nuclear Cleanup).
-- 2. Ensure Enrollment Status Enum supports 'active'.
-- 3. Rebuild 'approve_enrollment' RPC to match the schema exactly.

-- === PART 1: NUCLEAR CLEANUP OF LEGACY CODE ===
DROP TRIGGER IF EXISTS trg_notify_enrollment_request ON public.enrollment_requests;
DROP TRIGGER IF EXISTS on_enrollment_request_insert ON public.enrollment_requests;
DROP TRIGGER IF EXISTS check_instructor_id ON public.courses;
DROP TRIGGER IF EXISTS ensure_instructor_exists ON public.courses;
-- Found via Deep Analysis:
DROP TRIGGER IF EXISTS on_enrollment_notify_instructor ON public.enrollments;
DROP TRIGGER IF EXISTS notify_instructor_on_enrollment ON public.enrollments;
DROP FUNCTION IF EXISTS public.notify_instructor_on_enrollment() CASCADE;

DROP FUNCTION IF EXISTS public.fn_notify_on_enrollment_request() CASCADE;
DROP FUNCTION IF EXISTS public.validate_instructor() CASCADE;

-- Drop any legacy RLS policies that might reference 'instructor_id'
DROP POLICY IF EXISTS "instructor_can_manage_own_course" ON public.courses;
DROP POLICY IF EXISTS "instructor_select_requests_for_their_course" ON public.enrollment_requests;
DROP POLICY IF EXISTS "Instructors view enrollments" ON public.enrollments;

-- Verify column is gone
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'instructor_id'
    ) THEN
        ALTER TABLE public.courses DROP COLUMN instructor_id;
    END IF;
END $$;


-- === PART 2: ENSURE ENUM VALUES ===
-- Ensure 'active' status exists for enrollments
DO $$
BEGIN
    ALTER TYPE public.enrollment_status ADD VALUE IF NOT EXISTS 'active';
    ALTER TYPE public.enrollment_status ADD VALUE IF NOT EXISTS 'completed';
    ALTER TYPE public.enrollment_status ADD VALUE IF NOT EXISTS 'failed';
EXCEPTION
    WHEN duplicate_object THEN null; -- Ignore if exists
    WHEN OTHERS THEN null; -- Ignore if type doesn't exist (will default to text)
END $$;


-- === PART 2.5: IMPLEMENT SAFE NOTIFICATION LOGIC (Mapping to 'course_staff') ===
-- Create function that uses course_staff to find recipients
CREATE OR REPLACE FUNCTION public.notify_instructors_on_request()
RETURNS TRIGGER AS $$
DECLARE
    staff_record RECORD;
    student_name TEXT;
    course_title TEXT;
BEGIN
    -- Get Metadata
    SELECT full_name INTO student_name FROM public.profiles WHERE id = NEW.requester_id;
    SELECT title_fr INTO course_title FROM public.courses WHERE id = NEW.course_id;

    -- Loop through all staff for this course (This maps to the AVAILABLE KEY: course_staff)
    FOR staff_record IN 
        SELECT user_id FROM public.course_staff 
        WHERE course_id = NEW.course_id AND role IN ('owner', 'instructor')
    LOOP
        INSERT INTO public.notifications (type, actor_id, recipient_id, target_id, payload)
        VALUES (
            'enrollment_request',
            NEW.requester_id,
            staff_record.user_id,
            NEW.course_id,
            jsonb_build_object(
                'student_name', COALESCE(student_name, 'Unknown Student'),
                'course_name', COALESCE(course_title, 'Unknown Course'),
                'request_id', NEW.id,
                'course_id', NEW.course_id,
                'user_id', NEW.requester_id,
                'title', 'New Enrollment Request',
                'message', COALESCE(student_name, 'A student') || ' has requested to join ' || COALESCE(course_title, 'a course') || '.'
            )
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists before creating (to handle re-runs safe)
DROP TRIGGER IF EXISTS trg_new_enrollment_request ON public.enrollment_requests;
CREATE TRIGGER trg_new_enrollment_request
AFTER INSERT ON public.enrollment_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_instructors_on_request();


-- === PART 3: REBUILD RPC WITH PROVIDED SCHEMA ===
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

    -- Insert/Update Enrollment
    INSERT INTO public.enrollments (user_id, course_id, status, created_at)
    VALUES (v_student_id, v_course_id, 'active'::public.enrollment_status, NOW())
    ON CONFLICT (user_id, course_id) 
    DO UPDATE SET status = 'active'::public.enrollment_status;

    -- Mark Request Approved
    UPDATE public.enrollment_requests 
    SET status = 'approved', updated_at = NOW() 
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
