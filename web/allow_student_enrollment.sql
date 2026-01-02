-- ALLOW STUDENT SELF-ENROLLMENT
-- Problem: 'Join Class' fails because there is no INSERT policy for public.enrollments.
-- Solution: Allow authenticated users to insert rows where user_id matches their own ID.

-- 1. Create the policy
CREATE POLICY "Students can enroll themselves"
ON public.enrollments FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND
    user_id = auth.uid()
);

-- 2. Audit
INSERT INTO public.audit_logs (action, entity, metadata)
VALUES ('UPDATE_RLS', 'enrollments', '{"policy": "Students can enroll themselves", "status": "Added"}');
