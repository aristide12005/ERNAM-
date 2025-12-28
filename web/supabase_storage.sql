INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Chat Attachments Public Access2" ON storage.objects FOR SELECT USING ( bucket_id = 'chat-attachments' );

CREATE POLICY "Chat Attachments Upload2" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'chat-attachments' AND auth.role() = 'authenticated' );

CREATE POLICY "Chat Attachments Delete Own2" ON storage.objects FOR DELETE USING ( bucket_id = 'chat-attachments' AND auth.uid() = owner );
