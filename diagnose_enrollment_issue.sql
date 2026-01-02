-- DIAGNOSTIC QUERY FOR ENROLLMENT ACCEPTANCE ISSUES
-- Run this in Supabase SQL Editor to diagnose the problem

-- 1. Check if metadata column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name = 'metadata';

-- 2. Check notifications table structure
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check enrollments table structure and primary key
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'enrollments'
AND tc.constraint_type = 'PRIMARY KEY';

-- 4. Check current enrollments
SELECT 
    e.*,
    p.full_name as student_name,
    c.title_en as course_title
FROM enrollments e
LEFT JOIN profiles p ON e.user_id = p.id
LEFT JOIN courses c ON e.course_id = c.id
WHERE e.status = 'pending'
ORDER BY e.created_at DESC;

-- 5. Check RLS policies on enrollments
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'enrollments';

-- 6. Test if enrollments table has an 'id' column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'enrollments'
ORDER BY ordinal_position;
