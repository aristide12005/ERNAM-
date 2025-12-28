-- EMERGENCY CLEANUP: REMOVE ALL INSTRUCTOR_ID REFERENCES
-- This script force-cleans the database of any lingering usage of the deleted column.

-- 1. DROP BAD POLICIES on COURSES (That might reference instructor_id)
DROP POLICY IF EXISTS "Unified Course Visibility" ON public.courses;
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
DROP POLICY IF EXISTS "Owners can update course" ON public.courses;
DROP POLICY IF EXISTS "Owners can update their courses" ON public.courses;
DROP POLICY IF EXISTS "Owners can update courses" ON public.courses; -- The bad one
DROP POLICY IF EXISTS "Instructors can view their own courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Trainers can update courses" ON public.courses;

-- 2. DROP BAD POLICIES on ENROLLMENTS
DROP POLICY IF EXISTS "Users can read own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can create own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Enrollments details are viewable" ON public.enrollments;
DROP POLICY IF EXISTS "Unified Enrollment Visibility" ON public.enrollments;

-- 3. ENSURE COLUMN IS GONE (CASCADE to kill dependent views/policies)
ALTER TABLE public.courses DROP COLUMN IF EXISTS instructor_id CASCADE;

-- 4. RE-APPLY CLEAN POLICIES (Simple, Non-Recursive)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- COURSES: Everyone can read
CREATE POLICY "Public Read Access"
ON public.courses FOR SELECT
USING (true);

-- COURSES: Admins/Trainers can Update/Insert
CREATE POLICY "Admin/Trainer Update Access"
ON public.courses FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'trainer')
  )
);

CREATE POLICY "Admin/Trainer Insert Access"
ON public.courses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'trainer')
  )
);

-- ENROLLMENTS: Users can read/create their own
CREATE POLICY "User Read Own Enrollments"
ON public.enrollments FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "User Create Own Enrollments"
ON public.enrollments FOR INSERT
WITH CHECK (user_id = auth.uid());

-- ENROLLMENTS: Staff can view all
CREATE POLICY "Staff View All Enrollments"
ON public.enrollments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'trainer')
  )
);

-- 5. CLEANUP TRIGGERS (Guessing common names)
DROP TRIGGER IF EXISTS on_enrollment_notify_instructor ON public.enrollments;
-- Also drop the function if it exists
DROP FUNCTION IF EXISTS notify_instructor_of_enrollment();
