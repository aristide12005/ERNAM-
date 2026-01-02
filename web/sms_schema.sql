-- MARKET-READY SMS SCHEMA EXTENSION
-- Purpose: Adds Admissions, Academic Structure, and Examination logic

-- 1. ACADEMIC STRUCTURE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academic_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "2024-2025"
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "Computer Science"
    code TEXT UNIQUE NOT NULL, -- e.g., "CSE"
    head_of_department UUID REFERENCES auth.users(id),
    established_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "Batch 10"
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADMISSIONS MODULE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.applicants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT CHECK (email ~* '^.+@.+\..+$'),
    phone TEXT,
    guardian_name TEXT,
    guardian_phone TEXT,
    dob DATE,
    address TEXT,
    previous_school TEXT,
    previous_result TEXT, -- GPA or text description
    applied_department UUID REFERENCES public.departments(id),
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'enrolled')) DEFAULT 'pending',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDENT DETAILED PROFILE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_details (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    roll_number TEXT,
    registration_number TEXT UNIQUE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    father_name TEXT,
    mother_name TEXT,
    guardian_contact TEXT,
    permanent_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EXAMINATION & RESULTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "Spring Semester Mid-Term 2025"
    session_id UUID REFERENCES public.academic_sessions(id),
    start_date DATE,
    end_date DATE,
    is_published BOOLEAN DEFAULT false, -- If true, students can see results
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE, -- Mapping courses to subjects
    theory_marks NUMERIC DEFAULT 0 CHECK (theory_marks >= 0),
    practical_marks NUMERIC DEFAULT 0 CHECK (practical_marks >= 0),
    total_marks NUMERIC GENERATED ALWAYS AS (theory_marks + practical_marks) STORED,
    letter_grade TEXT, -- e.g., "A+", "B"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, exam_id, course_id)
);

-- 5. LINKING EXISTING COURSES
-- ----------------------------------------------------------------------------
-- Add department linking to courses to organize them
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='department_id') THEN
        ALTER TABLE public.courses ADD COLUMN department_id UUID REFERENCES public.departments(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='subject_code') THEN
        ALTER TABLE public.courses ADD COLUMN subject_code TEXT;
    END IF;
END $$;

-- 6. RLS POLICIES (Draft standard policies)
-- ----------------------------------------------------------------------------
ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;

-- Public read access for structure (needed for forms/ui)
CREATE POLICY "Public Read Structure" ON public.academic_sessions FOR SELECT USING (true);
CREATE POLICY "Public Read Departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Public Read Batches" ON public.batches FOR SELECT USING (true);

-- Admin full access
-- (Assuming is_admin() function exists from previous context, otherwise we use a role check)
-- Re-using the logic: (select role from profiles where id = auth.uid()) = 'admin'

CREATE POLICY "Admin Manage All" ON public.academic_sessions FOR ALL USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Admin Manage Departments" ON public.departments FOR ALL USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Admin Manage Batches" ON public.batches FOR ALL USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- Applicants Logic
CREATE POLICY "Public Create Applicant" ON public.applicants FOR INSERT WITH CHECK (true); -- Anyone can apply
CREATE POLICY "Admin View Applicants" ON public.applicants FOR SELECT USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- Student Details Logic
CREATE POLICY "Users View Own Details" ON public.student_details FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin Manage Details" ON public.student_details FOR ALL USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );
-- Instructors might need to view student details for their courses (omitted for now for simplicity)

-- Exams & Marks Logic
CREATE POLICY "Students View Published Marks" ON public.marks FOR SELECT 
USING (
    student_id = auth.uid() 
    AND EXISTS (SELECT 1 FROM public.exams WHERE id = marks.exam_id AND is_published = true)
);

CREATE POLICY "Staff Manage Marks" ON public.marks FOR ALL 
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'trainer') );

CREATE POLICY "View Exams" ON public.exams FOR SELECT USING (true); -- Students need to know exam dates
CREATE POLICY "Admin Manage Exams" ON public.exams FOR ALL USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

