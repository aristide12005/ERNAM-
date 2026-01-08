-- Fix RLS for sessions and session_instructors

-- 1. Enable RLS (idempotent)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_instructors ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON sessions;
DROP POLICY IF EXISTS "Enable write access for admins" ON sessions;
DROP POLICY IF EXISTS "Enable read access for all users" ON session_instructors;
DROP POLICY IF EXISTS "Enable write access for admins" ON session_instructors;

-- 3. Create Session Policies

-- READ: All authenticated users can read sessions
CREATE POLICY "Enable read access for all users" ON sessions
    FOR SELECT
    TO authenticated
    USING (true);

-- WRITE (INSERT/UPDATE/DELETE): Only 'ernam_admin' can modify sessions
-- Using check on auth.users role (if applicable) or metadata
-- Assuming simple check based on other policies in code base
CREATE POLICY "Enable write access for admins" ON sessions
    FOR ALL
    TO authenticated
    USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'ernam_admin') OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'ernam_admin'
        )
    );

-- 4. Create Session Instructor Policies

-- READ: All authenticated users
CREATE POLICY "Enable read access for all users" ON session_instructors
    FOR SELECT
    TO authenticated
    USING (true);

-- WRITE: Admins only
CREATE POLICY "Enable write access for admins" ON session_instructors
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'ernam_admin'
        )
    );
