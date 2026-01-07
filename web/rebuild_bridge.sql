-- 🌉 REBUILD THE BRIDGE (ONE SCRIPT TO FIX ALL) 🌉
-- This script tears down the broken logic and rebuilds the Data-UI bridge correctly.
-- RUN THIS ENTIRE SCRIPT IN SUPABASE SQL EDITOR.

BEGIN;

-- 1. DROP BROKEN POLICIES (Reset the locks)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Public Apply" ON public.applications;
DROP POLICY IF EXISTS "Users view own apps" ON public.applications;

-- 2. RE-APPLY CORRECT POLICIES (Open the bridge)
-- User Self-Access (The missing link)
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Admin God Mode
CREATE POLICY "Admins can view all users" ON public.users FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ernam_admin'));

-- Application Flow
CREATE POLICY "Public Apply" ON public.applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users view own apps" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = applicant_user_id);

-- 3. RE-APPLY LOGIC TRIGGER (The brain)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE submitted_secret TEXT;
BEGIN
    submitted_secret := NEW.raw_user_meta_data->>'admin_secret';
    IF submitted_secret = 'ERNAM2026' THEN
        -- Admin Backdoor
        INSERT INTO public.users (id, email, full_name, role, status)
        VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin'), 'ernam_admin', 'approved')
        ON CONFLICT (id) DO UPDATE SET role = 'ernam_admin', status = 'approved';
    ELSE
        -- Standard Flow
        IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
            UPDATE public.users SET id = NEW.id WHERE email = NEW.email; -- Link pre-existing account
        ELSE
            INSERT INTO public.users (id, email, full_name, role, status)
            VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), 'participant', 'pending');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rebind Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. REPAIR DATA (The cargo)
-- Force sync Aristide's account if it exists in Auth
DO $$
DECLARE auth_user_id UUID;
BEGIN
    SELECT id INTO auth_user_id FROM auth.users WHERE email = 'aristide@ernam.aero';
    IF auth_user_id IS NOT NULL THEN
        INSERT INTO public.users (id, email, full_name, role, status)
        VALUES (auth_user_id, 'aristide@ernam.aero', 'Aristide Niyombabazi', 'ernam_admin', 'approved')
        ON CONFLICT (email) DO UPDATE SET id = auth_user_id, role = 'ernam_admin', status = 'approved';
    ELSE
        -- Just ensure the row exists for when he does sign up
        INSERT INTO public.users (email, full_name, role, status)
        VALUES ('aristide@ernam.aero', 'Aristide Niyombabazi', 'ernam_admin', 'approved')
        ON CONFLICT (email) DO UPDATE SET role = 'ernam_admin', status = 'approved';
    END IF;
END $$;

COMMIT;

-- 5. VERIFICATION
SELECT email, role, status, id FROM public.users WHERE email = 'aristide@ernam.aero';
