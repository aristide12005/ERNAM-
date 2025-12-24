-- MESSAGING SYSTEM DIAGNOSTIC & FIX
-- Run this script in Supabase SQL Editor to diagnose and fix messaging issues

-- 1. Check if messages table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
        RAISE NOTICE 'messages table EXISTS';
    ELSE
        RAISE NOTICE 'messages table DOES NOT EXIST - Creating now...';
    END IF;
END $$;

-- 2. Create messages table (if not exists)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    is_reply_allowed BOOLEAN DEFAULT TRUE,
    parent_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view sent messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view private received messages" ON public.messages;
DROP POLICY IF EXISTS "Trainees can view course broadcasts" ON public.messages;
DROP POLICY IF EXISTS "Trainers can view course-related messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all communications" ON public.messages;
DROP POLICY IF EXISTS "Anyone can send messages" ON public.messages;

-- 5. Create SIMPLE policies that work
-- Policy 1: Users can see messages they sent
CREATE POLICY "Users can view sent messages" 
ON public.messages FOR SELECT 
USING (auth.uid() = sender_id);

-- Policy 2: Users can see messages sent to them
CREATE POLICY "Users can view received messages" 
ON public.messages FOR SELECT 
USING (auth.uid() = receiver_id);

-- Policy 3: Users can send messages
CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- Policy 4: Users can update their own messages (mark as read)
CREATE POLICY "Users can update own messages" 
ON public.messages FOR UPDATE 
USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- 6. Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 7. Test query - Check if you can see messages
SELECT 
    id,
    sender_id,
    receiver_id,
    content,
    created_at
FROM public.messages
ORDER BY created_at DESC
LIMIT 5;

-- 8. Insert a test message (replace UUIDs with actual user IDs)
-- Uncomment and modify this after getting user IDs:
/*
INSERT INTO public.messages (sender_id, receiver_id, content, title)
VALUES (
    'YOUR_USER_ID_HERE',
    'RECIPIENT_USER_ID_HERE',
    'Test message - if you see this, messaging works!',
    'Test'
);
*/

-- 9. Check RLS policies are active
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'messages';

-- 10. Verify table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;
