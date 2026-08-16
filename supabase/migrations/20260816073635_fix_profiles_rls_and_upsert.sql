-- Add missing INSERT/UPDATE/DELETE policies for profiles table
-- Currently only SELECT is allowed; users need to create and update their own profile

-- Allow authenticated users to insert their own profile row
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile row
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to delete their own profile row
CREATE POLICY "profiles_delete_own"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Drop and recreate upsert_profile to properly handle new signups
DROP FUNCTION IF EXISTS public.upsert_profile(text, text, integer) CASCADE;

CREATE FUNCTION public.upsert_profile(
  _email text,
  _display_name text,
  _credits integer DEFAULT 2600
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, credits, role, is_banned)
  VALUES (auth.uid(), _email, _display_name, _credits, 'member', false)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      display_name = COALESCE(EXCLUDED.display_name, profiles.display_name);
END;
$$;

-- Grant execute to authenticated and anon
GRANT EXECUTE ON FUNCTION public.upsert_profile(text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_profile(text, text, integer) TO anon;
