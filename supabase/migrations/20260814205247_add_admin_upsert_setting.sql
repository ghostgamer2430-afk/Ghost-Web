/*
# Add admin_upsert_setting RPC

## Purpose
The MaintenancePanel in the admin panel allows both admins and the owner to
toggle maintenance mode. The owner path uses owner_upsert_setting (validates
owner credentials). The admin path currently does a direct table upsert,
which is blocked by RLS (site_settings has no INSERT/UPDATE policy).
This migration adds an admin_upsert_setting RPC that checks the caller's
auth.uid() against the profiles table to verify they have admin role.

## New Function
### admin_upsert_setting(_key text, _value jsonb)
- Verifies the calling user (auth.uid()) has role='admin' and is not banned
- Upserts the site_settings row by key
- SECURITY DEFINER to bypass RLS

## Security
- Only authenticated users with admin role in profiles can call this
- Raises exception if caller is not an admin or is banned
*/

CREATE OR REPLACE FUNCTION admin_upsert_setting(_key text, _value jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_banned = false
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  INSERT INTO site_settings (key, value)
  VALUES (_key, _value)
  ON CONFLICT (key) DO UPDATE SET value = excluded.value;
END;
$func$;
