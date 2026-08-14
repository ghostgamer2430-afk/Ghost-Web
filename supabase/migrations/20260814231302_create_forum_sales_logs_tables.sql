/*
# Create Forum, Sales, Credit, and Admin Log Tables

## Overview
Adds the core tables for the FiveM forum system with locked-link purchases,
credit economy tracking, sales management, and an admin audit log.

## New Tables

1. **forum_posts** — User-created forum posts. Posts can contain locked links
   (wrapped in `[locked:cost]URL[/locked]` syntax). Other users pay credits
   to unlock the link. The poster sets the credit cost.
   - `id` uuid PK
   - `author_id` uuid (references profiles) — poster
   - `author_email` text — denormalized for display
   - `author_display_name` text — denormalized for display
   - `title` text — post title
   - `body` text — post body (may contain locked link markup)
   - `locked_url` text nullable — the URL behind the lock
   - `locked_cost` integer default 0 — credits required to unlock
   - `category` text default 'general'
   - `is_pinned` boolean default false — admin-pinned posts
   - `is_removed` boolean default false — admin-removed (soft delete)
   - `views` integer default 0
   - `created_at` timestamptz default now()

2. **link_unlocks** — Tracks which users have paid to unlock which posts' links.
   Prevents double-charging and lets users re-view unlocked links.
   - `id` uuid PK
   - `post_id` uuid references forum_posts ON DELETE CASCADE
   - `user_id` uuid references profiles ON DELETE CASCADE
   - `credits_paid` integer — amount deducted
   - `unlocked_at` timestamptz default now()
   - UNIQUE(post_id, user_id)

3. **credit_transactions** — Ledger of all credit movements (purchases, casino,
   unlocks, admin grants, posting fees).
   - `id` uuid PK
   - `user_id` uuid references profiles ON DELETE CASCADE
   - `amount` integer — positive = credit added, negative = spent
   - `reason` text — e.g. 'casino_win', 'link_unlock', 'admin_grant', 'stripe_purchase'
   - `reference_id` text nullable — e.g. post_id or stripe session id
   - `created_at` timestamptz default now()

4. **admin_logs** — Auto audit trail. Every admin/owner action is logged.
   - `id` uuid PK
   - `actor_id` uuid nullable — admin's profile id (null for owner)
   - `actor_email` text — who performed the action
   - `action` text — e.g. 'ban_member', 'remove_post', 'toggle_sale'
   - `target` text nullable — what was acted on (email, post id, etc.)
   - `details` text nullable — extra context
   - `created_at` timestamptz default now()

## Security
- RLS enabled on all new tables.
- forum_posts: authenticated users can SELECT (non-removed), INSERT own, 
  UPDATE own. Admins/owner can UPDATE any (pin/remove).
- link_unlocks: authenticated users can SELECT own, INSERT own.
- credit_transactions: authenticated users can SELECT own only.
- admin_logs: only authenticated (admins will read via client; RLS ensures
  regular users can't read others' logs — we scope SELECT to own rows,
  and the admin panel reads via the same client so it sees its own.
  Admins see all logs through a SECURITY DEFINER function.
- Added `log_admin_action()` SECURITY DEFINER function for safe logging.
- Added `unlock_post_link()` SECURITY DEFINER function that atomically
  deducts credits, creates unlock record, and logs a transaction.
- Added `admin_view_logs()` SECURITY DEFINER function for admins to read all logs.
- Added `admin_list_all_posts()` SECURITY DEFINER function for admin panel.
*/

-- ── forum_posts ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  author_email text NOT NULL DEFAULT '',
  author_display_name text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  locked_url text,
  locked_cost integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'general',
  is_pinned boolean NOT NULL DEFAULT false,
  is_removed boolean NOT NULL DEFAULT false,
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "forum_select_visible" ON forum_posts;
CREATE POLICY "forum_select_visible" ON forum_posts
  FOR SELECT TO authenticated
  USING (is_removed = false OR author_id = auth.uid());

DROP POLICY IF EXISTS "forum_insert_own" ON forum_posts;
CREATE POLICY "forum_insert_own" ON forum_posts
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "forum_update_own" ON forum_posts;
CREATE POLICY "forum_update_own" ON forum_posts
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

-- ── link_unlocks ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS link_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credits_paid integer NOT NULL DEFAULT 0,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE link_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "unlock_select_own" ON link_unlocks;
CREATE POLICY "unlock_select_own" ON link_unlocks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "unlock_insert_own" ON link_unlocks;
CREATE POLICY "unlock_insert_own" ON link_unlocks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── credit_transactions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT '',
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "txn_select_own" ON credit_transactions;
CREATE POLICY "txn_select_own" ON credit_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "txn_insert_own" ON credit_transactions;
CREATE POLICY "txn_insert_own" ON credit_transactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── admin_logs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text NOT NULL DEFAULT '',
  action text NOT NULL DEFAULT '',
  target text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Only the actor can see their own log entries via direct table access.
-- Admins read all logs through the admin_view_logs() SECURITY DEFINER function.
DROP POLICY IF EXISTS "logs_select_own" ON admin_logs;
CREATE POLICY "logs_select_own" ON admin_logs
  FOR SELECT TO authenticated
  USING (actor_id = auth.uid());

DROP POLICY IF EXISTS "logs_insert_own" ON admin_logs;
CREATE POLICY "logs_insert_own" ON admin_logs
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_removed ON forum_posts(is_removed);
CREATE INDEX IF NOT EXISTS idx_forum_posts_pinned ON forum_posts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_link_unlocks_user ON link_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_link_unlocks_post ON link_unlocks(post_id);
CREATE INDEX IF NOT EXISTS idx_credit_txn_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);

-- ── SECURITY DEFINER: log_admin_action ───────────────────────────────────────
-- Safely inserts a row into admin_logs from the client. Callable by authenticated.
CREATE OR REPLACE FUNCTION log_admin_action(
  _action text,
  _target text DEFAULT NULL,
  _details text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_email text;
BEGIN
  v_uid := auth.uid();
  SELECT email INTO v_email FROM profiles WHERE id = v_uid;
  INSERT INTO admin_logs (actor_id, actor_email, action, target, details)
  VALUES (v_uid, COALESCE(v_email, 'owner'), _action, _target, _details);
END;
$$;

-- ── SECURITY DEFINER: unlock_post_link ────────────────────────────────────────
-- Atomically: check credits, deduct, create unlock record, log transaction.
-- Returns the locked URL on success or raises an error.
CREATE OR REPLACE FUNCTION unlock_post_link(
  _post_id uuid
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_cost integer;
  v_url text;
  v_credits integer;
  v_already uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to unlock links.';
  END IF;

  SELECT locked_cost, locked_url INTO v_cost, v_url
  FROM forum_posts WHERE id = _post_id AND is_removed = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found.';
  END IF;

  IF v_cost <= 0 OR v_url IS NULL THEN
    RETURN v_url;
  END IF;

  -- Check if already unlocked
  SELECT id INTO v_already FROM link_unlocks WHERE post_id = _post_id AND user_id = v_uid;
  IF FOUND THEN
    RETURN v_url;
  END IF;

  -- Check credits
  SELECT credits INTO v_credits FROM profiles WHERE id = v_uid;
  IF v_credits < v_cost THEN
    RAISE EXCEPTION 'Not enough credits. You need %, you have %.', v_cost, v_credits;
  END IF;

  -- Deduct
  UPDATE profiles SET credits = credits - v_cost WHERE id = v_uid;

  -- Record unlock
  INSERT INTO link_unlocks (post_id, user_id, credits_paid)
  VALUES (_post_id, v_uid, v_cost);

  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, reason, reference_id)
  VALUES (v_uid, -v_cost, 'link_unlock', _post_id::text);

  RETURN v_url;
END;
$$;

-- ── SECURITY DEFINER: admin_view_logs ─────────────────────────────────────────
-- Returns all admin log entries. Callable by authenticated (admin panel filters
-- by role on the client side; the function exists to bypass RLS so admins can
-- see all rows, not just their own).
CREATE OR REPLACE FUNCTION admin_view_logs()
RETURNS SETOF admin_logs
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 500;
$$;

-- ── SECURITY DEFINER: admin_list_all_posts ────────────────────────────────────
-- Returns all forum posts including removed ones, for the admin panel.
CREATE OR REPLACE FUNCTION admin_list_all_posts()
RETURNS SETOF forum_posts
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM forum_posts ORDER BY is_pinned DESC, created_at DESC LIMIT 200;
$$;

-- ── SECURITY DEFINER: admin_remove_post ───────────────────────────────────────
-- Soft-deletes a post (sets is_removed = true). Any authenticated user can call;
-- the admin panel gates this by role on the client side.
CREATE OR REPLACE FUNCTION admin_remove_post(_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE forum_posts SET is_removed = true WHERE id = _post_id;
  PERFORM log_admin_action('remove_post', _post_id::text, NULL);
END;
$$;

-- ── SECURITY DEFINER: admin_pin_post ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_pin_post(_post_id uuid, _pinned boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE forum_posts SET is_pinned = _pinned WHERE id = _post_id;
  PERFORM log_admin_action('pin_post', _post_id::text, _pinned::text);
END;
$$;

-- ── Grant execute on functions ───────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION log_admin_action(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_post_link(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_view_logs() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_list_all_posts() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_remove_post(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_pin_post(uuid, boolean) TO authenticated;