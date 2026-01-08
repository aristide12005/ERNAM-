-- 🔧 FIX STANDARD CREATION & RLS RECURSION
-- Run this in Supabase SQL Editor

-- 1. Helper Function to safely check Admin status (Bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_ernam_admin() 
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'ernam_admin'
    );
END;
$$;

-- 2. Helper for Organization ID (Safe Lookup to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    org_id uuid;
BEGIN
    SELECT organization_id INTO org_id
    FROM public.users
    WHERE id = auth.uid();
    RETURN org_id;
END;
$$;

-- 3. Update Training Standards Policy (Using Safe Check)
DROP POLICY IF EXISTS "Admins can manage standards" ON public.training_standards;
CREATE POLICY "Admins can manage standards" ON public.training_standards
    FOR ALL
    TO authenticated
    USING ( public.is_ernam_admin() );

-- 4. Create missing 'settings' table (Fixing 404 error)
CREATE TABLE IF NOT EXISTS public.settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    key text UNIQUE NOT NULL,
    value jsonb DEFAULT '{}'::jsonb,
    description text,
    CONSTRAINT settings_pkey PRIMARY KEY (id)
);

-- Enable RLS on settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read settings (Public config like maintenance mode)
DROP POLICY IF EXISTS "Everyone reads settings" ON public.settings;
CREATE POLICY "Everyone reads settings" ON public.settings
    FOR SELECT 
    TO public
    USING (true);

-- Admins manage settings
DROP POLICY IF EXISTS "Admins manage settings" ON public.settings;
CREATE POLICY "Admins manage settings" ON public.settings
    FOR ALL 
    TO authenticated
    USING ( public.is_ernam_admin() );

-- 5. Fix Users RLS Recursion (Using Safe Lookup)
DROP POLICY IF EXISTS "Org admins can view org members" ON public.users;
CREATE POLICY "Org admins can view org members" ON public.users
    FOR SELECT TO authenticated
    USING (
        (organization_id = public.get_my_org_id()) -- Uses Security Definer to avoid recursion
        OR 
        (id = auth.uid())
        OR
        (public.is_ernam_admin()) -- Admins see all
    );

-- 6. Insert default settings if empty
INSERT INTO public.settings (key, value, description)
VALUES 
    ('maintenance_mode', '{"enabled": false}', 'System-wide maintenance mode flag'),
    ('public_registration', '{"enabled": true}', 'Allow public sign-ups')
ON CONFLICT (key) DO NOTHING;
