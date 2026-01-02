-- ========================================
-- ADD METADATA TO NOTIFICATIONS
-- This allows notifications to carry context for actions
-- ========================================

-- 1. Add metadata column to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Update the enrollment request notification function to include metadata
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
        INSERT INTO notifications (user_id, title, message, type, metadata, created_at)
        VALUES (
            instructor_id_var,
            'New Enrollment Request',
            student_name || ' has requested to join your course: ' || COALESCE(course_name, 'Unknown Course'),
            'enrollment_request',
            jsonb_build_object(
                'enrollment_id', NEW.user_id || '_' || NEW.course_id,
                'user_id', NEW.user_id,
                'course_id', NEW.course_id,
                'student_name', student_name,
                'course_name', course_name
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recreate the trigger (it will use the updated function)
DROP TRIGGER IF EXISTS enrollment_request_notification ON enrollments;
CREATE TRIGGER enrollment_request_notification
    AFTER INSERT ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION notify_instructor_on_enrollment_request();

-- ========================================
-- VERIFICATION
-- ========================================
SELECT 'Metadata column added to notifications' as status;
SELECT 'Trigger updated to include enrollment metadata' as status;
