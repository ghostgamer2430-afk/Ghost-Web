import { useEffect, useState } from "react";
import { getLocalSessionUser, isSupabaseFetchError } from "@/lib/localAuth";
import { isOwnerSession } from "@/lib/owner";

export type LocalUserSession = {
  id: string;
  email: string;
  role: "member" | "admin";
};

export function useAuth() {
  const [user, setUser] = useState<LocalUserSession | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  function loadSession() {
    if (isOwnerSession()) {
      setUser({ id: "owner", email: "owner@cityoffears.local", role: "admin" });
      setIsAdmin(true);
      return true;
    }
    const local = getLocalSessionUser();
    if (local) {
      setUser({ id: local.id, email: local.email, role: local.role });
      setIsAdmin(local.role === "admin");
      return true;
    }
    setUser(null);
    setIsAdmin(false);
    return false;
  }

  useEffect(() => {
    loadSession();
    setLoading(false);

    // Poll for session changes (e.g. after login in another component)
    const interval = setInterval(() => {
      loadSession();
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Expose a fake session object compatible with supabase Session shape
  const session = user ? ({ user: { id: user.id, email: user.email } } as any) : null;

  return { session, user, isAdmin, loading };
}
