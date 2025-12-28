-- UNBLOCK DATA VISIBILITY
-- Run this to allow Admins and Users to actually SEE the data.

-- 1. PROFILES (Users)
-- Ensure everyone can see names/roles (vital for Admin & Chat)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles; -- catch typo version
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING ( true );

-- 2. COURSES
-- Allow everyone to view course lists
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON courses;
CREATE POLICY "Courses are viewable by everyone"
ON courses FOR SELECT
USING ( true );

-- Allow Instructors/Admins to create/edit (Simplified for unblocking)
DROP POLICY IF EXISTS "Authenticated can insert courses" ON courses;
CREATE POLICY "Authenticated can insert courses"
ON courses FOR INSERT
WITH CHECK ( auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Owners can update courses" ON courses;
CREATE POLICY "Owners can update courses"
ON courses FOR UPDATE
USING ( auth.uid() = instructor_id );

-- 3. ENROLLMENTS
-- Allow viewing enrollments (for Gradebook/Admin)
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enrollments details are viewable" ON enrollments;
CREATE POLICY "Enrollments details are viewable"
ON enrollments FOR SELECT
USING ( true ); -- Creating broad read access so Admins can see all student progress
