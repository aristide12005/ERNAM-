-- DIAGNOSTIC: Verify Database State
-- Run this to see what is actually in the database right now.

-- 1. Check if courses exist and their status
SELECT count(*) as total_courses, course_status FROM public.courses GROUP BY course_status;

-- 2. Check a few course IDs and Titles
SELECT id, title_en, course_status FROM public.courses LIMIT 5;

-- 3. Check Policies on courses
SELECT * FROM pg_policies WHERE tablename = 'courses';

-- 4. Check Policies on enrollments
SELECT * FROM pg_policies WHERE tablename = 'enrollments';

-- 5. Check if instructor_id column still exists (should be error or empty)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'courses' AND column_name = 'instructor_id';

-- 6. Check Course Staff
SELECT count(*) as staff_count FROM public.course_staff;
