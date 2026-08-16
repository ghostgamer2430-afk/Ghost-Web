import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isOwnerSession } from "@/lib/owner";
import { Activity, Users, Calendar, DollarSign, AlertTriangle, TrendingUp, Server, Shield } from "lucide-react";

type Metric = { label: string; value: string; icon: typeof Activity; color: string };

export default function DashboardPage() {
  const { user, isAdmin, loading } = useAuth();
  const [owner] = useState(() => isOwnerSession());
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [{ count: memberCount }, { count: eventCount }, { count: annCount }, { data: logs }] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("events").select("*", { count: "exact", head: true }),
          supabase.from("announcements").select("*", { count: "exact", head: true }),
          supabase.from("admin_logs").select("*").order("created_at", { ascending: false }).limit(8),
        ]);
        setMetrics([
          { label: "Total Members", value: String(memberCount ?? 0), icon: Users, color: "text-blue-400" },
          { label: "Upcoming Events", value: String(eventCount ?? 0), icon: Calendar, color: "text-green-400" },
          { label: "Announcements", value: String(annCount ?? 0), icon: AlertTriangle, color: "text-yellow-400" },
          { label: "Admin Actions", value: String(logs?.length ?? 0), icon: Activity, color: "text-primary" },
        ]);
        setRecentLogs(logs ?? []);
      } catch { /* table may be empty */ }

      try {
        const { data: events } = await supabase.from("events").select("*").order("date", { ascending: true }).limit(5);
        setRecentEvents(events ?? []);
      } catch { /* ignore */ }

      try {
        const { data: anns } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(5);
        setRecentAnnouncements(anns ?? []);
      } catch { /* ignore */ }

      try {
        const { data: maint } = await supabase.from("site_settings").select("value").eq("key", "maintenance").maybeSingle();
        setMaintenance(maint?.value?.enabled ?? false);
      } catch { /* ignore */ }
    }
    load();
  }, []);

  if (loading) return <PageLayout title="Dashboard"><p className="text-muted-foreground">Loading...</p></PageLayout>;

  return (
    <PageLayout title="System Dashboard">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={m.color} />
                <span className="text-xs uppercase tracking-widest text-muted-foreground">{m.label}</span>
              </div>
              <div className="text-3xl font-black">{m.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-primary" />
            <h2 className="text-lg font-black uppercase tracking-wide">Recent Activity</h2>
          </div>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-auto">
              {recentLogs.map((log) => (
                <div key={log.id} className="rounded border border-border bg-background/50 p-3 text-sm">
                  <div className="font-bold">{log.action}</div>
                  <div className="text-xs text-muted-foreground">{log.actor_email} {log.target ? `-> ${log.target}` : ""}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{new Date(log.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-primary" />
            <h2 className="text-lg font-black uppercase tracking-wide">Upcoming Events</h2>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming events.</p>
          ) : (
            <div className="space-y-2">
              {recentEvents.map((ev) => (
                <Link key={ev.id} href={`/event-details?id=${ev.id}`} className="block rounded border border-border bg-background/50 p-3 hover:border-primary transition">
                  <div className="font-bold">{ev.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(ev.date).toLocaleDateString()} - {ev.location}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-primary" />
            <h2 className="text-lg font-black uppercase tracking-wide">Recent Announcements</h2>
          </div>
          {recentAnnouncements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          ) : (
            <div className="space-y-2">
              {recentAnnouncements.map((a) => (
                <div key={a.id} className="rounded border border-border bg-background/50 p-3">
                  <div className="font-bold flex items-center gap-2">
                    {a.is_pinned && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold uppercase">Pinned</span>}
                    {a.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{new Date(a.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Server size={18} className="text-primary" />
            <h2 className="text-lg font-black uppercase tracking-wide">Site Status</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Maintenance Mode</span>
              <span className={`text-xs font-bold px-2 py-1 rounded ${maintenance ? "bg-red-900/40 text-red-400" : "bg-green-900/40 text-green-400"}`}>
                {maintenance ? "ACTIVE" : "OFF"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Auth System</span>
              <span className="text-xs font-bold px-2 py-1 rounded bg-green-900/40 text-green-400">ONLINE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Database</span>
              <span className="text-xs font-bold px-2 py-1 rounded bg-green-900/40 text-green-400">CONNECTED</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your Role</span>
              <span className="text-xs font-bold px-2 py-1 rounded bg-primary/20 text-primary uppercase">
                {owner ? "Owner" : isAdmin ? "Admin" : user ? "Member" : "Guest"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
