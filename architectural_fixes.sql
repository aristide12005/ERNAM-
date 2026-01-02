-- ARCHITECTURAL FIXES FOR MESSAGING SYSTEM
-- Addresses:
-- 1. Broadcast Read Status Paradox (Separate table)
-- 2. Inbox Query Performance (RPC function)
-- 3. Ghost Message Loophole (Check constraints)
-- 4. RLS Performance (Indexes)

-- 1. REMOVE is_read FROM MESSAGES
-- We need to drop this column as it's structurally incorrect for broadcasts
ALTER TABLE messages DROP COLUMN IF EXISTS is_read;

-- 2. ADD CONSTRAINT TO PREVENT GHOST MESSAGES
-- Ensure message is EITHER a DM OR a Broadcast, but not both/neither
ALTER TABLE messages DROP CONSTRAINT IF EXISTS target_check;
ALTER TABLE messages
ADD CONSTRAINT target_check 
CHECK (
  (receiver_id IS NOT NULL AND course_id IS NULL) OR 
  (receiver_id IS NULL AND course_id IS NOT NULL)
);

-- 3. CREATE MESSAGE READ STATUS TABLE
CREATE TABLE IF NOT EXISTS message_read_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;

-- Users can see their own read status
CREATE POLICY "Users can view own read status"
ON message_read_status FOR SELECT
USING (auth.uid() = user_id);

-- Users can mark messages as read (insert)
CREATE POLICY "Users can mark messages as read"
ON message_read_status FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. PERFORMANCE INDEXES
-- Sped up RLS checks for course enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON enrollments(user_id, course_id);
-- Sped up message filtering
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_course ON messages(course_id);

-- 5. RPC FUNCTION FOR EFFICIENT INBOX FETCHING (Direct Messages)
-- Gets the latest message for every conversation the user is part of
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
        m.sender_id
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
        CASE 
            WHEN lm.sender_id = auth.uid() THEN TRUE -- Sent by me, effectively "read"
            ELSE EXISTS (
                SELECT 1 FROM message_read_status mrs 
                WHERE mrs.message_id = lm.id AND mrs.user_id = auth.uid()
            )
        END as is_read
    FROM latest_messages lm
    ORDER BY lm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
