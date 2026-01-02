-- 1) Enable necessary extension (for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2) Courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  instructor_id uuid NOT NULL, -- should match auth.uid() as uuid
  visibility text NOT NULL DEFAULT 'public', -- 'public' or 'private' or 'draft'
  created_at timestamptz DEFAULT now()
);

-- 3) Enrollment requests
CREATE TABLE IF NOT EXISTS public.enrollment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL, -- student id
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  created_at timestamptz DEFAULT now()
);

-- 4) Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- e.g., 'enrollment_request', 'enrollment_response'
  actor_id uuid,      -- who caused the event (requester or instructor)
  recipient_id uuid,  -- who should receive the notification
  target_id uuid,     -- related resource (e.g. course id or request id)
  payload jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ========== Test-friendly RLS policies ==========
-- NOTE: These are permissive to help debugging. Tighten them for production.

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read public courses (test)
CREATE POLICY "public_can_read_public_courses" ON public.courses
  FOR SELECT
  USING (visibility = 'public');

-- Allow instructor to insert/update their own courses
CREATE POLICY "instructor_can_manage_own_course" ON public.courses
  FOR ALL
  USING (instructor_id = auth.uid()::uuid)
  WITH CHECK (instructor_id = auth.uid()::uuid);

-- Allow students to insert enrollment requests where they are the requester
CREATE POLICY "students_can_insert_enrollment" ON public.enrollment_requests
  FOR INSERT
  WITH CHECK (requester_id = auth.uid()::uuid);

-- Allow requester to read their enrollment requests
CREATE POLICY "requester_can_select_own_requests" ON public.enrollment_requests
  FOR SELECT
  USING (requester_id = auth.uid()::uuid);

-- Allow instructor (course owner) to select enrollment requests for their course
CREATE POLICY "instructor_select_requests_for_their_course" ON public.enrollment_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = enrollment_requests.course_id AND c.instructor_id = auth.uid()::uuid
    )
  );

-- Allow inserts into notifications triggered by DB functions or app (temporary permissive)
CREATE POLICY "allow_insert_notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Allow recipients to read their notifications
CREATE POLICY "recipient_can_read_notifications" ON public.notifications
  FOR SELECT
  USING (recipient_id = auth.uid()::uuid);

-- ========== Trigger: create notification on new enrollment request ==========
CREATE OR REPLACE FUNCTION public.fn_notify_on_enrollment_request()
RETURNS trigger AS $$
DECLARE
  instructor uuid;
BEGIN
  SELECT instructor_id INTO instructor FROM public.courses WHERE id = NEW.course_id;
  IF instructor IS NULL THEN
    RAISE NOTICE 'Course % has no instructor', NEW.course_id;
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (type, actor_id, recipient_id, target_id, payload)
  VALUES (
    'enrollment_request',
    NEW.requester_id,
    instructor,
    NEW.course_id,
    jsonb_build_object(
      'request_id', NEW.id,
      'course_id', NEW.course_id,
      'requester_id', NEW.requester_id,
      'created_at', NEW.created_at
    )
  );

  -- Also notify via LISTEN/NOTIFY for other realtime consumers if desired
  PERFORM pg_notify('notifications_channel', jsonb_build_object('recipient_id', instructor::text, 'request_id', NEW.id)::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_enrollment_request ON public.enrollment_requests;
CREATE TRIGGER trg_notify_enrollment_request
AFTER INSERT ON public.enrollment_requests
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_on_enrollment_request();