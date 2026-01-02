-- Comprehensive Schema Fix
-- Run this in the Supabase SQL Editor to resolve "target_resource" and "is_current" errors.

-- 1. Fix Audit Logs Table
DO $$
BEGIN
    -- Ensure target_resource column exists (for RPCs)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='target_resource') THEN
        ALTER TABLE public.audit_logs ADD COLUMN target_resource TEXT;
    END IF;

    -- Ensure details column exists (for RPCs)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='details') THEN
        ALTER TABLE public.audit_logs ADD COLUMN details JSONB;
    END IF;

    -- Ensure admin_id exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='admin_id') THEN
        ALTER TABLE public.audit_logs ADD COLUMN admin_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Fix Academic Sessions Table
DO $$
BEGIN
    -- Rename is_active to is_current if the old name exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='academic_sessions' AND column_name='is_active') THEN
        ALTER TABLE public.academic_sessions RENAME COLUMN is_active TO is_current;
    
    -- If neither exists, create is_current
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='academic_sessions' AND column_name='is_current') THEN
        ALTER TABLE public.academic_sessions ADD COLUMN is_current BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 3. Update RPC Functions to match the correct schema
CREATE OR REPLACE FUNCTION approve_user_transaction(
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
    SET status = 'approved'
    WHERE id = target_user_id;

    -- Insert Audit Log (Logic Updated for Fixed Schema)
    INSERT INTO public.audit_logs (action, target_resource, admin_id, details)
    VALUES (
        'USER_APPROVED',
        target_user_id::TEXT,
        acting_admin_id,
        jsonb_build_object('timestamp', NOW())
    );
END;
$$;

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
