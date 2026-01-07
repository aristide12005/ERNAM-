-- Check if the user 'student@ernam.com' exists and get their ID
WITH target_user AS (
    SELECT id, email FROM auth.users WHERE email = 'student@ernam.com'
),
participant_record AS (
    SELECT * FROM participants WHERE profile_id = (SELECT id FROM target_user)
)
SELECT 
    u.email,
    p.id as participant_id,
    sp.session_id,
    sp.attendance_status,
    s.status as session_status,
    s.start_date,
    s.end_date
FROM target_user u
LEFT JOIN participants p ON p.profile_id = u.id
LEFT JOIN session_participants sp ON sp.participant_id = p.id
LEFT JOIN sessions s ON s.id = sp.session_id;

-- Also check if there are any active sessions at all
SELECT id, status, start_date, end_date, training_standard_id FROM sessions WHERE status = 'scheduled' OR status = 'ongoing';
