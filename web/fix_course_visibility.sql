-- QUICK FIX: Ensure published courses are visible to all authenticated users

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read published courses
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;

CREATE POLICY "Anyone can view published courses"
ON public.courses FOR SELECT
USING (course_status = 'published' OR auth.uid() IS NOT NULL);

-- This makes all published courses visible to everyone
-- and all courses visible to authenticated users (for staff/admin to manage)
