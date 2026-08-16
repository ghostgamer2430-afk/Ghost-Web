import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Save, Shield, Mail, User, Lock } from "lucide-react";

export default function UserProfilePage() {
  const { user, loading } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [credits, setCredits] = useState(0);
  const [role, setRole] = useState("member");
  const [createdAt, setCreatedAt] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        if (data) {
          setDisplayName(data.display_name ?? "");
          setEmail(data.email ?? user.email ?? "");
          setCredits(data.credits ?? 0);
          setRole(data.role ?? "member");
          setCreatedAt(data.created_at ?? "");
        }
      } catch { /* ignore */ }
    }
    load();
  }, [user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        display_name: displayName,
        email,
      }).eq("id", user.id);
      if (error) throw error;
      toast.success("Profile updated");
    } catch {
      toast.error("Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");
    if (newPassword.length < 8) return toast.error("Password must be at least 8 characters");
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) return <PageLayout title="User Profile"><p className="text-muted-foreground">Loading...</p></PageLayout>;
  if (!user) return <PageLayout title="User Profile"><p className="text-muted-foreground">Please sign in to view your profile. <a href="/auth" className="text-primary underline">Sign in</a></p></PageLayout>;

  return (
    <PageLayout title="User Profile">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <User size={18} className="text-primary" />
            <h2 className="text-lg font-black uppercase tracking-wide">Personal Information</h2>
          </div>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Display Name</label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Role</label>
                <div className="mt-1 px-3 py-2 rounded border border-border bg-secondary text-sm font-bold uppercase">{role}</div>
              </div>
              <div>
                <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Credits</label>
                <div className="mt-1 px-3 py-2 rounded border border-border bg-secondary text-sm font-bold">{credits.toLocaleString()}</div>
              </div>
            </div>
            {createdAt && (
              <div className="text-xs text-muted-foreground">Member since {new Date(createdAt).toLocaleDateString()}</div>
            )}
            <button type="submit" disabled={saving}
              className="w-full px-4 py-3 rounded text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "var(--gradient-blood)" }}>
              <Save size={16} />{saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Lock size={18} className="text-primary" />
            <h2 className="text-lg font-black uppercase tracking-wide">Security Settings</h2>
          </div>
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8}
                placeholder="Enter new password"
                className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8}
                placeholder="Re-enter new password"
                className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
            </div>
            <button type="submit" disabled={savingPassword}
              className="w-full px-4 py-3 rounded text-sm font-bold uppercase tracking-widest border border-primary text-primary hover:bg-primary/10 disabled:opacity-50 flex items-center justify-center gap-2">
              <Shield size={16} />{savingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail size={14} className="text-primary" />
              <span>Account email: {user.email}</span>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
