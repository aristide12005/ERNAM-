-- FIX MISSING EMAILS IN PROFILES
-- Problem: Student emails are not showing in the UI.
-- Cause: The frontend reads from public.profiles, but emails live in auth.users.
--        The public.profiles.email column is likely NULL for existing users.

-- 1. Backfill existing emails from auth.users to public.profiles
UPDATE public.profiles
SET email = users.email
FROM auth.users
WHERE profiles.id = users.id
  AND profiles.email IS NULL;

-- 2. Create/Update a function to keep it synced on new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'trainee') -- Default to trainee
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
END;
$$;

-- 3. Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Audit Log
INSERT INTO public.audit_logs (action, entity, metadata)
VALUES ('FIX_MISSING_EMAILS', 'profiles', '{"status": "Completed backfill of emails from auth.users"}');
