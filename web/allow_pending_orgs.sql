-- Allow Authenticated Users to create PENDING organizations
-- (Needed for the new "Immediate Creation" flow)

-- 1. Org INSERT Policy
CREATE POLICY "Users can create pending organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (
    status = 'pending'
);

-- 2. Org SELECT Policy (Maintain privacy functionality)
-- Admins see all. Users see their own (linked via organization_id on users table?? No, circular dependency)
-- Or Users see their own organization (we need to be careful not to hide the org from the user who just created it)
-- Usually:
--  - Admins see ALL.
--  - Public/Authenticated see 'approved' orgs.
--  - Users see 'pending' orgs IF they are the creator? (Hard to track unless org has owner_id)

-- Proposed Fix for SELECT:
-- Allow reading 'approved' orgs.
-- Allow reading ANY org if you are the linked user (handled by app logic usually, but here RLS).

CREATE POLICY "View approved organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
    status = 'approved' OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role = 'ernam_admin' OR organization_id = organizations.id))
);
