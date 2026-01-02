INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true) ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Chat Attachments Public Access2" ON storage.objects;
    CREATE POLICY "Chat Attachments Public Access2" ON storage.objects FOR SELECT USING ( bucket_id = 'chat-attachments' );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Chat Attachments Upload2" ON storage.objects;
    CREATE POLICY "Chat Attachments Upload2" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'chat-attachments' AND auth.role() = 'authenticated' );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Chat Attachments Delete Own2" ON storage.objects;
    CREATE POLICY "Chat Attachments Delete Own2" ON storage.objects FOR DELETE USING ( bucket_id = 'chat-attachments' AND auth.uid() = owner );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
