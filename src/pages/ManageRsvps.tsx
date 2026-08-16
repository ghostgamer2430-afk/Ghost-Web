import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isOwnerSession } from "@/lib/owner";
import { toast } from "sonner";
import { Calendar, Users, Check, X, Clock, Search } from "lucide-react";

export default function ManageRsvpsPage() {
  const { isAdmin, loading } = useAuth();
  const [owner] = useState(() => isOwnerSession());
  const canManage = owner || isAdmin;
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [filterEvent, setFilterEvent] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [{ data: rsvpData }, { data: eventData }] = await Promise.all([
        supabase.from("event_rsvps").select("*").order("created_at", { ascending: false }),
        supabase.from("events").select("*").order("date", { ascending: true }),
      ]);
      setRsvps(rsvpData ?? []);
      setEvents(eventData ?? []);
    } catch { /* ignore */ }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await supabase.from("event_rsvps").update({ status }).eq("id", id);
      toast.success(`RSVP updated: ${status.replace("_", " ")}`);
      load();
    } catch {
      toast.error("Could not update RSVP");
    }
  }

  async function removeRsvp(id: string) {
    if (!confirm("Remove this RSVP?")) return;
    try {
      await supabase.from("event_rsvps").delete().eq("id", id);
      toast.success("RSVP removed");
      load();
    } catch { /* ignore */ }
  }

  if (loading) return <PageLayout title="Manage RSVPs"><p className="text-muted-foreground">Loading...</p></PageLayout>;

  const eventMap = new Map((events ?? []).map((e: any) => [e.id, e]));
  const filtered = rsvps.filter(r => {
    const matchesEvent = filterEvent === "all" || r.event_id === filterEvent;
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    const matchesQuery = `${r.display_name ?? ""} ${r.user_email ?? ""} ${r.notes ?? ""}`.toLowerCase().includes(query.toLowerCase());
    return matchesEvent && matchesStatus && matchesQuery;
  });

  const stats = {
    total: rsvps.length,
    going: rsvps.filter(r => r.status === "going").length,
    maybe: rsvps.filter(r => r.status === "maybe").length,
    notGoing: rsvps.filter(r => r.status === "not_going").length,
  };

  return (
    <PageLayout title="Manage RSVPs">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded border border-border bg-card p-3"><div className="text-xs uppercase text-muted-foreground">Total</div><div className="text-2xl font-black">{stats.total}</div></div>
        <div className="rounded border border-green-600/30 bg-green-900/10 p-3"><div className="text-xs uppercase text-green-400">Going</div><div className="text-2xl font-black text-green-400">{stats.going}</div></div>
        <div className="rounded border border-yellow-600/30 bg-yellow-900/10 p-3"><div className="text-xs uppercase text-yellow-400">Maybe</div><div className="text-2xl font-black text-yellow-400">{stats.maybe}</div></div>
        <div className="rounded border border-red-600/30 bg-red-900/10 p-3"><div className="text-xs uppercase text-red-400">Not Going</div><div className="text-2xl font-black text-red-400">{stats.notGoing}</div></div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Search by name or email..." value={query} onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
        </div>
        <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)} className="px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none">
          <option value="all">All Events</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none">
          <option value="all">All Statuses</option>
          <option value="going">Going</option>
          <option value="maybe">Maybe</option>
          <option value="not_going">Not Going</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No RSVPs found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const ev = eventMap.get(r.event_id);
            return (
              <div key={r.id} className="rounded border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold">{r.display_name || r.user_email}</div>
                    <div className="text-xs text-muted-foreground">{r.user_email}</div>
                    {ev && <div className="text-xs text-primary mt-1 flex items-center gap-1"><Calendar size={10} /> {ev.title} - {new Date(ev.date).toLocaleDateString()}</div>}
                    {r.notes && <div className="text-xs text-muted-foreground italic mt-1">"{r.notes}"</div>}
                    <div className="text-xs text-muted-foreground mt-1">RSVP'd {new Date(r.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${r.status === "going" ? "bg-green-900/40 text-green-400" : r.status === "maybe" ? "bg-yellow-900/40 text-yellow-400" : "bg-red-900/40 text-red-400"}`}>
                      {r.status.replace("_", " ")}
                    </span>
                    {canManage && (
                      <button onClick={() => removeRsvp(r.id)} className="p-1.5 rounded border border-border text-muted-foreground hover:text-red-400">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
