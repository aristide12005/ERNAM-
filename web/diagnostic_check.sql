-- DIAGNOSTIC SCRIPT: Run this to check database state
-- Copy the results and share them to debug issues

-- 1. Check if any courses exist
SELECT 
    'COURSES' as table_name,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE course_status = 'draft') as draft_count,
    COUNT(*) FILTER (WHERE course_status = 'published') as published_count
FROM public.courses;

-- 2. Check if course_staff entries are being created
SELECT 
    'COURSE_STAFF' as table_name,
    COUNT(*) as total_assignments,
    COUNT(DISTINCT course_id) as courses_with_staff,
    COUNT(DISTINCT user_id) as unique_users
FROM public.course_staff;

-- 3. Check if enrollments exist
SELECT 
    'ENROLLMENTS' as table_name,
    COUNT(*) as total_enrollments,
    COUNT(*) FILTER (WHERE status = 'active') as active_enrollments
FROM public.enrollments;

-- 4. List all courses with their staff
SELECT 
    c.id,
    c.title_en,
    c.course_status,
    cs.role as staff_role,
    cs.user_id as staff_user_id
FROM public.courses c
LEFT JOIN public.course_staff cs ON cs.course_id = c.id
ORDER BY c.created_at DESC
LIMIT 10;

-- 5. Check RLS policies on courses table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'courses'
ORDER BY policyname;
