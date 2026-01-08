-- 🚨 RUN THIS IN SUPABASE SQL EDITOR TO FIX "ACCESS DENIED" 🚨

-- 1. Sync the Admin ID
UPDATE public.users
SET id = (SELECT id FROM auth.users WHERE email = 'aristide@ernam.aero' LIMIT 1),
    role = 'ernam_admin',
    status = 'approved'
WHERE email = 'aristide@ernam.aero';

-- 2. Verify Result
SELECT * FROM public.users WHERE email = 'aristide@ernam.aero';

-- 3. If the above returns a row with the correct role, REFRESH YOUR APP.
