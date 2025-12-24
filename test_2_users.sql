-- STEP 2: CHECK HOW MANY USERS EXIST
-- Run this SECOND

SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'trainee' THEN 1 END) as students,
    COUNT(CASE WHEN role = 'trainer' THEN 1 END) as instructors,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
FROM public.profiles;
