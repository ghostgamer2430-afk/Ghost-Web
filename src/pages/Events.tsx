import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isOwnerSession } from "@/lib/owner";
import { toast } from "sonner";
import { Calendar, MapPin, Users, Plus, Trash2, Star, Clock } from "lucide-react";

export default function EventsPage() {
  const { isAdmin, loading } = useAuth();
  const [owner] = useState(() => isOwnerSession());
  const canManage = owner || isAdmin;
  const [events, setEvents] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "", location: "", capacity: 50, category: "general" });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data } = await supabase.from("events").select("*").order("date", { ascending: true });
      setEvents(data ?? []);
    } catch { /* ignore */ }
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    try {
      const { error } = await supabase.from("events").insert({
        title: form.title,
        description: form.description,
        date: new Date(form.date).toISOString(),
        location: form.location,
        capacity: Number(form.capacity),
        category: form.category,
      });
      if (error) throw error;
      toast.success("Event created");
      setForm({ title: "", description: "", date: "", location: "", capacity: 50, category: "general" });
      setShowForm(false);
      load();
    } catch {
      toast.error("Could not create event");
    }
  }

  async function deleteEvent(id: string) {
    if (!owner) return;
    if (!confirm("Delete this event?")) return;
    try {
      await supabase.from("events").delete().eq("id", id);
      toast.success("Event deleted");
      load();
    } catch {
      toast.error("Could not delete event");
    }
  }

  if (loading) return <PageLayout title="Events Calendar"><p className="text-muted-foreground">Loading...</p></PageLayout>;

  return (
    <PageLayout title="Events Calendar">
      {canManage && (
        <button onClick={() => setShowForm(v => !v)}
          className="mb-6 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest text-primary-foreground flex items-center gap-2"
          style={{ background: "var(--gradient-blood)" }}>
          <Plus size={16} />{showForm ? "Cancel" : "Create Event"}
        </button>
      )}

      {showForm && canManage && (
        <form onSubmit={createEvent} className="mb-6 rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Event Title</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Date & Time</label>
              <input required type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Location</label>
              <input required value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Capacity</label>
              <input type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
                className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
          </div>
          <button type="submit" className="px-4 py-2 rounded text-sm font-bold uppercase tracking-widest text-primary-foreground" style={{ background: "var(--gradient-blood)" }}>
            Create Event
          </button>
        </form>
      )}

      {events.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No upcoming events. {canManage && "Create one to get started."}</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(ev => (
            <div key={ev.id} className="rounded-lg border border-border bg-card p-5 hover:border-primary transition">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="font-black text-lg">{ev.title}</div>
                  <div className="text-xs text-primary uppercase tracking-wider mt-1">{ev.category}</div>
                </div>
                {owner && (
                  <button onClick={() => deleteEvent(ev.id)} className="p-1.5 rounded text-muted-foreground hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {ev.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{ev.description}</p>}
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Calendar size={12} className="text-primary" /> {new Date(ev.date).toLocaleString()}</div>
                <div className="flex items-center gap-2"><MapPin size={12} className="text-primary" /> {ev.location}</div>
                <div className="flex items-center gap-2"><Users size={12} className="text-primary" /> {ev.capacity} spots</div>
              </div>
              <Link href={`/event-details?id=${ev.id}`}
                className="mt-4 block text-center px-4 py-2 rounded text-xs font-bold uppercase tracking-widest border border-border hover:bg-accent transition">
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
