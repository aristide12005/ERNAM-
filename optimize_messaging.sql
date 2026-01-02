-- OPTIMIZED MESSAGING QUERIES
-- Run this in Supabase SQL Editor

-- 1. Create RPC for fast Message Fetching
-- Replaces the client-side .or() query which is brittle
CREATE OR REPLACE FUNCTION get_direct_messages(current_user_id uuid, partner_id uuid)
RETURNS TABLE (
    id uuid,
    sender_id uuid,
    receiver_id uuid,
    course_id uuid,
    content text,
    created_at timestamptz,
    is_read boolean,
    attachment_url text,
    sender_full_name text,
    sender_role text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.sender_id,
        m.receiver_id,
        m.course_id,
        m.content,
        m.created_at,
        m.is_read,
        m.attachment_url,
        p.full_name as sender_full_name,
        p.role as sender_role
    FROM messages m
    LEFT JOIN profiles p ON m.sender_id = p.id
    WHERE (m.sender_id = current_user_id AND m.receiver_id = partner_id)
       OR (m.sender_id = partner_id AND m.receiver_id = current_user_id)
    ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
