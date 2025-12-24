-- QUICK FIX: Remove type constraint and use allowed values
-- Run this BEFORE running FINAL_FIX_ALL.sql

-- 1. Drop the type constraint if it exists
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. Now you can run FINAL_FIX_ALL.sql
-- Or run this simpler version:

SELECT 'Constraint removed - now run FINAL_FIX_ALL.sql' as status;
