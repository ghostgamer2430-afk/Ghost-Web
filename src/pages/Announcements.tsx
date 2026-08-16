import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isOwnerSession } from "@/lib/owner";
import { toast } from "sonner";
import { Megaphone, Pin, Trash2, Plus, Bell, AlertTriangle, Calendar } from "lucide-react";

export default function AnnouncementsPage() {
  const { isAdmin, loading } = useAuth();
  const [owner] = useState(() => isOwnerSession());
  const canManage = owner || isAdmin;
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", type: "info" as "info" | "warning" | "event" });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
      setAnnouncements(data ?? []);
    } catch { /* ignore */ }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    if (!form.title.trim() || !form.body.trim()) return toast.error("Fill in all fields");
    try {
      const { error } = await supabase.from("announcements").insert({
        title: form.title,
        body: form.body,
        type: form.type,
        is_pinned: false,
        is_active: true,
      });
      if (error) throw error;
      toast.success("Announcement posted");
      setForm({ title: "", body: "", type: "info" });
      setShowForm(false);
      load();
    } catch {
      toast.error("Could not post announcement");
    }
  }

  async function togglePin(a: any) {
    if (!canManage) return;
    try {
      await supabase.from("announcements").update({ is_pinned: !a.is_pinned }).eq("id", a.id);
      load();
    } catch { /* ignore */ }
  }

  async function remove(id: string) {
    if (!canManage) return;
    if (!confirm("Delete this announcement?")) return;
    try {
      await supabase.from("announcements").delete().eq("id", id);
      toast.success("Announcement deleted");
      load();
    } catch { /* ignore */ }
  }

  if (loading) return <PageLayout title="Announcements"><p className="text-muted-foreground">Loading...</p></PageLayout>;

  const typeColor: Record<string, string> = {
    info: "border-blue-500/40 text-blue-300",
    warning: "border-yellow-500/40 text-yellow-300",
    event: "border-primary text-primary",
  };
  const typeIcon: Record<string, typeof Bell> = {
    info: Bell,
    warning: AlertTriangle,
    event: Calendar,
  };

  const sorted = [...announcements].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));

  return (
    <PageLayout title="Announcements">
      {canManage && (
        <button onClick={() => setShowForm(v => !v)}
          className="mb-6 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest text-primary-foreground flex items-center gap-2"
          style={{ background: "var(--gradient-blood)" }}>
          <Plus size={16} />{showForm ? "Cancel" : "Post Announcement"}
        </button>
      )}

      {showForm && canManage && (
        <form onSubmit={create} className="mb-6 rounded-lg border border-border bg-card p-6 space-y-4">
          <div>
            <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Title</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Body</label>
            <textarea required rows={3} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
          </div>
          <div className="flex gap-2">
            {(["info", "warning", "event"] as const).map(t => (
              <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`px-3 py-2 rounded border text-xs font-bold uppercase ${form.type === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>
                {t}
              </button>
            ))}
            <button type="submit" className="ml-auto px-4 py-2 rounded text-xs font-bold uppercase text-primary-foreground" style={{ background: "var(--gradient-blood)" }}>
              Post
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No announcements yet.</p>
      ) : (
        <div className="space-y-4">
          {sorted.map(a => {
            const Icon = typeIcon[a.type] ?? Bell;
            return (
              <div key={a.id} className={`rounded-lg border p-5 ${a.is_pinned ? "border-primary bg-card" : "border-border bg-card/80"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {a.is_pinned && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold uppercase flex items-center gap-1"><Pin size={10} />Pinned</span>}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase ${typeColor[a.type] ?? ""}`}>
                        <Icon size={10} className="inline mr-1" />{a.type}
                      </span>
                    </div>
                    <h3 className="font-black text-lg">{a.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{a.body}</p>
                    <div className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleString()}</div>
                  </div>
                  {canManage && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => togglePin(a)} className={`p-1.5 rounded border ${a.is_pinned ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-primary"}`}>
                        <Pin size={14} />
                      </button>
                      <button onClick={() => remove(a.id)} className="p-1.5 rounded border border-border text-muted-foreground hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
