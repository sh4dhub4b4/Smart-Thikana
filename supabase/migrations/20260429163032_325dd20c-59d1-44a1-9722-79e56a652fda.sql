
-- Set explicit search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Lock down handle_new_user (only the auth trigger should call it)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- set_updated_at is only invoked by triggers
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;

-- has_role is used inside RLS — needs to remain callable by authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
