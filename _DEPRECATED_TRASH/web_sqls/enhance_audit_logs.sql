-- Enhance audit_logs for strict authority tracking
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS entity_type TEXT,
ADD COLUMN IF NOT EXISTS entity_id UUID,
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Ensure RLS allows insert for authenticated users (admins) performing actions
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ernam_admin', 'maintainer'))
    );
