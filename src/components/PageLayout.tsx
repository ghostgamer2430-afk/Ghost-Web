import { Link } from "@tanstack/react-router";
import { Skull } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isOwnerSession, ownerLogout } from "@/lib/owner";
import { signOutLocal } from "@/lib/localAuth";
import { signOutSupabase } from "@/lib/supabase-safe";
import { useState } from "react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/events", label: "Events" },
  { href: "/announcements", label: "Announcements" },
  { href: "/membership-plans", label: "Memberships" },
  { href: "/member-directory", label: "Members" },
  { href: "/user-profile", label: "My Profile" },
  { href: "/payment-history", label: "Payments" },
  { href: "/activity-logs", label: "Activity Logs" },
  { href: "/manage-rsvps", label: "RSVPs" },
  { href: "/admin-settings", label: "Admin Settings" },
  { href: "/registration-request", label: "Join" },
];

export function PageLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const { user, isAdmin, loading } = useAuth();
  const [owner] = useState(() => isOwnerSession());
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    ownerLogout();
    signOutLocal();
    await signOutSupabase();
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Skull className="text-primary" size={20} />
            <span className="font-black tracking-widest text-sm hidden sm:inline">CITY OF FEARS</span>
          </Link>
          <div className="hidden lg:flex items-center gap-5 text-xs font-medium text-muted-foreground">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-primary transition uppercase tracking-wider">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {user || owner ? (
              <button onClick={handleSignOut} className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider border border-border bg-secondary hover:bg-accent transition">
                Sign Out
              </button>
            ) : (
              <a href="/auth" className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider border border-border bg-secondary hover:bg-accent transition">
                Login
              </a>
            )}
            <button onClick={() => setMenuOpen(v => !v)} className="lg:hidden p-2 rounded border border-border">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="lg:hidden border-t border-border bg-card px-6 py-4 grid grid-cols-2 gap-2">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary py-1">
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <main className="pt-20 pb-12 px-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-6">{title}</h1>
        {children}
      </main>

      <footer className="border-t border-border py-6 px-6 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Skull size={14} className="text-primary" />
          <span className="font-black tracking-widest">CITY OF FEARS RP</span>
        </div>
        <p>&copy; {new Date().getFullYear()} City of Fears Roleplay.</p>
      </footer>
    </div>
  );
}
