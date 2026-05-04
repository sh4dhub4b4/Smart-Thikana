REVOKE EXECUTE ON FUNCTION public.get_tenant_rental_history(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_tenant_rental_history(uuid) TO authenticated;