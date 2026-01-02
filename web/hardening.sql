-- DATABASE HARDENING & LOOPHOLE FIXES
-- Purpose: Fix security gaps and constraints analysis.

-- 1. FIX: "Instructor Impersonation" Loophole
-- Prevent assigning a user as 'instructor' or 'owner' in course_staff unless they have 'trainer' or 'admin' role in profiles.

CREATE OR REPLACE FUNCTION public.check_course_staff_role()
RETURNS TRIGGER AS $$
DECLARE
    user_role text;
BEGIN
    -- Get the role of the user being assigned
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- If the assigned role in course_staff is instructor/owner, existing user MUST be trainer/admin
    IF (NEW.role IN ('instructor', 'owner')) AND (user_role NOT IN ('trainer', 'admin')) THEN
        RAISE EXCEPTION 'Security Violation: User % is a % and cannot be assigned as %.', NEW.user_id, user_role, NEW.role;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_staff_is_qualified ON public.course_staff;
CREATE TRIGGER ensure_staff_is_qualified
    BEFORE INSERT OR UPDATE ON public.course_staff
    FOR EACH ROW
    EXECUTE FUNCTION public.check_course_staff_role();


-- 2. FIX: "Anonymous Uploader" Issue
-- Add attribution to course materials to track who uploaded what.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='course_materials' AND column_name='uploaded_by') THEN
        ALTER TABLE public.course_materials 
        ADD COLUMN uploaded_by UUID REFERENCES public.profiles(id) DEFAULT auth.uid();
    END IF;
END $$;


-- 3. FIX: "Un-Deletable User" (Foreign Key Deadlocks) & Standardize on PROFILES
-- Change strict constraints to CASCADE and point to public.profiles as requested.

-- Flight Logs
ALTER TABLE public.flight_logs DROP CONSTRAINT IF EXISTS flight_logs_trainee_id_fkey;
ALTER TABLE public.flight_logs 
    ADD CONSTRAINT flight_logs_trainee_id_fkey 
    FOREIGN KEY (trainee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Attendance
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_trainee_id_fkey;
ALTER TABLE public.attendance 
    ADD CONSTRAINT attendance_trainee_id_fkey 
    FOREIGN KEY (trainee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Marks
ALTER TABLE public.marks DROP CONSTRAINT IF EXISTS marks_student_id_fkey;
ALTER TABLE public.marks 
    ADD CONSTRAINT marks_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Submissions
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_student_id_fkey;
ALTER TABLE public.submissions 
    ADD CONSTRAINT submissions_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Certificates
ALTER TABLE public.certificates DROP CONSTRAINT IF EXISTS certificates_user_id_fkey;
ALTER TABLE public.certificates 
    ADD CONSTRAINT certificates_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Personal Todos
ALTER TABLE public.personal_todos DROP CONSTRAINT IF EXISTS personal_todos_user_id_fkey;
ALTER TABLE public.personal_todos 
    ADD CONSTRAINT personal_todos_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Course Comments
ALTER TABLE public.course_comments DROP CONSTRAINT IF EXISTS course_comments_user_id_fkey;
ALTER TABLE public.course_comments 
    ADD CONSTRAINT course_comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Enrollment Requests
ALTER TABLE public.enrollment_requests DROP CONSTRAINT IF EXISTS enrollment_requests_requester_id_fkey;
ALTER TABLE public.enrollment_requests 
    ADD CONSTRAINT enrollment_requests_requester_id_fkey 
    FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Enrollments
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_user_id_fkey;
ALTER TABLE public.enrollments 
    ADD CONSTRAINT enrollments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


-- 4. CLEANUP: Deprecated Tables Warning
-- We add a comment to the 'users' table to warn developers not to use it.
COMMENT ON TABLE public.users IS 'DEPRECATED: Do not use. Use public.profiles for data and auth.users for identity.';
