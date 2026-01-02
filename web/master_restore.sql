-- ==========================================
-- MASTER RESTORE SCRIPT FOR ERNAM DIGITAL TWIN
-- ==========================================
-- This script fixes:
-- 1. Legacy Triggers (Instructor ID errors)
-- 2. Enrollment Approvals (Missing columns)
-- 3. Messaging System (Missing functions/RLS)
-- 4. User Search / Profiles (RLS Visibility)
-- 5. Data Visibility (RLS Permissions)

BEGIN;

-- ------------------------------------------
-- 1. NUCLEAR CLEANUP OF LEGACY TRIGGERS
-- ------------------------------------------
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
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.enrollments CASCADE';
    END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.notify_instructor_on_enrollment() CASCADE;
DROP FUNCTION IF EXISTS public.fn_notify_on_enrollment_request() CASCADE;
DROP FUNCTION IF EXISTS public.check_instructor_id() CASCADE;
DROP FUNCTION IF EXISTS public.validate_instructor() CASCADE;

-- ------------------------------------------
-- 2. ENROLLMENT & COURSE SCHEMA FIXES
-- ------------------------------------------
-- Ensure 'active' status exists
DO $$
BEGIN
    ALTER TYPE public.enrollment_status ADD VALUE IF NOT EXISTS 'active';
EXCEPTION
    WHEN duplicate_object THEN null; -- ignore if already exists
    WHEN OTHERS THEN null;
END $$;

-- ------------------------------------------
-- 3. RPC: APPROVE ENROLLMENT (Safe Version)
-- ------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_enrollment(request_id UUID)
RETURNS VOID AS $$
DECLARE
    v_req RECORD;
    v_course_id UUID;
    v_student_id UUID;
    v_course_title TEXT;
BEGIN
    SELECT * INTO v_req FROM public.enrollment_requests WHERE id = request_id;
    
    IF v_req IS NULL THEN
        RAISE EXCEPTION 'Request not found';
    END IF;

    v_course_id := v_req.course_id;
    v_student_id := v_req.requester_id;

    -- Staff Check
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
    SET status = 'approved'
    WHERE id = request_id;

    -- Notify
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

-- ------------------------------------------
-- 4. MESSAGING SYSTEM RESTORATION
-- ------------------------------------------
-- Drop old functions to handle return type changes safely
DROP FUNCTION IF EXISTS get_my_conversations();
DROP FUNCTION IF EXISTS get_direct_messages(UUID, UUID);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Reset Policies for Messaging
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages they are involved in" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages as sender" ON public.messages;

CREATE POLICY "Users can view messages they are involved in"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages as sender"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- RPC: get_my_conversations
CREATE OR REPLACE FUNCTION get_my_conversations()
RETURNS TABLE (
    partner_id UUID,
    last_message TEXT,
    last_message_time TIMESTAMPTZ,
    unread_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    WITH sent_msgs AS (
        SELECT receiver_id as partner, created_at, content, is_read
        FROM messages WHERE sender_id = auth.uid()
    ),
    received_msgs AS (
        SELECT sender_id as partner, created_at, content, is_read
        FROM messages WHERE receiver_id = auth.uid()
    ),
    all_interactions AS (
        SELECT partner, created_at, content, is_read FROM sent_msgs
        UNION ALL
        SELECT partner, created_at, content, is_read FROM received_msgs
    ),
    latest_interactions AS (
        SELECT DISTINCT ON (partner) partner, content, created_at
        FROM all_interactions
        ORDER BY partner, created_at DESC
    ),
    unread_counts AS (
        SELECT sender_id as partner, COUNT(*) as count
        FROM messages WHERE receiver_id = auth.uid() AND is_read = false
        GROUP BY sender_id
    )
    SELECT li.partner, li.content, li.created_at, COALESCE(uc.count, 0)
    FROM latest_interactions li
    LEFT JOIN unread_counts uc ON li.partner = uc.partner
    ORDER BY li.created_at DESC;
END;
$$;

-- RPC: get_direct_messages
CREATE OR REPLACE FUNCTION get_direct_messages(current_user_id UUID, partner_id UUID)
RETURNS TABLE (
    id UUID, sender_id UUID, receiver_id UUID, content TEXT, created_at TIMESTAMPTZ, 
    is_read BOOLEAN, sender_full_name TEXT, sender_role TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT m.id, m.sender_id, m.receiver_id, m.content, m.created_at, m.is_read, p.full_name, p.role
    FROM messages m
    JOIN profiles p ON m.sender_id = p.id
    WHERE (m.sender_id = current_user_id AND m.receiver_id = partner_id)
       OR (m.sender_id = partner_id AND m.receiver_id = current_user_id)
    ORDER BY m.created_at ASC;
END;
$$;

-- ------------------------------------------
-- 5. RLS VISIBILITY FIXES (Dashboard & Profiles)
-- ------------------------------------------
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view enrollments for their courses" ON public.enrollments;
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.enrollments;

CREATE POLICY "Students can view their own enrollments" 
ON public.enrollments FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Staff can view enrollments for their courses" 
ON public.enrollments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.course_staff
        WHERE course_staff.course_id = enrollments.course_id
        AND course_staff.user_id = auth.uid()
    )
);

-- PUBLIC PROFILE VISIBILITY (The "No one in system" fix)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Allow authenticated users to search/view other profiles (restricted to basic info in frontend query)
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

-- Ensure users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

COMMIT;
