-- Admin Hardening Migration

-- 1. Ensure Audit Logs Table Exists (Idempotent)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    action TEXT NOT NULL,
    target_resource TEXT NOT NULL,
    admin_id UUID REFERENCES auth.users(id),
    details JSONB
);

-- 2. Atomic RPC: Approve User
CREATE OR REPLACE FUNCTION approve_user_transaction(
    target_user_id UUID,
    acting_admin_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to bypass RLS for the update, but we check role manually
AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- Authorization Check
    SELECT (role = 'admin') INTO is_admin
    FROM public.profiles
    WHERE id = acting_admin_id;

    IF NOT is_admin THEN
        RAISE EXCEPTION 'Unauthorized: Actor is not an admin.';
    END IF;

    -- Update Profile
    UPDATE public.profiles
    SET status = 'approved'
    WHERE id = target_user_id;

    -- Insert Audit Log
    INSERT INTO public.audit_logs (action, target_resource, admin_id, details)
    VALUES (
        'USER_APPROVED',
        target_user_id::TEXT,
        acting_admin_id,
        jsonb_build_object('timestamp', NOW())
    );
END;
$$;

-- 3. Atomic RPC: Reject User
CREATE OR REPLACE FUNCTION reject_user_transaction(
    target_user_id UUID,
    acting_admin_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- Authorization Check
    SELECT (role = 'admin') INTO is_admin
    FROM public.profiles
    WHERE id = acting_admin_id;

    IF NOT is_admin THEN
        RAISE EXCEPTION 'Unauthorized: Actor is not an admin.';
    END IF;

    -- Update Profile
    UPDATE public.profiles
    SET status = 'rejected'
    WHERE id = target_user_id;

    -- Insert Audit Log
    INSERT INTO public.audit_logs (action, target_resource, admin_id, details)
    VALUES (
        'USER_REJECTED',
        target_user_id::TEXT,
        acting_admin_id,
        jsonb_build_object('timestamp', NOW())
    );
END;
$$;

-- 4. Harden Profiles RLS
-- Drop existing policies to prevent conflicts and ensure clean slate
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Policy: Admins can see EVERYTHING
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Policy: Users can see themselves
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
);

-- Policy: Trainers can see their students (Optional/Future, stick to strict for now)
-- (Add later based on enrollment logic)
