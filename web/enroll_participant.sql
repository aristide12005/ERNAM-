-- Enroll 'student@ernam.com' into the first available active session
-- Using 'public.users' table, not 'participants'

WITH target_user AS (
    SELECT id FROM auth.users WHERE email = 'student@ernam.com' LIMIT 1
),
target_session AS (
    -- Get the first available scheduled or ongoing session
    SELECT id FROM sessions WHERE status IN ('planned', 'active', 'scheduled', 'ongoing') ORDER BY start_date ASC LIMIT 1
)
INSERT INTO session_participants (session_id, participant_id, status, attendance_status, assessment_status)
SELECT 
    (SELECT id FROM target_session),
    (SELECT id FROM target_user), -- id is same in auth.users and public.users
    'active',
    'enrolled',
    'pending'
WHERE 
    EXISTS (SELECT 1 FROM target_user) 
    AND EXISTS (SELECT 1 FROM target_session)
    AND NOT EXISTS (
        SELECT 1 FROM session_participants 
        WHERE session_id = (SELECT id FROM target_session) 
        AND participant_id = (SELECT id FROM target_user)
    );

-- Verify the enrollment
SELECT 
    u.email,
    sp.session_id,
    sp.attendance_status,
    s.status as session_status
FROM session_participants sp
JOIN users u ON u.id = sp.participant_id
JOIN sessions s ON s.id = sp.session_id
WHERE u.email = 'student@ernam.com';
