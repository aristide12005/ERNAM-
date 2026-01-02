INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-thumbnails', 'course-thumbnails', true) 
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view thumbnails
DO $$
BEGIN
    DROP POLICY IF EXISTS "Course Thumbnails Public Viewing" ON storage.objects;
    CREATE POLICY "Course Thumbnails Public Viewing" 
    ON storage.objects FOR SELECT 
    USING ( bucket_id = 'course-thumbnails' );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Policy: Authenticated users can upload
DO $$
BEGIN
    DROP POLICY IF EXISTS "Course Thumbnails Upload" ON storage.objects;
    CREATE POLICY "Course Thumbnails Upload" 
    ON storage.objects FOR INSERT 
    WITH CHECK ( bucket_id = 'course-thumbnails' AND auth.role() = 'authenticated' );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Policy: Users can update/delete
DO $$
BEGIN
    DROP POLICY IF EXISTS "Course Thumbnails Modify" ON storage.objects;
    CREATE POLICY "Course Thumbnails Modify" 
    ON storage.objects FOR UPDATE 
    USING ( bucket_id = 'course-thumbnails' AND auth.role() = 'authenticated' );
    
    DROP POLICY IF EXISTS "Course Thumbnails Delete" ON storage.objects;
    CREATE POLICY "Course Thumbnails Delete" 
    ON storage.objects FOR DELETE 
    USING ( bucket_id = 'course-thumbnails' AND auth.role() = 'authenticated' );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
