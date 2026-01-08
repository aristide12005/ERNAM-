-- 🚨 FINAL FIX: FORCE ADMIN ACCESS 🚨
-- Run this in Supabase SQL Editor to guarantee access.

-- 1. Get the Auth ID for the admin email
DO $$
DECLARE
    target_email TEXT := 'aristide@ernam.aero';
    auth_id UUID;
BEGIN
    -- Fetch ID from auth.users
    SELECT id INTO auth_id FROM auth.users WHERE email = target_email;

    IF auth_id IS NULL THEN
        RAISE EXCEPTION 'User % not found in Auth. Please Sign Up first!', target_email;
    END IF;

    -- 2. Upsert into public.users (Insert or Update)
    INSERT INTO public.users (id, email, full_name, role, status)
    VALUES (
        auth_id,
        target_email,
        'Aristide Niyombabazi',
        'ernam_admin',
        'approved'
    )
    ON CONFLICT (email) DO UPDATE
    SET 
        id = EXCLUDED.id, -- Syncs the IDs
        role = 'ernam_admin',
        status = 'approved',
        full_name = EXCLUDED.full_name;

END $$;

-- 3. Verify
SELECT * FROM public.users WHERE email = 'aristide@ernam.aero';
