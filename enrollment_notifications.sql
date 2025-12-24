-- Database Trigger: Notify instructor when student requests enrollment
-- This creates a notification for the instructor when a student requests to join their course

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
    
    -- Create notification for instructor
    IF NEW.status = 'pending' AND instructor_id_var IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, type, created_at)
        VALUES (
            instructor_id_var,
            'New Enrollment Request',
            student_name || ' has requested to join your course: ' || course_name,
            'enrollment_request',
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS enrollment_request_notification ON enrollments;
CREATE TRIGGER enrollment_request_notification
    AFTER INSERT ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION notify_instructor_on_enrollment_request();

-- Database Trigger: Notify student when enrollment is approved/rejected
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
                'You have been accepted into: ' || course_name || '. You can now access the course content.',
                'enrollment_approved',
                NOW()
            );
        ELSIF NEW.status = 'failed' THEN
            INSERT INTO notifications (user_id, title, message, type, created_at)
            VALUES (
                NEW.user_id,
                'Enrollment Update',
                'Your request to join ' || course_name || ' was not approved.',
                'enrollment_rejected',
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS enrollment_status_notification ON enrollments;
CREATE TRIGGER enrollment_status_notification
    AFTER UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION notify_student_on_enrollment_update();

-- Ensure notifications table exists with correct structure
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Allow inserts from authenticated users (for triggers)
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);
