-- FIX ENROLLMENT NOTIFICATIONS & WORKFLOW
-- Purpose: Implement database logic for student requests, instructor approval, and notifications.

-- 1. Ensure Tables Exist
CREATE TABLE IF NOT EXISTS public.enrollment_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'enrolled')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL, -- 'enrollment_request', 'enrollment_approved', 'enrollment_rejected', 'system'
    actor_id UUID REFERENCES public.profiles(id),      -- Who triggered it (Student)
    recipient_id UUID REFERENCES public.profiles(id),  -- Who receives it (Instructor)
    target_id UUID,     -- Context ID (Course ID or Request ID)
    payload JSONB,      -- Extra info (names, titles)
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.enrollment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Policies (Basic)
-- Requests
DROP POLICY IF EXISTS "Requester view own" ON public.enrollment_requests;
CREATE POLICY "Requester view own" ON public.enrollment_requests FOR SELECT USING (requester_id = auth.uid());

DROP POLICY IF EXISTS "Students create requests" ON public.enrollment_requests;
CREATE POLICY "Students create requests" ON public.enrollment_requests FOR INSERT WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS "Staff view course requests" ON public.enrollment_requests;
CREATE POLICY "Staff view course requests" ON public.enrollment_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.course_staff cs WHERE cs.course_id = enrollment_requests.course_id AND cs.user_id = auth.uid())
);

-- Notifications
DROP POLICY IF EXISTS "View own notifications" ON public.notifications;
CREATE POLICY "View own notifications" ON public.notifications FOR SELECT USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "System insert notifications" ON public.notifications;
CREATE POLICY "System insert notifications" ON public.notifications FOR INSERT WITH CHECK (true); -- Relaxed for triggers/functions

DROP POLICY IF EXISTS "User update own notifications" ON public.notifications;
CREATE POLICY "User update own notifications" ON public.notifications FOR UPDATE USING (recipient_id = auth.uid());


-- 3. Trigger: Notify Instructors on New Request
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

    -- Loop through all staff for this course
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

DROP TRIGGER IF EXISTS trg_new_enrollment_request ON public.enrollment_requests;
CREATE TRIGGER trg_new_enrollment_request
AFTER INSERT ON public.enrollment_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_instructors_on_request();


-- 4. RPC: Approve Enrollment (Atomic Operation)
CREATE OR REPLACE FUNCTION public.approve_enrollment(request_id UUID)
RETURNS VOID AS $$
DECLARE
    v_req RECORD;
    v_course_title TEXT;
BEGIN
    -- Get Request Info
    SELECT * INTO v_req FROM public.enrollment_requests WHERE id = request_id;
    
    IF v_req IS NULL THEN
        RAISE EXCEPTION 'Request not found';
    END IF;

    -- Check Permissions (Auth user must be staff)
    IF NOT EXISTS (
        SELECT 1 FROM public.course_staff 
        WHERE course_id = v_req.course_id AND user_id = auth.uid()
    ) AND NOT (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: You are not staff for this course';
    END IF;

    -- 1. Create/Update Enrollment
    INSERT INTO public.enrollments (user_id, course_id, status, created_at)
    VALUES (v_req.requester_id, v_req.course_id, 'active', NOW())
    ON CONFLICT (user_id, course_id) 
    DO UPDATE SET status = 'active';

    -- 2. Update Request Status
    UPDATE public.enrollment_requests 
    SET status = 'approved', updated_at = NOW() 
    WHERE id = request_id;

    -- 3. Notify Student
    SELECT title_fr INTO v_course_title FROM public.courses WHERE id = v_req.course_id;

    INSERT INTO public.notifications (type, actor_id, recipient_id, target_id, payload)
    VALUES (
        'enrollment_approved',
        auth.uid(), -- Instructor
        v_req.requester_id, -- Student
        v_req.course_id,
        jsonb_build_object(
            'course_name', COALESCE(v_course_title, 'Course'),
            'title', 'Enrollment Approved',
            'message', 'Your request to join ' || COALESCE(v_course_title, 'the course') || ' has been approved.'
        )
    );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: Reject Enrollment
CREATE OR REPLACE FUNCTION public.reject_enrollment(request_id UUID)
RETURNS VOID AS $$
DECLARE
    v_req RECORD;
    v_course_title TEXT;
BEGIN
    SELECT * INTO v_req FROM public.enrollment_requests WHERE id = request_id;
    
    IF v_req IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;

    -- Check Permissions
    IF NOT EXISTS (
        SELECT 1 FROM public.course_staff 
        WHERE course_id = v_req.course_id AND user_id = auth.uid()
    ) AND NOT (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Update Request Status
    UPDATE public.enrollment_requests 
    SET status = 'rejected', updated_at = NOW() 
    WHERE id = request_id;

    -- Notify Student
    SELECT title_fr INTO v_course_title FROM public.courses WHERE id = v_req.course_id;

    INSERT INTO public.notifications (type, actor_id, recipient_id, target_id, payload)
    VALUES (
        'enrollment_rejected',
        auth.uid(),
        v_req.requester_id,
        v_req.course_id,
        jsonb_build_object(
            'course_name', COALESCE(v_course_title, 'Course'),
            'title', 'Enrollment Declined',
            'message', 'Your request to join ' || COALESCE(v_course_title, 'the course') || ' was declined.'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
