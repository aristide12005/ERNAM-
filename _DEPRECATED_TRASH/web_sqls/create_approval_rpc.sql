-- 0. Ensure updated_at column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

CREATE OR REPLACE FUNCTION approve_user_transaction(target_user_id UUID, acting_admin_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Update the public.users table status
  UPDATE public.users
  SET status = 'approved',
      updated_at = NOW()
  WHERE id = target_user_id;

  -- 2. Log the action in audit_logs
  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    acting_admin_id,
    'user_approved',
    'user',
    target_user_id,
    jsonb_build_object('approved_by', acting_admin_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION reject_user_transaction(target_user_id UUID, acting_admin_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Update the public.users table status
  UPDATE public.users
  SET status = 'rejected',
      updated_at = NOW()
  WHERE id = target_user_id;

   -- 2. Log the action in audit_logs
  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    acting_admin_id,
    'user_rejected',
    'user',
    target_user_id,
    jsonb_build_object('rejected_by', acting_admin_id)
  );
END;
$$;
