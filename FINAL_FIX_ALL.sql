-- ========================================
-- COMPREHENSIVE FIX - ALL THREE ISSUES
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

-- 1.2: Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1.3: Drop and recreate notification policies
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

-- 1.4: Create trigger function for enrollment requests
CREATE OR REPLACE FUNCTION notify_instructor_on_enrollment_request()
RETURNS TRIGGER AS $$
DECLARE
    instructor_id_var UUID;
    student_name TEXT;
    course_name TEXT;
BEGIN
    -- Get instructor ID and course name
    SELECT instructor_id, title_en INTO instructor_id_var, course_name
    FROM courses
    WHERE id = NEW.course_id;
    
    -- Get student name
    SELECT full_name INTO student_name
    FROM profiles
    WHERE id = NEW.user_id;
    
    -- Create notification for instructor when status is pending
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

-- 1.5: Create trigger function for enrollment status updates
CREATE OR REPLACE FUNCTION notify_student_on_enrollment_update()
RETURNS TRIGGER AS $$
DECLARE
    course_name TEXT;
BEGIN
    -- Only notify on status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Get course name
        SELECT title_en INTO course_name
        FROM courses
        WHERE id = NEW.course_id;
        
        -- Notify student based on new status
        IF NEW.status = 'active' THEN
            INSERT INTO notifications (user_id, title, message, type, created_at)
            VALUES (
                NEW.user_id,
                'Enrollment Approved! 🎉',
                'You have been accepted into: ' || COALESCE(course_name, 'Unknown Course') || '. You can now access the course content.',
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

-- 1.6: Drop existing triggers if they exist
DROP TRIGGER IF EXISTS enrollment_request_notification ON enrollments;
DROP TRIGGER IF EXISTS enrollment_status_notification ON enrollments;

-- 1.7: Create triggers
CREATE TRIGGER enrollment_request_notification
    AFTER INSERT ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION notify_instructor_on_enrollment_request();

CREATE TRIGGER enrollment_status_notification
    AFTER UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION notify_student_on_enrollment_update();

-- 1.8: Create notification for EXISTING pending enrollment
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
    AND n.message LIKE '%' || p.full_name || '%'
    AND n.created_at > NOW() - INTERVAL '1 day'
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

-- 2.3: Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.enrollments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ===========================================
-- PART 3: VERIFICATION QUERIES
-- ===========================================

-- 3.1: Check notifications created
SELECT 'NOTIFICATIONS CREATED:' as status;
SELECT COUNT(*) as notification_count FROM notifications WHERE created_at > NOW() - INTERVAL '1 minute';

-- 3.2: Check triggers exist
SELECT 'TRIGGERS CREATED:' as status;
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'enrollments'
ORDER BY trigger_name;

-- 3.3: Check message policies
SELECT 'MESSAGE POLICIES:' as status;
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'messages'
ORDER BY policyname;

-- 3.4: Check realtime enabled
SELECT 'REALTIME ENABLED FOR:' as status;
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('messages', 'enrollments', 'notifications')
ORDER BY tablename;

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================
SELECT '========================================' as status;
SELECT 'ALL DATABASE FIXES APPLIED SUCCESSFULLY!' as status;
SELECT '========================================' as status;
SELECT 'Next: Test in browser' as next_step;
