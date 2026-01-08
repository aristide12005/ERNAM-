-- 🔓 FIX RLS POLICIES (THE REAL ISSUE) 🔓
-- The database was locked in "Deny All" mode because RLS was enabled but no policies were created.

-- 1. Allow Users to Read Their Own Profile
-- This allows AuthProvider to fetch the 'role' and 'status'.
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- 2. Allow Admins to Read All Users (for Management)
-- We check if the requesting user is an 'ernam_admin'
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id -- Self (recursion breaker)
        OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'ernam_admin'
        )
    );

-- 3. Update Application Defaults
DROP POLICY IF EXISTS "Public Apply" ON public.applications;
CREATE POLICY "Public Apply" ON public.applications 
    FOR INSERT 
    TO anon, authenticated -- Allow both
    WITH CHECK (true);

-- 4. Allow Users to Update their own Profile (e.g. name only)
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 5. Enable RLS on all tables (Safety Check)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
