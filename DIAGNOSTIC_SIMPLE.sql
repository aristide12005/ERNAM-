-- SIMPLE DIAGNOSTIC - Works with all PostgreSQL versions
-- Run this in Supabase SQL Editor

-- ==========================================
-- 1. CHECK MESSAGES TABLE
-- ==========================================
SELECT '=== MESSAGES TABLE ===' as step;

SELECT 
    COUNT(*) as total_messages,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as messages_last_hour
FROM public.messages;

-- ==========================================
-- 2. CHECK MESSAGES POLICIES (Simplified)
-- ==========================================
SELECT '=== MESSAGES POLICIES ===' as step;

SELECT 
    policyname,
    cmd as operation
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY cmd, policyname;

-- ==========================================
-- 3. CHECK ENROLLMENTS
-- ==========================================
SELECT '=== ENROLLMENTS BY STATUS ===' as step;

SELECT 
    status,
    COUNT(*) as count
FROM public.enrollments
GROUP BY status
ORDER BY count DESC;

-- ==========================================
-- 4. CHECK USERS
-- ==========================================
SELECT '=== USERS LIST ===' as step;

SELECT 
    p.id,
    p.full_name,
    p.role,
    p.status,
    (SELECT COUNT(*) FROM public.enrollments WHERE user_id = p.id) as enrollments
FROM public.profiles p
ORDER BY p.created_at DESC
LIMIT 10;

-- ==========================================
-- 5. CHECK NOTIFICATIONS
-- ==========================================
SELECT '=== NOTIFICATIONS ===' as step;

SELECT 
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 1 END) as today
FROM public.notifications;

-- ==========================================
-- 6. CHECK RECENT MESSAGES
-- ==========================================
SELECT '=== RECENT MESSAGES ===' as step;

SELECT 
    id,
    sender_id,
    receiver_id,
    LEFT(content, 50) as message_preview,
    created_at
FROM public.messages
ORDER BY created_at DESC
LIMIT 5;

-- ==========================================
-- 7. CHECK RECENT ENROLLMENTS
-- ==========================================
SELECT '=== RECENT ENROLLMENTS ===' as step;

SELECT 
    e.id,
    e.status,
    s.full_name as student_name,
    c.title_en as course_title,
    e.created_at
FROM public.enrollments e
JOIN public.profiles s ON e.user_id = s.id
LEFT JOIN public.courses c ON e.course_id = c.id
ORDER BY e.created_at DESC
LIMIT 5;

-- ==========================================
-- 8. CHECK REALTIME
-- ==========================================
SELECT '=== REALTIME TABLES ===' as step;

SELECT 
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('messages', 'enrollments', 'notifications')
ORDER BY tablename;

-- ==========================================
-- 9. CHECK RLS ENABLED
-- ==========================================
SELECT '=== RLS STATUS ===' as step;

SELECT 
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables
WHERE tablename IN ('messages', 'enrollments', 'notifications', 'profiles')
AND schemaname = 'public'
ORDER BY tablename;

-- ==========================================
-- DONE
-- ==========================================
SELECT '=== DIAGNOSTIC COMPLETE ===' as status;
