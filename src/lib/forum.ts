import { supabase } from "@/integrations/supabase/client";
import { safeStorage } from "./safe-storage";
import { getLocalSessionUser } from "./localAuth";

export type ForumPost = {
  id: string;
  author_id: string;
  author_email: string;
  author_display_name: string;
  title: string;
  body: string;
  locked_url: string | null;
  locked_cost: number;
  category: string;
  is_pinned: boolean;
  is_removed: boolean;
  views: number;
  created_at: string;
};

export type AdminLog = {
  id: string;
  actor_id: string | null;
  actor_email: string;
  action: string;
  target: string | null;
  details: string | null;
  created_at: string;
};

export const POST_COST = 100;
export const FORUM_CATEGORIES = [
  "general", "announcements", "marketplace", "vehicles", "properties",
  "jobs", "gangs", "events", "guides", "off-topic",
];

export function parseLockedLink(body: string): { url: string; cost: number } | null {
  const match = body.match(/\[locked:(\d+)\](.*?)\[\/locked\]/i);
  if (!match) return null;
  return { cost: parseInt(match[1], 10), url: match[2].trim() };
}

export function stripLockedLink(body: string): string {
  return body.replace(/\[locked:\d+\].*?\[\/locked\]/gi, "[Locked Content — Pay to Unlock]");
}

export function getLocalUserId(): string {
  const u = getLocalSessionUser();
  return u?.id ?? "guest";
}

export function getLocalEmail(): string {
  const u = getLocalSessionUser();
  return u?.email ?? "guest@local";
}

export function getLocalDisplayName(): string {
  const u = getLocalSessionUser();
  return u?.display_name ?? u?.email?.split("@")[0] ?? "Guest";
}

export async function fetchPosts(): Promise<ForumPost[]> {
  const { data, error } = await supabase
    .from("forum_posts")
    .select("*")
    .eq("is_removed", false)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllPostsAdmin(): Promise<ForumPost[]> {
  const { data, error } = await supabase.rpc("admin_list_all_posts");
  if (error) throw error;
  return data ?? [];
}

export async function createPost(opts: {
  title: string;
  body: string;
  category?: string;
  lockedUrl?: string;
  lockedCost?: number;
}): Promise<ForumPost> {
  const userId = getLocalUserId();
  const email = getLocalEmail();
  const displayName = getLocalDisplayName();
  const { data, error } = await supabase
    .from("forum_posts")
    .insert({
      author_id: userId,
      author_email: email,
      author_display_name: displayName,
      title: opts.title,
      body: opts.body,
      locked_url: opts.lockedUrl ?? null,
      locked_cost: opts.lockedCost ?? 0,
      category: opts.category ?? "general",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function unlockLink(postId: string): Promise<string> {
  const { data, error } = await supabase.rpc("unlock_post_link", { _post_id: postId });
  if (error) throw error;
  return data as string;
}

export async function checkUnlocked(postId: string): Promise<boolean> {
  const userId = getLocalUserId();
  const { data, error } = await supabase
    .from("link_unlocks")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export async function adminRemovePost(postId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_remove_post", { _post_id: postId });
  if (error) throw error;
}

export async function adminPinPost(postId: string, pinned: boolean): Promise<void> {
  const { error } = await supabase.rpc("admin_pin_post", { _post_id: postId, _pinned: pinned });
  if (error) throw error;
}

export async function fetchAdminLogs(): Promise<AdminLog[]> {
  const { data, error } = await supabase.rpc("admin_view_logs");
  if (error) throw error;
  return data ?? [];
}

export async function logAction(action: string, target?: string, details?: string): Promise<void> {
  try {
    await supabase.rpc("log_admin_action", {
      _action: action,
      _target: target ?? null,
      _details: details ?? null,
    });
  } catch { /* best-effort */ }
}

export async function incrementViews(postId: string): Promise<void> {
  try {
    await supabase.rpc("increment_post_views", { _post_id: postId });
  } catch { /* best-effort */ }
}
