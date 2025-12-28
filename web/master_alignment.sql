-- MASTER ALIGNMENT SCRIPT
-- Objective: Align existing schema with the "Business-Ready" JSON Specification.
-- strict_mode: true

-- 1. ENUMS (Standardizing Statuses)
-- ============================================================================
-- Create types if they don't exist, or alter them if needed.
DO $$ BEGIN
    CREATE TYPE public.course_status_new AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.module_status_new AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.lesson_status_new AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.content_type_new AS ENUM ('video', 'text', 'quiz');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. COURSES ALIGNMENT
-- ============================================================================
-- JSON Spec: id, title_en, title_fr, description, course_status, thumbnail_url, created_at
-- Current DB: Has these, but need to check 'status' enum alignment.

ALTER TABLE public.courses 
DROP COLUMN IF EXISTS instructor_id CASCADE; -- Rule: "No instructor_id stored here"
-- Note: CASCADE will automatically DROP the old policies referencing this column.
-- This is desired behavior as we will replace them with new course_staff based policies later.

-- Explicitly drop known specific policies just in case CASCADE is too aggressive or we want clarity
DROP POLICY IF EXISTS "Unified Course Visibility" ON public.courses; -- The blocker!
DROP POLICY IF EXISTS "Instructors manage enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Instructors view enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Instructor can manage own materials" ON public.course_materials;
DROP POLICY IF EXISTS "Anyone enrolled can view comments" ON public.course_comments;
DROP POLICY IF EXISTS "Anyone enrolled can post comments" ON public.course_comments;
DROP POLICY IF EXISTS "Trainers can manage own courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can update enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Owners can update courses" ON public.courses;


-- Fix for default value casting
ALTER TABLE public.courses ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.courses
ALTER COLUMN status TYPE course_status_new 
USING (
  CASE 
    WHEN status::text = 'upcoming' THEN 'draft'::course_status_new
    WHEN status::text = 'active' THEN 'published'::course_status_new
    WHEN status::text = 'published' THEN 'published'::course_status_new
    WHEN status::text = 'archived' THEN 'archived'::course_status_new
    ELSE 'draft'::course_status_new
  END
); 

ALTER TABLE public.courses ALTER COLUMN status SET DEFAULT 'draft'::course_status_new;

-- Rename 'status' to 'course_status' if specific field name is required, 
-- but 'status' is standard. JSON says "course_status", let's rename for strict compliance.
ALTER TABLE public.courses RENAME COLUMN status TO course_status;


-- 3. MODULES ALIGNMENT
-- ============================================================================
-- JSON Spec: id, course_id, title, order_index, status
-- Current DB: has 'is_published' boolean.

ALTER TABLE public.modules 
ADD COLUMN IF NOT EXISTS status module_status_new DEFAULT 'draft';

-- Migrate logic: is_published=true -> 'published'
UPDATE public.modules SET status = 'published' WHERE is_published = true;
UPDATE public.modules SET status = 'draft' WHERE is_published = false;

ALTER TABLE public.modules DROP COLUMN IF EXISTS is_published;
ALTER TABLE public.modules RENAME COLUMN sort_order TO order_index;


-- 4. LESSONS ALIGNMENT
-- ============================================================================
-- JSON Spec: id, module_id, title, content_type, content_source, order_index, status
-- Current DB: content_url -> content_source, sort_order -> order_index. Missing status.

ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS status lesson_status_new DEFAULT 'draft';

ALTER TABLE public.lessons RENAME COLUMN content_url TO content_source;
ALTER TABLE public.lessons RENAME COLUMN sort_order TO order_index;

-- Drop ALL CHECK constraints on lessons table before enum conversion
-- The enum type itself will enforce valid values
DO $$ 
DECLARE 
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.lessons'::regclass 
        AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_record.conname);
    END LOOP;
END $$;

-- Ensure content_type uses the Enum
ALTER TABLE public.lessons ALTER COLUMN content_type DROP DEFAULT;

ALTER TABLE public.lessons
ALTER COLUMN content_type TYPE content_type_new 
USING content_type::text::content_type_new;

ALTER TABLE public.lessons ALTER COLUMN content_type SET DEFAULT 'text'::content_type_new;


-- 5. NEW TABLES (Gaps Filled)
-- ============================================================================

-- QUIZ QUESTIONS
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.lessons(id),
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings or objects
    correct_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- QUIZ SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    lesson_id UUID NOT NULL REFERENCES public.lessons(id),
    score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- CERTIFICATES
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    course_id UUID NOT NULL REFERENCES public.courses(id),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- 6. AUDIT LOGS ALIGNMENT
-- ============================================================================
-- JSON Spec: id, actor_id, action, entity, entity_id, metadata, created_at
-- Current DB: admin_id, action, target_resource, timestamp.

ALTER TABLE public.audit_logs RENAME COLUMN admin_id TO actor_id;
ALTER TABLE public.audit_logs RENAME COLUMN target_resource TO entity;
ALTER TABLE public.audit_logs RENAME COLUMN timestamp TO created_at;

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;


-- 7. CLEANUP & CONSTRAINTS
-- ============================================================================
-- Ensure all Foreign Keys match the spec (most do).
-- Add indexes for common lookups (optional but recommended).

CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON public.enrollments(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.lesson_progress(user_id);
