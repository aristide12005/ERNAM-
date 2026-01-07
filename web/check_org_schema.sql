-- Check columns for organizations and applications
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('organizations', 'applications');
