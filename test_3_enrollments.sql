-- STEP 3: CHECK ENROLLMENTS
-- Run this THIRD

SELECT 
    status,
    COUNT(*) as count
FROM public.enrollments
GROUP BY status;

-- This will show how many enrollments are in each status
