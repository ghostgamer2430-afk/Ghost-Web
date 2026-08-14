/*
# Add increment_post_views function

## Overview
Adds a SECURITY DEFINER function to atomically increment a post's view count.
Called when a user opens a forum post.

## New Functions
- `increment_post_views(_post_id uuid)` — increments views column by 1.
*/

CREATE OR REPLACE FUNCTION increment_post_views(_post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE forum_posts SET views = views + 1 WHERE id = _post_id;
$$;

GRANT EXECUTE ON FUNCTION increment_post_views(uuid) TO authenticated;