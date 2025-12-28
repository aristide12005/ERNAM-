-- Enable RLS just in case
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow users to view messages they sent or received
CREATE POLICY "View Own Messages"
ON messages FOR SELECT
USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Allow users to insert messages as themselves
CREATE POLICY "Send Messages"
ON messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id
);

-- Allow updating (e.g., is_read) if receiver
CREATE POLICY "Update Received Messages"
ON messages FOR UPDATE
USING (
    auth.uid() = receiver_id
);
