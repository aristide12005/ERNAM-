-- Add language_preference column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS language_preference text DEFAULT 'en';

-- Verify the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'language_preference';
