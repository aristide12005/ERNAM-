-- COMPREHENSIVE DIAGNOSTIC - Run this to check EVERYTHING
-- Copy all results and share them for troubleshooting

-- ==========================================
-- 1. CHECK MESSAGES TABLE
-- ==========================================
SELECT 'MESSAGES TABLE CHECK' as diagnostic_step;

SELECT 
    COUNT(*) as total_messages,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as messages_last_hour
FROM public.messages;

-- ==========================================
-- 2. CHECK MESSAGES RLS POLICIES
-- ==========================================
SELECT 'MESSAGES RLS POLICIES' as diagnostic_step;

SELECT 
    policyname,
    cmd as operation,
    pg_get_expr(qual, 'public.messages'::regclass) as condition
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY cmd, policyname;

-- ==========================================
-- 3. CHECK ENROLLMENTS TABLE
-- ==========================================
SELECT 'ENROLLMENTS CHECK' as diagnostic_step;

SELECT 
    status,
    COUNT(*) as count
FROM public.enrollments
GROUP BY status;

-- ==========================================
-- 4. CHECK NOTIFICATIONS TABLE
-- ==========================================
SELECT 'NOTIFICATIONS CHECK' as diagnostic_step;

SELECT 
    type,
    COUNT(*) as count,
    COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread
FROM public.notifications
GROUP BY type;

-- ==========================================
-- 5. LIST ALL USERS
-- ==========================================
SELECT 'USERS LIST' as diagnostic_step;

SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.status,
    (SELECT COUNT(*) FROM public.enrollments WHERE user_id = p.id) as enrollment_count
FROM public.profiles p
ORDER BY p.created_at DESC
LIMIT 10;

-- ==========================================
-- 6. CHECK ENROLLMENT TRIGGERS
-- ==========================================
SELECT 'ENROLLMENT TRIGGERS' as diagnostic_step;

SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('enrollments', 'notifications')
ORDER BY trigger_name;

-- ==========================================
-- 7. TEST MESSAGE INSERT (AS CURRENT USER)
-- ==========================================
SELECT 'MESSAGE INSERT TEST' as diagnostic_step;

-- Get two user IDs for testing
WITH user_ids AS (
    SELECT id FROM profiles ORDER BY created_at LIMIT 2
)
SELECT 
    (SELECT id FROM user_ids LIMIT 1 OFFSET 0) as user1_id,
    (SELECT id FROM user_ids LIMIT 1 OFFSET 1) as user2_id;

-- To actually test insert, uncomment and replace IDs:
/*
INSERT INTO public.messages (sender_id, receiver_id, content, title)
VALUES (
    'REPLACE_WITH_USER1_ID',
    'REPLACE_WITH_USER2_ID',
    'Diagnostic test message - ' || NOW()::text,
    'Test'
)
RETURNING id, sender_id, receiver_id, content, created_at;
*/

-- ==========================================
-- 8. CHECK REALTIME STATUS
-- ==========================================
SELECT 'REALTIME STATUS' as diagnostic_step;

SELECT 
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('messages', 'enrollments', 'notifications', 'profiles');

-- ==========================================
-- 9. RECENT ENROLLMENTS WITH DETAILS
-- ==========================================
SELECT 'RECENT ENROLLMENTS' as diagnostic_step;

SELECT 
    e.id,
    e.status,
    e.created_at,
    s.full_name as student_name,
    s.role as student_role,
    c.title_en as course_title,
    c.instructor_id as instructor_id
FROM public.enrollments e
JOIN public.profiles s ON e.user_id = s.id
LEFT JOIN public.courses c ON e.course_id = c.id
ORDER BY e.created_at DESC
LIMIT 10;

-- ==========================================
-- 10. CHECK IF RLS IS BLOCKING MESSAGES
-- ==========================================
SELECT 'RLS BLOCKING CHECK' as diagnostic_step;

-- This will show if RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('messages', 'enrollments', 'notifications')
AND schemaname = 'public';

-- ==========================================
--  RESULTS SUMMARY
-- ==========================================
SELECT '========== DIAGNOSTIC COMPLETE ==========' as status;
SELECT 'Review all results above and report any errors or unexpected values' as next_step;
