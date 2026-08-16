import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isOwnerSession } from "@/lib/owner";
import { DollarSign, Clock, Check, X, Search, RefreshCw } from "lucide-react";

export default function PaymentHistoryPage() {
  const { user, isAdmin, loading } = useAuth();
  const [owner] = useState(() => isOwnerSession());
  const canManage = owner || isAdmin;
  const [payments, setPayments] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { load(); }, [user]);

  async function load() {
    try {
      let q = supabase.from("payment_history").select("*").order("created_at", { ascending: false });
      if (!canManage && user) {
        q = q.eq("user_email", user.email ?? "");
      }
      const { data } = await q.limit(100);
      setPayments(data ?? []);
    } catch { /* ignore */ }
  }

  const filtered = payments.filter(p => {
    const matchesQuery = `${p.item_name ?? ""} ${p.user_email ?? ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const totalPaid = payments.filter(p => p.status === "completed").reduce((a, p) => a + Number(p.amount), 0);
  const totalPending = payments.filter(p => p.status === "pending").length;

  if (loading) return <PageLayout title="Payment History"><p className="text-muted-foreground">Loading...</p></PageLayout>;

  return (
    <PageLayout title="Payment History">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded border border-border bg-card p-3">
          <div className="text-xs uppercase text-muted-foreground">Total Completed</div>
          <div className="text-2xl font-black text-green-400">${totalPaid.toFixed(2)}</div>
        </div>
        <div className="rounded border border-border bg-card p-3">
          <div className="text-xs uppercase text-muted-foreground">Pending</div>
          <div className="text-2xl font-black text-yellow-400">{totalPending}</div>
        </div>
        <div className="rounded border border-border bg-card p-3">
          <div className="text-xs uppercase text-muted-foreground">Total Records</div>
          <div className="text-2xl font-black">{payments.length}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Search payments..." value={query} onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none">
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <button onClick={load} className="px-3 py-2 rounded border border-border hover:bg-accent transition">
          <RefreshCw size={16} />
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No payment records found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className="rounded border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold flex items-center gap-2">
                    <DollarSign size={14} className="text-primary" />
                    {p.item_name}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase">{p.item_type}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{p.user_email}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{new Date(p.created_at).toLocaleString()}</div>
                  {p.method && <div className="text-xs text-muted-foreground mt-0.5">Method: {p.method}</div>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-lg font-black">${Number(p.amount).toFixed(2)}</div>
                  <span className={`text-xs font-bold px-2 py-1 rounded uppercase flex items-center gap-1 ${p.status === "completed" ? "bg-green-900/40 text-green-400" : p.status === "pending" ? "bg-yellow-900/40 text-yellow-400" : "bg-red-900/40 text-red-400"}`}>
                    {p.status === "completed" ? <Check size={10} /> : p.status === "pending" ? <Clock size={10} /> : <X size={10} />}
                    {p.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
