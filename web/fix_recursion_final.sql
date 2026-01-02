-- FIX INFINITE RECURSION IN RLS (Final)
-- Problem: 'course_staff' policy queries itself to check ownership, causing an infinite loop.
-- Solution: Use a SECURITY DEFINER function to check ownership without triggering RLS recursively.

-- 1. Create a Helper Function (Safe Ownership Check)
CREATE OR REPLACE FUNCTION public.check_is_course_owner(target_course_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as database owner, bypassing RLS
SET search_path = public -- Security best practice
AS $$
BEGIN
    -- Direct check, no RLS triggered here
    RETURN EXISTS (
        SELECT 1 
        FROM public.course_staff 
        WHERE course_id = target_course_id 
        AND user_id = auth.uid() 
        AND role = 'owner'
    );
END;
$$;

-- 2. Drop the recursive policy on course_staff
DROP POLICY IF EXISTS "Owners can manage course staff" ON public.course_staff;

-- 3. Re-create the policy using the safe function
CREATE POLICY "Owners can manage course staff"
ON public.course_staff
FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
USING (
    -- Allow access if the user is the owner of the course this staff member belongs to
    check_is_course_owner(course_id)
);

-- 4. OPTIONAL: Fix 'courses' update policy to use the same safe check (Optimization)
DROP POLICY IF EXISTS "Owners can update their courses" ON public.courses;

CREATE POLICY "Owners can update their courses"
ON public.courses
FOR UPDATE
USING (
    check_is_course_owner(id)
);

-- 5. Verification: Ensure simple "View Own" policy exists
DROP POLICY IF EXISTS "Users view own staff roles" ON public.course_staff;
CREATE POLICY "Users view own staff roles"
ON public.course_staff FOR SELECT
USING (user_id = auth.uid());
