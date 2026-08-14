/*
# Revoke PUBLIC EXECUTE on all SECURITY DEFINER functions

## Purpose
The previous migration revoked EXECUTE from `anon` directly, but all
functions still had a `PUBLIC` grant — which every role inherits, including
`anon`. This left all SECURITY DEFINER functions callable by anonymous
users via the REST API.

## Changes
1. REVOKE EXECUTE FROM PUBLIC on all 7 SECURITY DEFINER functions.
2. GRANT EXECUTE TO authenticated on the 6 user-facing functions
   (not verify_owner_credentials — internal only).
3. service_role and postgres retain EXECUTE automatically (they are
   superusers / bypass RLS).

## Security
- After this change, only `authenticated`, `service_role`, and `postgres`
  can call these functions. `anon` cannot.
- `verify_owner_credentials` is only callable by `service_role` and
  `postgres` (internal helper used by other functions).
*/

-- Revoke PUBLIC EXECUTE (this is the root cause — PUBLIC grants to everyone)
REVOKE EXECUTE ON FUNCTION verify_owner_credentials(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION owner_manage_admin(text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION owner_update_site_member(text, text, uuid, integer, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION owner_delete_site_member(text, text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION owner_upsert_setting(text, text, text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_upsert_setting(text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION upsert_profile(text, text, integer) FROM PUBLIC;

-- Also revoke from anon explicitly (belt and suspenders)
REVOKE EXECUTE ON FUNCTION verify_owner_credentials(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION owner_manage_admin(text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION owner_update_site_member(text, text, uuid, integer, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION owner_delete_site_member(text, text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION owner_upsert_setting(text, text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION admin_upsert_setting(text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION upsert_profile(text, text, integer) FROM anon;

-- Grant EXECUTE to authenticated on user-facing functions only
GRANT EXECUTE ON FUNCTION upsert_profile(text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION owner_manage_admin(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION owner_update_site_member(text, text, uuid, integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION owner_delete_site_member(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION owner_upsert_setting(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_upsert_setting(text, jsonb) TO authenticated;

-- verify_owner_credentials: NO grant to authenticated — internal only
