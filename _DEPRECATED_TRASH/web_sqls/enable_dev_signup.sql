-- 🔓 ENABLE DEVELOPER ADMIN SIGNUP 🔓
-- Run this to allow creating Admin accounts directly from the Login page.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    submitted_secret TEXT;
BEGIN
    -- Extract the secret from metadata (sent by the new UI)
    submitted_secret := NEW.raw_user_meta_data->>'admin_secret';

    -- CHECK FOR SECRET KEY 'ERNAM2026'
    IF submitted_secret = 'ERNAM2026' THEN
        -- ✅ CREATE ADMIN USER
        INSERT INTO public.users (id, email, full_name, role, status)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin User'),
            'ernam_admin', -- KEY: Auto-assign Admin Role
            'approved'     -- KEY: Auto-approve
        )
        ON CONFLICT (id) DO NOTHING; -- prevent errors
    ELSE
        -- 👤 STANDARD USER (Participant)
        INSERT INTO public.users (id, email, full_name, role, status)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
            'participant',
            'pending'
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-bind the trigger (just in case)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
