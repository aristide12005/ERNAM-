-- 🚨 FIX RLS for INSTRUCTOR CONTENT MANAGEMENT
-- Addresses "new row violates row-level security policy" errors

-- 1. Ensure RLS is ENABLED for relevant content tables
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planned_activities ENABLE ROW LEVEL SECURITY;

-- 2. DOCUMENTS POLICIES (Refined)
-- Clear existing to avoid conflict
DROP POLICY IF EXISTS "Instructor Upload Docs" ON public.documents;
DROP POLICY IF EXISTS "Session Doc Access" ON public.documents;

-- Policy: Instructors can INSERT documents for their sessions
CREATE POLICY "Instructor Upload Docs" ON public.documents
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.session_instructors si 
        WHERE si.session_id = documents.session_id 
        AND si.instructor_id = auth.uid()
    )
);

-- Policy: Instructors can DELETE their own documents (or documents in their session)
CREATE POLICY "Instructor Delete Docs" ON public.documents
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.session_instructors si 
        WHERE si.session_id = documents.session_id 
        AND si.instructor_id = auth.uid()
    )
);

-- Policy: Everyone in the session can VIEW documents
CREATE POLICY "Session Doc Access" ON public.documents
FOR SELECT TO authenticated
USING (
    -- Is Instructor
    EXISTS (SELECT 1 FROM public.session_instructors si WHERE si.session_id = documents.session_id AND si.instructor_id = auth.uid())
    OR
    -- Is Participant
    EXISTS (SELECT 1 FROM public.session_participants sp WHERE sp.session_id = documents.session_id AND sp.participant_id = auth.uid())
    OR
    -- Is Admin
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ernam_admin', 'org_admin')) -- Admins see all for audit? Or restricted? Let's say admins see all.
);


-- 3. PLANNED ACTIVITIES POLICIES (Missing previously?)
-- Clear existing
DROP POLICY IF EXISTS "Instructor Manage Activities" ON public.planned_activities;
DROP POLICY IF EXISTS "Session Activity Access" ON public.planned_activities;

-- Policy: Instructors can MANAGE (Insert, Update, Delete) activities for their sessions
CREATE POLICY "Instructor Manage Activities" ON public.planned_activities
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.session_instructors si 
        WHERE si.session_id = planned_activities.session_id 
        AND si.instructor_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.session_instructors si 
        WHERE si.session_id = planned_activities.session_id 
        AND si.instructor_id = auth.uid()
    )
);

-- Policy: Participants (and others) can VIEW activities
CREATE POLICY "Session Activity Access" ON public.planned_activities
FOR SELECT TO authenticated
USING (
    -- Is Instructor (covered above, but safe to include for explicit select permissions if needed)
    EXISTS (SELECT 1 FROM public.session_instructors si WHERE si.session_id = planned_activities.session_id AND si.instructor_id = auth.uid())
    OR
    -- Is Participant
    EXISTS (SELECT 1 FROM public.session_participants sp WHERE sp.session_id = planned_activities.session_id AND sp.participant_id = auth.uid())
    OR
     -- Is Admin
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ernam_admin', 'org_admin'))
);
