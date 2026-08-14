import { supabase } from "@/integrations/supabase/client";

// `supabase` is a lazy Proxy: the client is constructed on first property
// access, and that constructor THROWS when the Supabase env vars are absent —
// which is this site's current state. So `supabase.auth` / `supabase.from`
// throws *before* the query method is ever called, meaning a trailing
// `.catch(...)` is never attached and the error escapes synchronously.
//
// When that happens inside a `useEffect`, React forwards the throw to the
// nearest error boundary and the whole page is replaced by the error screen.
// Everything below exists to keep an unconfigured Supabase from doing that.

/** Runs a Supabase query, absorbing both the sync Proxy throw and any rejection. */
export async function safeSupabaseQuery<T>(run: () => PromiseLike<T>): Promise<T | null> {
  try {
    return await run();
  } catch {
    return null;
  }
}

/**
 * Best-effort Supabase sign-out. Local sign-out (see localAuth/owner) is what
 * this app actually relies on, so a missing or failing Supabase must not stop
 * the navigation that follows the call.
 */
export async function signOutSupabase(): Promise<void> {
  await safeSupabaseQuery(() => supabase.auth.signOut());
}
