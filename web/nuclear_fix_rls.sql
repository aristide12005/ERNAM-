-- NUCLEAR FIX: RESET ALL PERMISSIONS
-- This script deletes ALL existing policies on profiles and courses to fix the "Infinite Loop" and "Hidden Data" bugs.

-- 1. PROFILES Table (Fixes White Screen & User List)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop EVERY known policy variation
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create SIMPLE, SAFE policies (No recursion)
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING ( true ); -- Everyone can see basic profile info (needed for chat & lists)

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING ( auth.uid() = id );

-- 2. COURSES Table (Fixes Missing Courses)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Authenticated can insert courses" ON courses;
DROP POLICY IF EXISTS "Owners can update courses" ON courses;

-- Create Open Access for Reading
CREATE POLICY "Courses are viewable by everyone"
ON courses FOR SELECT
USING ( true );

-- Create Auth-based Write Access
CREATE POLICY "Authenticated can insert courses"
ON courses FOR INSERT
WITH CHECK ( auth.role() = 'authenticated' );

CREATE POLICY "Owners can update courses"
ON courses FOR UPDATE
USING ( auth.uid() = instructor_id );

-- 3. ENROLLMENTS
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enrollments details are viewable" ON enrollments;

CREATE POLICY "Enrollments details are viewable"
ON enrollments FOR SELECT
USING ( true );
