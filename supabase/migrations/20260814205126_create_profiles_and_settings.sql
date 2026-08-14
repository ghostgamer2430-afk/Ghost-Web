/*
# Create profiles, site_settings tables and owner RPC functions

## Purpose
The City of Fears admin panel manages site members (profiles), maintenance
mode (site_settings), and admin promotions. The frontend calls these via
supabase.rpc(...) and supabase.from("profiles")... but the tables and
functions do not exist yet. This migration creates the server-side schema.

## New Tables
### profiles
- id (uuid PK), email (unique), display_name, credits (int default 0),
  is_banned (bool default false), role (text default 'member'), created_at
### site_settings
- key (text PK), value (jsonb)

## Security
- profiles: RLS on. SELECT for authenticated. No direct write policies —
  all mutations go through SECURITY DEFINER RPCs that validate owner creds.
- site_settings: RLS on. SELECT for anon+authenticated. No direct write
  policies — mutations go through owner_upsert_setting RPC.

## RPC Functions (all SECURITY DEFINER)
- verify_owner_credentials: validates owner username/password
- owner_manage_admin: add/remove admin role
- owner_update_site_member: update credits + ban status
- owner_delete_site_member: delete a profile
- owner_upsert_setting: upsert a site_settings row
- upsert_profile: create/update a profile on member signup

## Notes
1. Owner credentials match src/lib/owner.ts constants.
2. RPCs are the only mutation path — RLS blocks direct writes.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text,
  credits integer NOT NULL DEFAULT 0,
  is_banned boolean NOT NULL DEFAULT false,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
CREATE POLICY "profiles_select_authenticated"
ON profiles FOR SELECT
TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_select_all" ON site_settings;
CREATE POLICY "site_settings_select_all"
ON site_settings FOR SELECT
TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION verify_owner_credentials(_username text, _password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  IF _username = 'Ghostinfinite01' AND _password = E'Ghost2436$$' THEN
    RETURN true;
  END IF;
  RETURN false;
END;
$func$;

CREATE OR REPLACE FUNCTION owner_manage_admin(
  _username text,
  _password text,
  _action text,
  _target_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  IF NOT verify_owner_credentials(_username, _password) THEN
    RAISE EXCEPTION 'Invalid owner credentials';
  END IF;
  IF _action = 'add' THEN
    UPDATE profiles SET role = 'admin' WHERE email = lower(trim(_target_email));
    IF NOT FOUND THEN RAISE EXCEPTION 'Member not found: %', _target_email; END IF;
  ELSIF _action = 'remove' THEN
    UPDATE profiles SET role = 'member' WHERE email = lower(trim(_target_email));
    IF NOT FOUND THEN RAISE EXCEPTION 'Member not found: %', _target_email; END IF;
  ELSE
    RAISE EXCEPTION 'Invalid action: %', _action;
  END IF;
END;
$func$;

CREATE OR REPLACE FUNCTION owner_update_site_member(
  _username text,
  _password text,
  _member_id uuid,
  _credits integer,
  _is_banned boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  IF NOT verify_owner_credentials(_username, _password) THEN
    RAISE EXCEPTION 'Invalid owner credentials';
  END IF;
  UPDATE profiles SET credits = _credits, is_banned = _is_banned WHERE id = _member_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Member not found'; END IF;
END;
$func$;

CREATE OR REPLACE FUNCTION owner_delete_site_member(
  _username text,
  _password text,
  _member_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  IF NOT verify_owner_credentials(_username, _password) THEN
    RAISE EXCEPTION 'Invalid owner credentials';
  END IF;
  DELETE FROM profiles WHERE id = _member_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Member not found'; END IF;
END;
$func$;

CREATE OR REPLACE FUNCTION owner_upsert_setting(
  _username text,
  _password text,
  _key text,
  _value jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  IF NOT verify_owner_credentials(_username, _password) THEN
    RAISE EXCEPTION 'Invalid owner credentials';
  END IF;
  INSERT INTO site_settings (key, value)
  VALUES (_key, _value)
  ON CONFLICT (key) DO UPDATE SET value = excluded.value;
END;
$func$;

CREATE OR REPLACE FUNCTION upsert_profile(
  _email text,
  _display_name text DEFAULT NULL,
  _credits integer DEFAULT 2600
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE _id uuid;
BEGIN
  INSERT INTO profiles (email, display_name, credits)
  VALUES (lower(trim(_email)), _display_name, _credits)
  ON CONFLICT (email) DO UPDATE SET display_name = COALESCE(_display_name, profiles.display_name)
  RETURNING id INTO _id;
  RETURN _id;
END;
$func$;
