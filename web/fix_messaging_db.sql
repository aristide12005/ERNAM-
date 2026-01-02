-- 1. Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages they are involved in" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages as sender" ON public.messages;

-- 3. Create RLS Policies
-- Allow users to see messages where they are the sender OR the receiver
CREATE POLICY "Users can view messages they are involved in"
ON public.messages FOR SELECT
USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Allow users to insert messages only if they are the sender
CREATE POLICY "Users can insert messages as sender"
ON public.messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id
);

-- 4. RPC: get_my_conversations
-- Drop first to handle return type changes
DROP FUNCTION IF EXISTS get_my_conversations();

CREATE OR REPLACE FUNCTION get_my_conversations()
RETURNS TABLE (
    partner_id UUID,
    last_message TEXT,
    last_message_time TIMESTAMPTZ,
    unread_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    WITH sent_msgs AS (
        SELECT receiver_id as partner, created_at, content, is_read
        FROM messages
        WHERE sender_id = auth.uid()
    ),
    received_msgs AS (
        SELECT sender_id as partner, created_at, content, is_read
        FROM messages
        WHERE receiver_id = auth.uid()
    ),
    all_interactions AS (
        SELECT partner, created_at, content, is_read FROM sent_msgs
        UNION ALL
        SELECT partner, created_at, content, is_read FROM received_msgs
    ),
    latest_interactions AS (
        SELECT DISTINCT ON (partner)
            partner,
            content,
            created_at
        FROM all_interactions
        ORDER BY partner, created_at DESC
    ),
    unread_counts AS (
        SELECT sender_id as partner, COUNT(*) as count
        FROM messages
        WHERE receiver_id = auth.uid() AND is_read = false
        GROUP BY sender_id
    )
    SELECT
        li.partner,
        li.content,
        li.created_at,
        COALESCE(uc.count, 0)
    FROM latest_interactions li
    LEFT JOIN unread_counts uc ON li.partner = uc.partner
    ORDER BY li.created_at DESC;
END;
$$;

-- 5. RPC: get_direct_messages
-- Drop first to handle return type changes
DROP FUNCTION IF EXISTS get_direct_messages(UUID, UUID);

CREATE OR REPLACE FUNCTION get_direct_messages(current_user_id UUID, partner_id UUID)
RETURNS TABLE (
    id UUID,
    sender_id UUID,
    receiver_id UUID,
    content TEXT,
    created_at TIMESTAMPTZ,
    is_read BOOLEAN,
    sender_full_name TEXT,
    sender_role TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.sender_id,
        m.receiver_id,
        m.content,
        m.created_at,
        m.is_read,
        p.full_name,
        p.role
    FROM messages m
    JOIN profiles p ON m.sender_id = p.id
    WHERE
        (m.sender_id = current_user_id AND m.receiver_id = partner_id)
        OR
        (m.sender_id = partner_id AND m.receiver_id = current_user_id)
    ORDER BY m.created_at ASC;
END;
$$;
