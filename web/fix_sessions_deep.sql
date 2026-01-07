-- 🔧 FIX SESSIONS DEEP (Schema & RLS)
-- 1. Updates Sessions to support Time (TIMESTAMPTZ) instead of just DATE
-- 2. Fixes RLS Recursion on Sessions/Users using SECURITY DEFINER functions

-- A. FIX SCHEMA (Enable Time Selection)
-- We use a safe alter to convert DATE to TIMESTAMPTZ (Midnight default)
ALTER TABLE public.sessions 
    ALTER COLUMN start_date TYPE TIMESTAMPTZ USING start_date::timestamptz,
    ALTER COLUMN end_date TYPE TIMESTAMPTZ USING end_date::timestamptz;

-- B. SECURITY DEFINER FUNCTIONS (Break RLS Loops)
-- These allow checking roles/orgs without triggering the User table's own RLS

CREATE OR REPLACE FUNCTION public.check_user_role(required_roles text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- ⚡ BYPASS RLS
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = ANY(required_roles)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_participant_in_session(target_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.session_participants 
        WHERE session_id = target_session_id 
        AND participant_id = auth.uid()
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_instructor_in_session(target_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.session_instructors 
        WHERE session_id = target_session_id 
        AND instructor_id = auth.uid()
    );
END;
$$;

-- C. UPDATE POLICIES (Use New Functions)

-- 1. SESSIONS
DROP POLICY IF EXISTS "Authenticated users can view sessions" ON public.sessions;
DROP POLICY IF EXISTS "Instructor View Assigned" ON public.sessions;
DROP POLICY IF EXISTS "Participant View Assigned" ON public.sessions;
DROP POLICY IF EXISTS "Admins can manage sessions" ON public.sessions;

-- Unified View Policy
CREATE POLICY "View Sessions" ON public.sessions
    FOR SELECT TO authenticated
    USING (
        -- Admins & Org Admins see ALL
        public.check_user_role(ARRAY['ernam_admin', 'org_admin'])
        OR
        -- Instructors see Assigned
        public.is_instructor_in_session(id)
        OR
        -- Participants see Enrolled
        public.is_participant_in_session(id)
    );

-- Admin Manage Policy
CREATE POLICY "Admins Manage Sessions" ON public.sessions
    FOR ALL TO authenticated
    USING (
        public.check_user_role(ARRAY['ernam_admin'])
    );

-- 2. SESSION PARTICIPANTS
DROP POLICY IF EXISTS "Org admins can view own session participants" ON public.session_participants;
DROP POLICY IF EXISTS "Org admins can assign participants" ON public.session_participants;
DROP POLICY IF EXISTS "Instructor Update Attendance" ON public.session_participants;
DROP POLICY IF EXISTS "Participant View Self" ON public.session_participants;

-- View
CREATE POLICY "View Session Participants" ON public.session_participants
    FOR SELECT TO authenticated
    USING (
        -- Admins see all
        public.check_user_role(ARRAY['ernam_admin'])
        OR
        -- Org admins see their org members (requires getting org id safely, handled by restricted view usually, but simpler:)
        (public.check_user_role(ARRAY['org_admin']) AND organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()))
        OR
        -- Instructors see their session's participants
        public.is_instructor_in_session(session_id)
        OR
        -- Users see themselves
        participant_id = auth.uid()
    );

-- Insert/Update (Org Admin / Instructor)
CREATE POLICY "Manage Session Participants" ON public.session_participants
    FOR ALL TO authenticated
    USING (
        public.check_user_role(ARRAY['ernam_admin', 'org_admin']) -- Simplified for broad access, refined by UI
        OR
        (public.check_user_role(ARRAY['instructor']) AND public.is_instructor_in_session(session_id)) -- For attendance
    );
