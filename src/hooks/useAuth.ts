import { useEffect, useState } from "react";
import { getLocalSessionUser } from "@/lib/localAuth";
import { isOwnerSession } from "@/lib/owner";
import { safeSupabaseQuery } from "@/lib/supabase-safe";
import { supabase } from "@/integrations/supabase/client";

export type LocalUserSession = {
  id: string;
  email: string;
  role: "member" | "admin";
};

export function useAuth() {
  const [user, setUser] = useState<LocalUserSession | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      // Owner session takes priority
      if (isOwnerSession()) {
        if (mounted) {
          setUser({ id: "owner", email: "owner@cityoffears.local", role: "admin" });
          setIsAdmin(true);
          setLoading(false);
        }
        return;
      }

      // Check local session first (synchronous, instant)
      const local = getLocalSessionUser();
      if (local) {
        if (mounted) {
          setUser({ id: local.id, email: local.email, role: local.role });
          setIsAdmin(local.role === "admin");
          setLoading(false);
        }
        return;
      }

      // Check Supabase auth session
      const result = await safeSupabaseQuery(() => supabase.auth.getSession());
      const sbSession = result?.data?.session;
      if (sbSession?.user) {
        // Fetch the user's role from profiles table
        const profileResult = await safeSupabaseQuery(() =>
          supabase.from("profiles").select("role,is_banned").eq("id", sbSession.user.id).maybeSingle(),
        );
        const profile = profileResult?.data;
        const role = profile?.role === "admin" ? "admin" : "member";
        if (mounted) {
          setUser({ id: sbSession.user.id, email: sbSession.user.email ?? "", role });
          setIsAdmin(role === "admin" && !profile?.is_banned);
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    }

    loadSession();

    // Listen for Supabase auth state changes
    let unsubscribe: (() => void) | undefined;
    safeSupabaseQuery(() => supabase.auth.onAuthStateChange(() => {
      loadSession();
    })).then((sub: any) => {
      if (sub?.data?.subscription?.unsubscribe) {
        unsubscribe = sub.data.subscription.unsubscribe;
      }
    });

    // Poll for local session changes (owner/local login in other tabs)
    const interval = setInterval(loadSession, 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
      unsubscribe?.();
    };
  }, []);

  // Expose a fake session object compatible with supabase Session shape
  const session = user ? ({ user: { id: user.id, email: user.email } } as any) : null;

  return { session, user, isAdmin, loading };
}
