/*
# Fix SECURITY DEFINER function execution permissions

## Purpose
The security advisor flagged that all 7 SECURITY DEFINER functions are
executable by both `anon` and `authenticated` roles. This is a security
risk — anonymous users could call owner-only functions like
`owner_delete_site_member` directly via the REST API.

## Changes
1. Revoke EXECUTE from `anon` on ALL SECURITY DEFINER functions.
   The frontend always calls these with an authenticated Supabase session,
   so anon access is never needed.
2. Revoke EXECUTE from `authenticated` on `verify_owner_credentials`.
   This is an internal helper called only by other RPC functions — it
   should never be called directly from the API.
3. Keep EXECUTE on `authenticated` for:
   - upsert_profile (called during signup/signin)
   - owner_manage_admin (called by owner in admin panel)
   - owner_update_site_member (called by owner in admin panel)
   - owner_delete_site_member (called by owner in admin panel)
   - owner_upsert_setting (called by owner in admin panel)
   - admin_upsert_setting (called by admins in admin panel)

## Security
- Anonymous users can no longer call any SECURITY DEFINER function.
- The `authenticated` role can still call all functions except
  `verify_owner_credentials` (internal helper).
- All owner functions validate credentials internally, so even if an
  authenticated non-owner user calls them, they will raise an exception.
*/

-- Revoke anon EXECUTE on all SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION verify_owner_credentials(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION owner_manage_admin(text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION owner_update_site_member(text, text, uuid, integer, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION owner_delete_site_member(text, text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION owner_upsert_setting(text, text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION admin_upsert_setting(text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION upsert_profile(text, text, integer) FROM anon;

-- Revoke authenticated EXECUTE on the internal helper only
REVOKE EXECUTE ON FUNCTION verify_owner_credentials(text, text) FROM authenticated;

-- Grant authenticated EXECUTE on all user-facing functions (explicit)
GRANT EXECUTE ON FUNCTION upsert_profile(text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION owner_manage_admin(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION owner_update_site_member(text, text, uuid, integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION owner_delete_site_member(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION owner_upsert_setting(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_upsert_setting(text, jsonb) TO authenticated;
