-- MESSAGING BACKEND SETUP & FIX
-- Run this in Supabase SQL Editor

-- 1. Ensure MESSAGES table exists with correct schema
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

-- 2. Add is_read column if it was dropped (compatibility check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='is_read') THEN
        ALTER TABLE public.messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES
DROP POLICY IF EXISTS "Users can view sent messages" ON public.messages;
CREATE POLICY "Users can view sent messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can view private received messages" ON public.messages;
CREATE POLICY "Users can view private received messages" ON public.messages FOR SELECT USING (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Anyone can send messages" ON public.messages;
CREATE POLICY "Anyone can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update own/received messages" ON public.messages;
CREATE POLICY "Users can update own/received messages" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- 5. Create STORAGE BUCKET for attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage Policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'chat-attachments' AND auth.role() = 'authenticated'
);

-- 7. RPC FUNCTION: get_my_conversations
-- Updated to use the is_read column from messages table
CREATE OR REPLACE FUNCTION get_my_conversations()
RETURNS TABLE (
    partner_id UUID,
    last_message_id UUID,
    content TEXT,
    created_at TIMESTAMPTZ,
    sender_id UUID,
    is_read BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_messages AS (
        SELECT DISTINCT ON (
            CASE WHEN m.sender_id = auth.uid() THEN m.receiver_id ELSE m.sender_id END
        )
        m.id,
        CASE WHEN m.sender_id = auth.uid() THEN m.receiver_id ELSE m.sender_id END as partner_uuid,
        m.content,
        m.created_at,
        m.sender_id,
        m.is_read
        FROM messages m
        WHERE (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
        AND m.course_id IS NULL -- Only Direct Messages
        ORDER BY 
            CASE WHEN m.sender_id = auth.uid() THEN m.receiver_id ELSE m.sender_id END,
            m.created_at DESC
    )
    SELECT 
        lm.partner_uuid,
        lm.id,
        lm.content,
        lm.created_at,
        lm.sender_id,
        lm.is_read
    FROM latest_messages lm
    ORDER BY lm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Enable Realtime
DO $$
BEGIN
  -- Add table to publication if not already present
  -- Standard Supabase realtime pub is 'supabase_realtime'
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION
  WHEN OTHERS THEN NULL; -- Ignore if already added or other minor errors
END $$;
