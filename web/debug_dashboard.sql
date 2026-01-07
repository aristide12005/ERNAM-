-- Comprehensive check for 'student@ernam.com'
-- Using 'public.users' table

-- 1. Check Auth User and Public User sync
SELECT 
    au.id as auth_id, 
    au.email, 
    pu.id as public_id, 
    pu.role, 
    pu.status 
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE au.email = 'student@ernam.com';

-- 2. Check Session Enrollments
SELECT 
    sp.id as enrollment_id,
    sp.session_id,
    sp.participant_id,
    sp.attendance_status,
    sp.status as enrollment_status,
    s.id as session_id,
    s.status as session_status,
    s.start_date,
    s.end_date
FROM session_participants sp
JOIN sessions s ON s.id = sp.session_id
WHERE sp.participant_id = (SELECT id FROM auth.users WHERE email = 'student@ernam.com');
