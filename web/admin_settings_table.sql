-- System Settings Table for Admin Configuration

CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view settings"
ON public.system_settings FOR SELECT
USING ( is_admin() );

CREATE POLICY "Admins can update settings"
ON public.system_settings FOR UPDATE
USING ( is_admin() );

-- Seed Data (Idempotent)
INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('maintenance_mode', '{"enabled": false}', 'Global system maintenance mode switch'),
    ('platform_name', '{"value": "ERNAM Digital Twin"}', 'Display name of the platform'),
    ('registration_open', '{"enabled": true}', 'Allow new user registrations')
ON CONFLICT (key) DO NOTHING;

-- Audit Log Trigger for Settings (Optional but Good)
-- (Reuse existing audit mechanism if possible, or just trust the app to log it via RPC if we make one.
--  For now, standard RLS is fine as "Real".)
