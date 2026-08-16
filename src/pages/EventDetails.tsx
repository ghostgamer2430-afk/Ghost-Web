import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Calendar, MapPin, Users, Clock, Check, Star, MessageCircle } from "lucide-react";

export default function EventDetailsPage() {
  const { user, loading } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [myRsvp, setMyRsvp] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [rsvping, setRsvping] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) return;
    loadEvent(id);
    loadRsvps(id);
  }, []);

  async function loadEvent(id: string) {
    try {
      const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      setEvent(data);
    } catch { /* ignore */ }
  }

  async function loadRsvps(id: string) {
    try {
      const { data } = await supabase.from("event_rsvps").select("*").eq("event_id", id).order("created_at", { ascending: false });
      setRsvps(data ?? []);
      if (user) {
        const mine = (data ?? []).find((r: any) => r.user_id === user.id || r.user_email === user.email);
        setMyRsvp(mine ?? null);
        setNotes(mine?.notes ?? "");
      }
    } catch { /* ignore */ }
  }

  async function submitRsvp(status: "going" | "maybe" | "not_going") {
    if (!user) return toast.error("Sign in to RSVP");
    if (!event) return;
    setRsvping(true);
    try {
      const payload = {
        event_id: event.id,
        user_id: user.id,
        user_email: user.email,
        display_name: user.email?.split("@")[0] ?? "Member",
        status,
        notes,
      };
      if (myRsvp) {
        const { error } = await supabase.from("event_rsvps").update({ status, notes }).eq("id", myRsvp.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_rsvps").insert(payload);
        if (error) throw error;
      }
      toast.success(`RSVP updated: ${status.replace("_", " ")}`);
      loadRsvps(event.id);
    } catch {
      toast.error("Could not submit RSVP");
    } finally {
      setRsvping(false);
    }
  }

  async function cancelRsvp() {
    if (!myRsvp || !event) return;
    try {
      await supabase.from("event_rsvps").delete().eq("id", myRsvp.id);
      toast.success("RSVP cancelled");
      setMyRsvp(null);
      loadRsvps(event.id);
    } catch {
      toast.error("Could not cancel");
    }
  }

  if (loading) return <PageLayout title="Event Details"><p className="text-muted-foreground">Loading...</p></PageLayout>;
  if (!event) return <PageLayout title="Event Details"><p className="text-muted-foreground">Event not found.</p></PageLayout>;

  const going = rsvps.filter(r => r.status === "going").length;
  const maybe = rsvps.filter(r => r.status === "maybe").length;
  const spotsLeft = Math.max(0, event.capacity - going);

  return (
    <PageLayout title={event.title}>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-primary px-2 py-1 rounded bg-primary/10">{event.category}</span>
            </div>
            {event.description && <p className="text-muted-foreground mb-6">{event.description}</p>}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded border border-border bg-background/50 p-3">
                <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Calendar size={12} /> Date</div>
                <div className="font-bold mt-1">{new Date(event.date).toLocaleString()}</div>
              </div>
              <div className="rounded border border-border bg-background/50 p-3">
                <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1"><MapPin size={12} /> Location</div>
                <div className="font-bold mt-1">{event.location}</div>
              </div>
              <div className="rounded border border-border bg-background/50 p-3">
                <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Users size={12} /> Capacity</div>
                <div className="font-bold mt-1">{event.capacity} spots - {spotsLeft} left</div>
              </div>
              <div className="rounded border border-border bg-background/50 p-3">
                <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Check size={12} /> Going</div>
                <div className="font-bold mt-1">{going} confirmed - {maybe} maybe</div>
              </div>
            </div>
          </div>

          {user && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-black uppercase tracking-wide mb-4">RSVP to this Event</h2>
              {myRsvp && (
                <div className="mb-4 rounded border border-green-600/40 bg-green-900/20 p-3 text-sm">
                  <div className="font-bold text-green-400">Your RSVP: {myRsvp.status.replace("_", " ")}</div>
                  <button onClick={cancelRsvp} className="mt-2 text-xs text-red-400 hover:underline">Cancel RSVP</button>
                </div>
              )}
              <div className="mb-4">
                <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Notes (optional)</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add a note for the organizer..."
                  className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
              </div>
              <div className="flex flex-wrap gap-2">
                {(["going", "maybe", "not_going"] as const).map(s => (
                  <button key={s} onClick={() => submitRsvp(s)} disabled={rsvping}
                    className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest border transition disabled:opacity-50 ${s === "going" ? "border-green-600/50 text-green-400 hover:bg-green-900/20" : s === "maybe" ? "border-yellow-600/50 text-yellow-400 hover:bg-yellow-900/20" : "border-red-600/50 text-red-400 hover:bg-red-900/20"}`}>
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-black uppercase tracking-wide mb-4">Attendees ({rsvps.length})</h2>
            {rsvps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No RSVPs yet. Be the first!</p>
            ) : (
              <div className="space-y-2">
                {rsvps.map(r => (
                  <div key={r.id} className="flex items-center gap-3 rounded border border-border bg-background/50 p-3">
                    <div className={`w-2 h-2 rounded-full ${r.status === "going" ? "bg-green-500" : r.status === "maybe" ? "bg-yellow-500" : "bg-red-500"}`} />
                    <div className="flex-1">
                      <div className="font-bold text-sm">{r.display_name || r.user_email}</div>
                      <div className="text-xs text-muted-foreground uppercase">{r.status.replace("_", " ")}</div>
                    </div>
                    {r.notes && <div className="text-xs text-muted-foreground italic">"{r.notes}"</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-primary bg-card p-5" style={{ boxShadow: "var(--shadow-glow)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Star size={18} className="text-primary" />
              <h3 className="font-black uppercase tracking-wide">Quick Stats</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Confirmed</span><span className="font-bold text-green-400">{going}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Maybe</span><span className="font-bold text-yellow-400">{maybe}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Spots Left</span><span className="font-bold">{spotsLeft}</span></div>
            </div>
          </div>
          {!user && (
            <div className="rounded-lg border border-border bg-card p-5 text-center">
              <MessageCircle size={24} className="mx-auto text-primary mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Sign in to RSVP to this event.</p>
              <a href="/auth" className="block px-4 py-2 rounded text-xs font-bold uppercase tracking-widest text-primary-foreground" style={{ background: "var(--gradient-blood)" }}>
                Sign In
              </a>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
