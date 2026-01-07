-- 🔧 FIX ORGANIZATION & APPLICATION SCHEMA (Strict Authority Compliance)

-- 1. ORGANIZATIONS TABLE (The Real Entities)
-- Ensure strict columns exist
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS type TEXT; -- Ensure 'type' exists

-- 2. APPLICATIONS TABLE (The Temporary Requests)
-- Move away from generic JSONB 'details' to strict columns for auditability
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS applicant_name TEXT,
ADD COLUMN IF NOT EXISTS applicant_email TEXT,
ADD COLUMN IF NOT EXISTS applicant_phone TEXT,
ADD COLUMN IF NOT EXISTS organization_country TEXT;

-- 3. AUDIT LOGS (If not exists, create it - vital for aviation oversight)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- e.g., 'organization_approved'
    details JSONB DEFAULT '{}'::JSONB
);

-- 4. RLS for Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ernam_admin')
    );
