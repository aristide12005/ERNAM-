-- 🔒 ERNAM ROLE-BASED SECURITY & SCHEMA UPDATE
-- Ensures "The Law" is enforced by the database.

-- 1. SCHEMA UPDATES
-- Add attendance_log and ensure strict columns
ALTER TABLE public.session_participants 
ADD COLUMN IF NOT EXISTS attendance_log JSONB DEFAULT '{}'::JSONB; -- Structure: {"YYYY-MM-DD": "present"|"absent"}

ALTER TABLE public.assessments
ADD COLUMN IF NOT EXISTS remarks TEXT,
ADD COLUMN IF NOT EXISTS score NUMERIC;

-- 2. RESET POLICIES (Clean Slate)
DROP POLICY IF EXISTS "Instructors view assigned sessions" ON public.sessions;
DROP POLICY IF EXISTS "Participants view assigned sessions" ON public.sessions;
DROP POLICY IF EXISTS "Instructors update participants" ON public.session_participants;
-- Drop any other loose policies if needed, but safer to be specific or use drop cascade on table disable/enable if strictly needed.
-- For now, we define NEW strict policies.

-- 3. STRICT RLS POLICIES

-- >>> SESSIONS <<<
-- Instructor: View ONLY assigned sessions
CREATE POLICY "Instructor View Assigned" ON public.sessions
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.session_instructors si 
        WHERE si.session_id = sessions.id 
        AND si.instructor_id = auth.uid()
    )
    OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ernam_admin', 'org_admin')) -- Admins see all (filter in UI)
);

-- Participant: View ONLY entered sessions
CREATE POLICY "Participant View Assigned" ON public.sessions
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.session_participants sp 
        WHERE sp.session_id = sessions.id 
        AND sp.participant_id = auth.uid()
    )
);

-- >>> SESSION PARTICIPANTS (Attendance) <<<
-- Instructor: UPDATE attendance for assigned sessions
CREATE POLICY "Instructor Update Attendance" ON public.session_participants
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.session_instructors si 
        WHERE si.session_id = session_participants.session_id 
        AND si.instructor_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.session_instructors si 
        WHERE si.session_id = session_participants.session_id 
        AND si.instructor_id = auth.uid()
    )
);

-- Participant: SELECT own record
CREATE POLICY "Participant View Self" ON public.session_participants
FOR SELECT TO authenticated
USING (participant_id = auth.uid());

-- >>> ASSESSMENTS <<<
-- Instructor: INSERT/UPDATE for assigned sessions
CREATE POLICY "Instructor Manage Assessments" ON public.assessments
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.session_instructors si 
        WHERE si.session_id = assessments.session_id 
        AND si.instructor_id = auth.uid()
    )
);

-- Participant: SELECT own results
CREATE POLICY "Participant View Results" ON public.assessments
FOR SELECT TO authenticated
USING (participant_id = auth.uid());

-- >>> MESSAGES <<<
-- Everyone in the session can read/write
CREATE POLICY "Session Chat Access" ON public.messages
FOR ALL TO authenticated
USING (
    -- Sender must be self
    sender_id = auth.uid() 
    AND (
        -- Is Instructor
        EXISTS (SELECT 1 FROM public.session_instructors si WHERE si.session_id = messages.session_id AND si.instructor_id = auth.uid())
        OR
        -- Is Participant
        EXISTS (SELECT 1 FROM public.session_participants sp WHERE sp.session_id = messages.session_id AND sp.participant_id = auth.uid())
        OR
        -- Is Admin
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ernam_admin')
    )
);

-- >>> DOCUMENTS <<<
-- Instructor can upload
CREATE POLICY "Instructor Upload Docs" ON public.documents
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.session_instructors si 
        WHERE si.session_id = documents.session_id 
        AND si.instructor_id = auth.uid()
    )
);

-- Everyone reads
CREATE POLICY "Session Doc Access" ON public.documents
FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.session_instructors si WHERE si.session_id = documents.session_id AND si.instructor_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.session_participants sp WHERE sp.session_id = documents.session_id AND sp.participant_id = auth.uid())
);

