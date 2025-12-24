-- ========================================
-- SAFE COMPREHENSIVE FIX - Handles existing items
-- Run this ENTIRE script in Supabase SQL Editor
-- ========================================

-- ===========================================
-- PART 1: FIX ENROLLMENT NOTIFICATIONS
-- ===========================================

-- 1.1: Ensure notifications table exists with correct structure
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2: Remove type constraint (if exists)
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 1.3: Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1.4: Drop and recreate notification policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" 
    ON public.notifications FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Users can update own notifications" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = user_id);

-- 1.5: Create trigger function for enrollment requests
CREATE OR REPLACE FUNCTION notify_instructor_on_enrollment_request()
RETURNS TRIGGER AS $$
DECLARE
    instructor_id_var UUID;
    student_name TEXT;
    course_name TEXT;
BEGIN
    SELECT instructor_id, title_en INTO instructor_id_var, course_name
    FROM courses WHERE id = NEW.course_id;
    
    SELECT full_name INTO student_name
    FROM profiles WHERE id = NEW.user_id;
    
    IF NEW.status = 'pending' AND instructor_id_var IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, type, created_at)
        VALUES (
            instructor_id_var,
            'New Enrollment Request',
            student_name || ' has requested to join your course: ' || COALESCE(course_name, 'Unknown Course'),
            'enrollment_request',
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1.6: Create trigger function for enrollment status updates
CREATE OR REPLACE FUNCTION notify_student_on_enrollment_update()
RETURNS TRIGGER AS $$
DECLARE
    course_name TEXT;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        SELECT title_en INTO course_name FROM courses WHERE id = NEW.course_id;
        
        IF NEW.status = 'active' THEN
            INSERT INTO notifications (user_id, title, message, type, created_at)
            VALUES (
                NEW.user_id,
                'Enrollment Approved',
                'You have been accepted into: ' || COALESCE(course_name, 'Unknown Course'),
                'enrollment_approved',
                NOW()
            );
        ELSIF NEW.status = 'failed' THEN
            INSERT INTO notifications (user_id, title, message, type, created_at)
            VALUES (
                NEW.user_id,
                'Enrollment Update',
                'Your request to join ' || COALESCE(course_name, 'Unknown Course') || ' was not approved.',
                'enrollment_rejected',
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1.7: Drop existing triggers
DROP TRIGGER IF EXISTS enrollment_request_notification ON enrollments;
DROP TRIGGER IF EXISTS enrollment_status_notification ON enrollments;

-- 1.8: Create triggers
CREATE TRIGGER enrollment_request_notification
    AFTER INSERT ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION notify_instructor_on_enrollment_request();

CREATE TRIGGER enrollment_status_notification
    AFTER UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION notify_student_on_enrollment_update();

-- 1.9: Create notification for EXISTING pending enrollment (with duplicate check)
INSERT INTO notifications (user_id, title, message, type, created_at)
SELECT 
    c.instructor_id,
    'Pending Enrollment Request',
    p.full_name || ' is waiting for approval to join: ' || c.title_en,
    'enrollment_request',
    NOW()
FROM enrollments e
JOIN profiles p ON e.user_id = p.id
JOIN courses c ON e.course_id = c.id
WHERE e.status = 'pending' 
AND c.instructor_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM notifications n 
    WHERE n.user_id = c.instructor_id 
    AND n.type = 'enrollment_request'
    AND n.created_at > NOW() - INTERVAL '1 hour'
);

-- ===========================================
-- PART 2: FIX MESSAGING RLS POLICIES
-- ===========================================

-- 2.1: Drop all existing message policies
DROP POLICY IF EXISTS "Users can view sent messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view private received messages" ON public.messages;
DROP POLICY IF EXISTS "Trainees can view course broadcasts" ON public.messages;
DROP POLICY IF EXISTS "Trainers can view course-related messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all communications" ON public.messages;
DROP POLICY IF EXISTS "Anyone can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages" ON public.messages;

-- 2.2: Create simple, working policies
CREATE POLICY "Users can view sent messages" 
    ON public.messages FOR SELECT 
    USING (auth.uid() = sender_id);

CREATE POLICY "Users can view received messages" 
    ON public.messages FOR SELECT 
    USING (auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" 
    ON public.messages FOR INSERT 
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages" 
    ON public.messages FOR UPDATE 
    USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- ===========================================
-- PART 3: ENABLE REALTIME (SAFELY)
-- ===========================================

-- Add to realtime publication if not already there
DO $$
BEGIN
    -- Try to add messages
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN
        -- Already exists, ignore
    END;
    
    -- Try to add enrollments
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enrollments;
    EXCEPTION WHEN duplicate_object THEN
        -- Already exists, ignore
    END;
    
    -- Try to add notifications
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN
        -- Already exists, ignore
    END;
END $$;

-- ===========================================
-- VERIFICATION
-- ===========================================

SELECT '========================================' as status;
SELECT 'ENROLLMENT TRIGGERS:' as check_item, COUNT(*)::text as count
FROM information_schema.triggers
WHERE event_object_table = 'enrollments'
UNION ALL
SELECT 'MESSAGE POLICIES:', COUNT(*)::text
FROM pg_policies WHERE tablename = 'messages'
UNION ALL
SELECT 'NOTIFICATION POLICIES:', COUNT(*)::text
FROM pg_policies WHERE tablename = 'notifications'
UNION ALL
SELECT 'REALTIME TABLES:', COUNT(*)::text
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('messages', 'enrollments', 'notifications');

SELECT '========================================' as status;
SELECT '✅ ALL FIXES APPLIED SUCCESSFULLY!' as status;
SELECT '========================================' as status;
