-- 🔧 FIX TRAINING STANDARDS (Schema & Security)
-- Run this in Supabase SQL Editor

-- 1. SCHEMA FIX: Add 'details' column (missing in original schema)
ALTER TABLE public.training_standards 
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::JSONB;

-- 2. SECURITY FIX: Enable RLS
ALTER TABLE public.training_standards ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES:

-- A. Admins can do EVERYTHING (Create, Read, Update, Delete)
DROP POLICY IF EXISTS "Admins can manage standards" ON public.training_standards;
CREATE POLICY "Admins can manage standards" ON public.training_standards
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'ernam_admin'
        )
    );

-- B. Everyone (Authenticated) can READ standards (for dropdowns, sessions, etc.)
DROP POLICY IF EXISTS "Authenticated can read standards" ON public.training_standards;
CREATE POLICY "Authenticated can read standards" ON public.training_standards
    FOR SELECT
    TO authenticated
    USING (true);

-- 4. VERIFICATION (Optional)
-- Verify the table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'training_standards';
