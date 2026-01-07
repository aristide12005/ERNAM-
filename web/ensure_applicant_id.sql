-- Ensure applicant_user_id column exists
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS applicant_user_id UUID REFERENCES auth.users(id);

-- Ensure RLS allows users to insert their own ID
-- This is implicit if the Policy allows INSERT by authenticated, but they must set the column to their own ID.
-- We can enforce it via a TRIGGER or just rely on RLS logic "WITH CHECK (applicant_user_id = auth.uid())" if that policy exists.
-- For now, just ensuring the column allows the code to run.
