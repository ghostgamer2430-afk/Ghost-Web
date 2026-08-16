import { useEffect, useState, useMemo } from "react";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isOwnerSession } from "@/lib/owner";
import { Search, Users, Ban, Trash2, RefreshCw, Crown } from "lucide-react";
import { toast } from "sonner";

export default function MemberDirectoryPage() {
  const { isAdmin, loading } = useAuth();
  const [owner] = useState(() => isOwnerSession());
  const [members, setMembers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const canManage = owner || isAdmin;

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setMembers(data ?? []);
    } catch { /* ignore */ }
  }

  const filtered = useMemo(() => members.filter(m => {
    const matchesQuery = `${m.email ?? ""} ${m.display_name ?? ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    return matchesQuery && matchesRole;
  }), [members, query, roleFilter]);

  async function toggleBan(member: any) {
    if (!canManage) return;
    try {
      const { error } = await supabase.from("profiles").update({ is_banned: !member.is_banned }).eq("id", member.id);
      if (error) throw error;
      toast.success(member.is_banned ? "Unbanned" : "Banned");
      load();
    } catch (err) {
      toast.error("Could not update member");
    }
  }

  async function deleteMember(member: any) {
    if (!owner) return toast.error("Owner only");
    if (!confirm(`Remove ${member.email}?`)) return;
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", member.id);
      if (error) throw error;
      toast.success("Member removed");
      load();
    } catch {
      toast.error("Could not remove member");
    }
  }

  if (loading) return <PageLayout title="Member Directory"><p className="text-muted-foreground">Loading...</p></PageLayout>;

  return (
    <PageLayout title="Member Directory">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search by name or email..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none">
          <option value="all">All Roles</option>
          <option value="member">Members</option>
          <option value="admin">Admins</option>
        </select>
        <button onClick={load} className="px-3 py-2 rounded border border-border hover:bg-accent transition">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="text-xs text-muted-foreground mb-4 font-bold uppercase tracking-wider">
        {filtered.length} member{filtered.length !== 1 ? "s" : ""}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No members found.</p>}
        {filtered.map(m => (
          <div key={m.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <div className="font-bold flex items-center gap-2 flex-wrap">
                  {m.display_name || m.email || m.id}
                  {m.role === "admin" && <Crown size={14} className="text-primary" />}
                  {m.is_banned && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/40 text-red-400 font-bold uppercase">Banned</span>}
                </div>
                <div className="text-xs text-muted-foreground truncate">{m.email}</div>
              </div>
              {canManage && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => toggleBan(m)} disabled={!canManage}
                    className={`p-1.5 rounded border text-xs ${m.is_banned ? "border-green-600/50 text-green-400" : "border-red-600/50 text-red-400"} hover:bg-accent disabled:opacity-40`}>
                    <Ban size={14} />
                  </button>
                  {owner && (
                    <button onClick={() => deleteMember(m)} disabled={!owner}
                      className="p-1.5 rounded border border-border text-muted-foreground hover:text-red-400 hover:border-red-600/50 disabled:opacity-40">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {(m.credits ?? 0).toLocaleString()} credits - Joined {m.created_at ? new Date(m.created_at).toLocaleDateString() : "N/A"}
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
