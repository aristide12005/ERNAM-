-- STEP 1: CHECK IF MESSAGES TABLE EXISTS AND HAS DATA
-- Run this FIRST

SELECT 
    COUNT(*) as total_messages,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 1 END) as messages_today
FROM public.messages;

-- If you get an error "relation does not exist", the messages table wasn't created
-- If you get 0, the table exists but has no messages yet
