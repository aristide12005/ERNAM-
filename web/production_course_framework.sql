-- Production Course Management Framework Migration (v2 - Fixed)
-- Purpose: Implement Layer 1 (Data) and Layer 2 (Security)
-- FIX: Standardizes table names (course_items -> lessons)

-- ============================================================================
-- LAYER 0: SCHEMA STANDARDIZATION (Fixing missing 'lessons' table)
-- ============================================================================

-- 1. Rename 'course_items' to 'lessons' if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'course_items') THEN
    ALTER TABLE public.course_items RENAME TO lessons;
  END IF;
END $$;

-- 2. Ensure 'lessons' table exists (if starting fresh or after rename)
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_type TEXT CHECK (content_type IN ('video', 'pdf', 'quiz', 'text')),
    content_url TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LAYER 1: DATA SCHEMA HARDENING
-- ============================================================================

-- 3. Create `course_staff` table (Decentralized Ownership)
CREATE TABLE IF NOT EXISTS public.course_staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'instructor', 'assistant')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES public.profiles(id),
    UNIQUE(course_id, user_id)
);

-- 4. Create `lesson_progress` table (Granular Tracking)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
    completed_at TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- 5. Data Migration: Move existing instructor_id to course_staff
INSERT INTO public.course_staff (course_id, user_id, role)
SELECT id, instructor_id, 'owner'
FROM public.courses
WHERE instructor_id IS NOT NULL
ON CONFLICT (course_id, user_id) DO NOTHING;

-- 6. Clean up (Optional, commented out for safety)
-- ALTER TABLE public.courses DROP COLUMN IF EXISTS instructor_id; 

-- ============================================================================
-- LAYER 2: SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.course_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Policy: Course Visibility
DROP POLICY IF EXISTS "Unified Course Visibility" ON public.courses;
CREATE POLICY "Unified Course Visibility"
ON public.courses FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.course_staff WHERE course_staff.course_id = courses.id AND course_staff.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.enrollments WHERE enrollments.course_id = courses.id AND enrollments.user_id = auth.uid()) OR
  is_admin() OR
  status = 'active' -- Allow viewing active courses catalog
);

-- Policy: Lesson Visibility (Must be enrolled or staff)
DROP POLICY IF EXISTS "Unified Lesson Visibility" ON public.lessons;
CREATE POLICY "Unified Lesson Visibility"
ON public.lessons FOR SELECT
USING (
  -- Check via module -> course
  EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.courses c ON m.course_id = c.id
    WHERE m.id = lessons.module_id
    AND (
      -- Is Staff
      EXISTS (SELECT 1 FROM public.course_staff cs WHERE cs.course_id = c.id AND cs.user_id = auth.uid())
      OR
      -- Is Enrolled
      EXISTS (SELECT 1 FROM public.enrollments en WHERE en.course_id = c.id AND en.user_id = auth.uid() AND en.status = 'active')
      OR
      is_admin()
    )
  )
);

-- Policy: Lesson Progress
DROP POLICY IF EXISTS "Users view own progress" ON public.lesson_progress;
CREATE POLICY "Users view own progress"
ON public.lesson_progress FOR SELECT
USING ( user_id = auth.uid() OR is_admin() );

-- ============================================================================
-- RPCs
-- ============================================================================

-- RPC: Mark Lesson Completed
CREATE OR REPLACE FUNCTION mark_lesson_completed(p_lesson_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_course_id UUID;
    v_enrollment_status TEXT;
BEGIN
    -- 1. Get Course ID from Lesson
    SELECT m.course_id INTO v_course_id
    FROM public.modules m
    JOIN public.lessons l ON l.module_id = m.id
    WHERE l.id = p_lesson_id;

    IF v_course_id IS NULL THEN
        RAISE EXCEPTION 'Lesson not found';
    END IF;

    -- 2. Validate Enrollment
    SELECT status INTO v_enrollment_status
    FROM public.enrollments
    WHERE course_id = v_course_id AND user_id = auth.uid();

    IF v_enrollment_status IS NULL OR v_enrollment_status != 'active' THEN
        RAISE EXCEPTION 'User is not actively enrolled in this course';
    END IF;

    -- 3. Upsert Progress
    INSERT INTO public.lesson_progress (user_id, lesson_id, status, completed_at)
    VALUES (auth.uid(), p_lesson_id, 'completed', NOW())
    ON CONFLICT (user_id, lesson_id)
    DO UPDATE SET 
        status = 'completed',
        completed_at = NOW(),
        last_updated = NOW();
        
    -- 4. Audit Log
    INSERT INTO public.audit_logs (action, target_resource, actor_id, details)
    VALUES ('LESSON_COMPLETED', p_lesson_id::TEXT, auth.uid(), jsonb_build_object('course_id', v_course_id));
END;
$$;

-- RPC: Get Manageable Courses
CREATE OR REPLACE FUNCTION get_manageable_courses()
RETURNS SETOF public.courses
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.*
  FROM public.courses c
  JOIN public.course_staff cs ON c.id = cs.course_id
  WHERE cs.user_id = auth.uid()
  UNION
  SELECT c.*
  FROM public.courses c
  WHERE is_admin();
$$;
