-- ADOPT PROPOSED ARCHITECTURE (CLEAN SLATE)
-- 1. DROP Existing Tables (To ensure schema match)
DROP TABLE IF EXISTS public.enrollment_requests CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;

-- 2. Enable extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. Create Tables
CREATE TABLE public.enrollment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'enrollment_request', etc.
  actor_id uuid,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id uuid,
  payload jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 4. RLS Policies
ALTER TABLE public.enrollment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Enrollment Requests: Users can insert own
CREATE POLICY "students_can_insert_enrollment" ON public.enrollment_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

-- Enrollment Requests: Users can view own
CREATE POLICY "requester_can_select_own_requests" ON public.enrollment_requests
  FOR SELECT USING (requester_id = auth.uid());

-- Enrollment Requests: Instructors can view requests for their courses
CREATE POLICY "staff_view_course_requests" ON public.enrollment_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.course_staff cs
      WHERE cs.course_id = enrollment_requests.course_id
      AND cs.user_id = auth.uid()
      AND cs.role IN ('owner', 'trainer', 'instructor')
    )
  );

-- Notifications: Recipient can read
CREATE POLICY "recipient_can_read_notifications" ON public.notifications
  FOR SELECT USING (recipient_id = auth.uid());

-- Notifications: Allow inserts (broadly for now, or assume service role/triggers)
CREATE POLICY "allow_insert_notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Notifications: Recipient can update (mark as read)
CREATE POLICY "recipient_can_update_notifications" ON public.notifications
  FOR UPDATE USING (recipient_id = auth.uid());


-- 5. Trigger Function
CREATE OR REPLACE FUNCTION public.fn_notify_on_enrollment_request()
RETURNS trigger AS $$
DECLARE
  owner_id uuid;
BEGIN
  -- Find course owner from course_staff
  SELECT user_id INTO owner_id
  FROM public.course_staff
  WHERE course_id = NEW.course_id
  AND role = 'owner'
  LIMIT 1;

  -- Fallback to 'trainer' or 'instructor'
  IF owner_id IS NULL THEN
     SELECT user_id INTO owner_id
     FROM public.course_staff
     WHERE course_id = NEW.course_id
     AND role IN ('trainer', 'instructor')
     LIMIT 1;
  END IF;

  IF owner_id IS NULL THEN
    RAISE NOTICE 'Course % has no assigned staff to notify', NEW.course_id;
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (type, actor_id, recipient_id, target_id, payload)
  VALUES (
    'enrollment_request',
    NEW.requester_id,
    owner_id,
    NEW.course_id,
    jsonb_build_object(
      'request_id', NEW.id,
      'course_id', NEW.course_id,
      'requester_id', NEW.requester_id,
      'created_at', NEW.created_at
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach Trigger
CREATE TRIGGER trg_notify_enrollment_request
AFTER INSERT ON public.enrollment_requests
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_on_enrollment_request();

-- 7. Ensure Course Visibility
UPDATE public.courses SET course_status = 'published' WHERE course_status IS NULL OR course_status = 'draft';

DROP POLICY IF EXISTS "Public Read Access" ON public.courses;
CREATE POLICY "Public Read Access"
ON public.courses FOR SELECT
USING (true);
