-- 🔧 FIX RLS FOR SESSIONS & PARTICIPANTS
-- Ensure Org Admins can view session participants and related session details

-- 1. Enable RLS (just in case)
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- 2. Session Participants: Org Admins can view participants in their org
DROP POLICY IF EXISTS "Org admins can view own session participants" ON public.session_participants;
CREATE POLICY "Org admins can view own session participants" ON public.session_participants
    FOR SELECT TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

-- 3. Session Participants: Org Admins can INSERT (Assign) - Already likely exists, but ensuring
DROP POLICY IF EXISTS "Org admins can assign participants" ON public.session_participants;
CREATE POLICY "Org admins can assign participants" ON public.session_participants
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

-- 4. Sessions: Generic "View" policy for Authenticated users (or restrict to Org Admins)
-- We need Org Admins to see session titles even if they didn't create them (if they are public/planned)
DROP POLICY IF EXISTS "Authenticated users can view sessions" ON public.sessions;
CREATE POLICY "Authenticated users can view sessions" ON public.sessions
    FOR SELECT TO authenticated
    USING (true); -- Or refine to specific status like 'planned', 'active'

-- 5. Fix Users visibility (just in case)
-- Ensure Org Admins can see all users in their org
DROP POLICY IF EXISTS "Org admins can view org members" ON public.users;
CREATE POLICY "Org admins can view org members" ON public.users
    FOR SELECT TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid() 
            AND role != 'participant' -- Optimization: usually checking own org_id is enough
        )
        OR id = auth.uid()
    );
