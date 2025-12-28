-- FINAL FIX: Break Infinite Recursion in RLS

-- 1. Create a Helper Function that Bypasses RLS
-- "SECURITY DEFINER" means this function runs with the permissions of the database owner,
-- effectively bypassing the Row Level Security policies to check the role safely.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER 
SET search_path = public -- Security best practice
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 2. Clean Up Old Policies (Drop ALL potentially conflicting ones)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- 3. Apply New, Non-Recursive Policies

-- Policy: Admins can see EVERYTHING (Uses the safe function)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING ( is_admin() );

-- Policy: Users can see their OWN profile (Standard check)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING ( auth.uid() = id );

-- 4. Grant access to the function
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO anon;
