-- 🛡️ SEED ADMIN USER & AUTH LINKING LOGIC
-- Run this in your Supabase SQL Editor

-- 1. Create a Robust "Handle New User" Trigger
-- This ensures that if we pre-create a user (like Aristide), when they actually sign up/login,
-- their Auth UUID takes over the pre-created record instead of failing.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Try to find existing user by email
    IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
        -- UPDATE existing pre-provisioned user (e.g. created by Admin)
        -- We update the ID to match the Auth ID so RLS works
        UPDATE public.users
        SET id = NEW.id, -- CRITICAL: Link Auth ID to Public ID
            full_name = COALESCE(full_name, NEW.raw_user_meta_data->>'full_name'),
            status = 'approved' -- Auto-approve if they claim a pre-provisioned slot
        WHERE email = NEW.email;
    ELSE
        -- INSERT new user (Standard signup)
        INSERT INTO public.users (id, email, full_name, role, status)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
            'participant', -- Default role
            'pending'      -- Default status
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger (Safety check to drop old one first)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- 2. SEED THE ADMIN USER (Aristide Niyombabazi)
-- We insert him into public.users. 
-- If he creates his account later using this email, the trigger above will link him updates his ID.

INSERT INTO public.users (email, full_name, role, status)
VALUES (
    'aristide@ernam.aero', -- Change this to his REAL email if different
    'Aristide Niyombabazi',
    'ernam_admin',
    'approved'
)
ON CONFLICT (email) DO UPDATE 
SET role = 'ernam_admin', status = 'approved'; -- Promote if already exists

-- 3. CONFIRMATION
SELECT * FROM public.users WHERE email = 'aristide@ernam.aero';
