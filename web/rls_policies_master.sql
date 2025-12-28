-- BUSINESS-READY RLS POLICIES
-- Objective: Strictly enforce access control per the Master JSON Specification.
-- Source of Truth: course_staff table for instructor permissions.

-- ============================================================================
-- 0. CLEANUP - Drop existing policies to make script idempotent
-- ============================================================================
-- Courses
DROP POLICY IF EXISTS "Trainees can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Staff can view their assigned courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can view all courses" ON public.courses;
DROP POLICY IF EXISTS "Owners can update their courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can create courses" ON public.courses;

-- Enrollments
DROP POLICY IF EXISTS "Users view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Staff view course enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins view all enrollments" ON public.enrollments;

-- Course Staff
DROP POLICY IF EXISTS "Users view own staff roles" ON public.course_staff;
DROP POLICY IF EXISTS "Admins view all staff" ON public.course_staff;
DROP POLICY IF EXISTS "Owners can manage course staff" ON public.course_staff;

-- Modules
DROP POLICY IF EXISTS "Trainees view published modules" ON public.modules;
DROP POLICY IF EXISTS "Staff view all modules in their courses" ON public.modules;
DROP POLICY IF EXISTS "Admins view all modules" ON public.modules;

-- Lessons
DROP POLICY IF EXISTS "Trainees view published lessons" ON public.lessons;
DROP POLICY IF EXISTS "Staff view all lessons in their courses" ON public.lessons;
DROP POLICY IF EXISTS "Admins view all lessons" ON public.lessons;

-- Lesson Progress
DROP POLICY IF EXISTS "Users view own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Staff view student progress" ON public.lesson_progress;

-- Certificates
DROP POLICY IF EXISTS "Users view own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Staff view course certificates" ON public.certificates;
DROP POLICY IF EXISTS "Admins view all certificates" ON public.certificates;

-- Audit Logs
DROP POLICY IF EXISTS "Admins view audit logs" ON public.audit_logs;

-- ============================================================================
-- 1. COURSES - Visibility & Management
-- ============================================================================
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Trainees: Can read published courses
CREATE POLICY "Trainees can view published courses"
ON public.courses FOR SELECT
USING (
    course_status = 'published'
    AND auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'trainee')
);

-- Staff: Can view courses they are assigned to (any status)
CREATE POLICY "Staff can view their assigned courses"
ON public.courses FOR SELECT
USING (
    id IN (SELECT course_id FROM public.course_staff WHERE user_id = auth.uid())
);

-- Admins: Can view all courses
CREATE POLICY "Admins can view all courses"
ON public.courses FOR SELECT
USING (
    is_admin()
);

-- Owners: Can update their owned courses
CREATE POLICY "Owners can update their courses"
ON public.courses FOR UPDATE
USING (
    id IN (
        SELECT course_id FROM public.course_staff 
        WHERE user_id = auth.uid() AND role = 'owner'
    )
);

-- Admins: Can create courses
CREATE POLICY "Admins can create courses"
ON public.courses FOR INSERT
WITH CHECK (is_admin());


-- ============================================================================
-- 2. ENROLLMENTS - Access Contract
-- ============================================================================
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Users see their own enrollments
CREATE POLICY "Users view own enrollments"
ON public.enrollments FOR SELECT
USING (user_id = auth.uid());

-- Staff see enrollments for courses they manage
CREATE POLICY "Staff view course enrollments"
ON public.enrollments FOR SELECT
USING (
    course_id IN (SELECT course_id FROM public.course_staff WHERE user_id = auth.uid())
);

-- Admins see all enrollments
CREATE POLICY "Admins view all enrollments"
ON public.enrollments FOR SELECT
USING (is_admin());


-- ============================================================================
-- 3. COURSE_STAFF - Teaching Authority
-- ============================================================================
ALTER TABLE public.course_staff ENABLE ROW LEVEL SECURITY;

-- Users see their own assignments
CREATE POLICY "Users view own staff roles"
ON public.course_staff FOR SELECT
USING (user_id = auth.uid());

-- Admins see all staff assignments
CREATE POLICY "Admins view all staff"
ON public.course_staff FOR SELECT
USING (is_admin());

-- Owners can assign staff to their courses
CREATE POLICY "Owners can manage course staff"
ON public.course_staff FOR ALL
USING (
    course_id IN (
        SELECT course_id FROM public.course_staff 
        WHERE user_id = auth.uid() AND role = 'owner'
    )
);


-- ============================================================================
-- 4. MODULES & LESSONS - Content Structure
-- ============================================================================
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Trainees: Published modules in published courses they're enrolled in
CREATE POLICY "Trainees view published modules"
ON public.modules FOR SELECT
USING (
    status = 'published'
    AND course_id IN (
        SELECT course_id FROM public.enrollments 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- Staff: All modules in their courses
CREATE POLICY "Staff view all modules in their courses"
ON public.modules FOR SELECT
USING (
    course_id IN (SELECT course_id FROM public.course_staff WHERE user_id = auth.uid())
);

-- Admins: All modules
CREATE POLICY "Admins view all modules"
ON public.modules FOR SELECT
USING (is_admin());


ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Trainees: Published lessons
CREATE POLICY "Trainees view published lessons"
ON public.lessons FOR SELECT
USING (
    status = 'published'
    AND module_id IN (
        SELECT m.id FROM public.modules m
        JOIN public.enrollments e ON e.course_id = m.course_id
        WHERE e.user_id = auth.uid() AND e.status = 'active'
    )
);

-- Staff: All lessons in their courses
CREATE POLICY "Staff view all lessons in their courses"
ON public.lessons FOR SELECT
USING (
    module_id IN (
        SELECT m.id FROM public.modules m
        WHERE m.course_id IN (SELECT course_id FROM public.course_staff WHERE user_id = auth.uid())
    )
);

-- Admins: All lessons
CREATE POLICY "Admins view all lessons"
ON public.lessons FOR SELECT
USING (is_admin());


-- ============================================================================
-- 5. LESSON_PROGRESS - Ground Truth for Completion
-- ============================================================================
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Users see their own progress
CREATE POLICY "Users view own progress"
ON public.lesson_progress FOR SELECT
USING (user_id = auth.uid());

-- Staff see progress for their courses
CREATE POLICY "Staff view student progress"
ON public.lesson_progress FOR SELECT
USING (
    lesson_id IN (
        SELECT l.id FROM public.lessons l
        JOIN public.modules m ON l.module_id = m.id
        WHERE m.course_id IN (SELECT course_id FROM public.course_staff WHERE user_id = auth.uid())
    )
);

-- NOTE: No direct INSERT/UPDATE allowed. Must use RPC.


-- ============================================================================
-- 6. CERTIFICATES - Formal Credentials
-- ============================================================================
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Users see their own certificates
CREATE POLICY "Users view own certificates"
ON public.certificates FOR SELECT
USING (user_id = auth.uid());

-- Staff see certificates for their students
CREATE POLICY "Staff view course certificates"
ON public.certificates FOR SELECT
USING (
    course_id IN (SELECT course_id FROM public.course_staff WHERE user_id = auth.uid())
);

-- Admins see all certificates
CREATE POLICY "Admins view all certificates"
ON public.certificates FOR SELECT
USING (is_admin());


-- ============================================================================
-- 7. AUDIT_LOGS - Accountability
-- ============================================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins have read-only access
CREATE POLICY "Admins view audit logs"
ON public.audit_logs FOR SELECT
USING (is_admin());
