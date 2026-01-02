-- UPGRADE COURSE SCHEMA
-- Purpose: Add missing columns to support "Real" course data (Duration, Levels, Module Descriptions).

-- 1. Upgrade COURSES table
DO $$
BEGIN
    -- Add duration_hours
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='duration_hours') THEN
        ALTER TABLE public.courses ADD COLUMN duration_hours NUMERIC DEFAULT 0;
    END IF;

    -- Add level (Beginner, Intermediate, Advanced, etc.)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='level') THEN
        ALTER TABLE public.courses ADD COLUMN level TEXT DEFAULT 'Beginner';
    END IF;
END $$;

-- 2. Upgrade MODULES table
DO $$
BEGIN
    -- Add description for modules
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='modules' AND column_name='description') THEN
        ALTER TABLE public.modules ADD COLUMN description TEXT;
    END IF;
END $$;
