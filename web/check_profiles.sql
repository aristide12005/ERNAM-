-- Check what 'profiles' is and its columns
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Also check if 'users' table has organization_id (we know it should)
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'organization_id';
