-- QUICK FIX: Allow users to read their own enrollments
-- This is essential for the "My Learning" page to work

-- Enable RLS on enrollments if not already enabled
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the user enrollment read policy
DROP POLICY IF EXISTS "Users can read own enrollments" ON public.enrollments;

CREATE POLICY "Users can read own enrollments"
ON public.enrollments FOR SELECT
USING (user_id = auth.uid());

-- Also allow users to insert their own enrollments (for enrollment requests)
DROP POLICY IF EXISTS "Users can create own enrollments" ON public.enrollments;

CREATE POLICY "Users can create own enrollments"
ON public.enrollments FOR INSERT
WITH CHECK (user_id = auth.uid());
