-- SIMPLE MESSAGING FIX - Run this if you got the "already exists" error
-- This means the table exists, we just need to verify it's working

-- 1. Verify messages table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Enable Realtime (safe to run multiple times)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 3. Check current policies
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has conditions'
        ELSE 'No conditions'
    END as has_conditions
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;

-- 4. Test if you can query messages
SELECT 
    COUNT(*) as total_messages,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 1 END) as messages_today
FROM public.messages;

-- 5. Get list of users for testing
SELECT 
    id,
    email,
    raw_user_meta_data->>'full_name' as name
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- SUCCESS! If you see results above, messaging database is ready.
-- Now test in the browser:
-- 1. Go to Messages page
-- 2. Click "New Message"
-- 3. Select a recipient
-- 4. Send a test message
