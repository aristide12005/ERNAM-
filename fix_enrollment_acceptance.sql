-- COMPLETE FIX FOR ENROLLMENT ACCEPTANCE
-- Run this ENTIRE script in Supabase SQL Editor

-- ========================================
-- STEP 1: Add metadata column if not exists
-- ========================================
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ========================================
-- STEP 2: Add UPDATE policy for enrollments
-- ========================================

-- Check existing policies
SELECT policyname FROM pg_policies WHERE tablename = 'enrollments' AND cmd = 'UPDATE';

-- Drop existing update policies if any
DROP POLICY IF EXISTS "Users can update enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Instructors can update enrollments" ON public.enrollments;

-- Create policy allowing instructors to update enrollments for their courses
CREATE POLICY "Instructors can update enrollments"
ON public.enrollments FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM courses
        WHERE courses.id = enrollments.course_id
        AND courses.instructor_id = auth.uid()
    )
);

-- Also allow users to update their own enrollments (optional, for student-initiated withdrawals)
CREATE POLICY "Users can update own enrollments"
ON public.enrollments FOR UPDATE
USING (auth.uid() = user_id);

-- ========================================
-- STEP 3: Update trigger to include metadata
-- ========================================

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
                'user_id', NEW.user_id::text,
                'course_id', NEW.course_id::text,
                'student_name', student_name,
                'course_name', course_name
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS enrollment_request_notification ON enrollments;
CREATE TRIGGER enrollment_request_notification
    AFTER INSERT ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION notify_instructor_on_enrollment_request();

-- ========================================
-- STEP 4: Add metadata to existing notifications
-- ========================================

-- Update existing enrollment_request notifications with metadata
UPDATE notifications n
SET metadata = jsonb_build_object(
    'user_id', e.user_id::text,
    'course_id', e.course_id::text,
    'student_name', p.full_name,
    'course_name', c.title_en
)
FROM enrollments e
JOIN profiles p ON e.user_id = p.id
JOIN courses c ON e.course_id = c.id
WHERE n.type = 'enrollment_request'
AND n.metadata = '{}'::jsonb
AND n.message LIKE '%' || p.full_name || '%'
AND n.message LIKE '%' || c.title_en || '%';

-- ========================================
-- VERIFICATION
-- ========================================

SELECT 'Checking notifications with metadata...' as step;
SELECT 
    id,
    title,
    type,
    is_read,
    metadata,
    created_at
FROM notifications 
WHERE type = 'enrollment_request'
ORDER BY created_at DESC
LIMIT 3;

SELECT 'Checking enrollment UPDATE policies...' as step;
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'enrollments' 
AND cmd = 'UPDATE';

SELECT 'Checking pending enrollments...' as step;
SELECT 
    e.user_id,
    e.course_id,
    e.status,
    p.full_name as student,
    c.title_en as course
FROM enrollments e
LEFT JOIN profiles p ON e.user_id = p.id
LEFT JOIN courses c ON e.course_id = c.id
WHERE e.status = 'pending';

SELECT '✅ SETUP COMPLETE!' as status;
