import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Search, Filter } from "lucide-react";

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("admin_logs").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      setLogs(data ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  const filtered = logs.filter(l => {
    const matchesQuery = `${l.action ?? ""} ${l.actor_email ?? ""} ${l.target ?? ""} ${l.details ?? ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesAction = actionFilter === "all" || l.action?.toLowerCase().includes(actionFilter.toLowerCase());
    return matchesQuery && matchesAction;
  });

  return (
    <PageLayout title="Activity Logs">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Search logs..." value={query} onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
        </div>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none">
          <option value="all">All Actions</option>
          <option value="ban">Bans</option>
          <option value="credit">Credits</option>
          <option value="admin">Admin Changes</option>
          <option value="post">Posts</option>
          <option value="setting">Settings</option>
        </select>
      </div>

      <div className="text-xs text-muted-foreground mb-4 font-bold uppercase tracking-wider">
        {filtered.length} log entr{filtered.length !== 1 ? "ies" : "y"}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No activity logs found.</p>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-auto">
          {filtered.map(l => (
            <div key={l.id} className="rounded border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold flex items-center gap-2">
                    <Activity size={14} className="text-primary shrink-0" />
                    {l.action}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {l.actor_email} {l.target && <span className="text-primary">&rarr; {l.target}</span>}
                  </div>
                  {l.details && <div className="text-sm text-muted-foreground mt-1">{l.details}</div>}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {new Date(l.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
