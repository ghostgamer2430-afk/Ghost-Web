import { signOutSupabase, safeSupabaseQuery } from "@/lib/supabase-safe";
import { safeStorage } from "@/lib/safe-storage";
import { Link, useLocation } from "@/lib/wouter-compat";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Skull, LogOut, Shield, Wrench, Users, Coins, Newspaper, Gift, Save,
  UserPlus, Ban, CheckCircle2, Search, Crown, Sparkles, PlusCircle, Trash2,
  RefreshCcw, Gamepad2, Megaphone, BarChart3, ShoppingBag, Calendar, Ticket,
  TrendingUp, TrendingDown, Eye, EyeOff, Star, Bell, Settings, FileText,
  Lock, Unlock, DollarSign, Package, Zap, Trophy, MessageCircle, Activity,
  Timer, Clock, RotateCcw, KeyRound, ClipboardCopy, Percent, Tag, Smartphone, Check, X,
} from "lucide-react";
import { isOwnerSession, ownerLogin, ownerLogout, OWNER_USERNAME, OWNER_USERNAME_KEY, OWNER_PASSWORD_KEY, getOwnerCredentials } from "@/lib/owner";
import { ALL_TIERS, ALL_PACKS, createLicenseKey, getLicenseKeys, deactivateLicenseKey, getSupportTickets, replyToTicket, updateTicketStatus, assignKeyToTicket, type TierName, type PackName, type KeyType, type SupportTicket } from "@/lib/licenseKeys";
import { getLocalUsers, promoteLocalAdmin, removeLocalAdmin, updateLocalMember, deleteLocalMember, addLocalSiteMember, signOutLocal, signInLocal, createLocalMember, isSupabaseFetchError } from "@/lib/localAuth";
import { getCoupons, createCoupon, deleteCoupon, toggleCoupon, couponStatus, type CouponCode } from "@/lib/couponCodes";
import { BUILT_IN_ROOMS, getCustomRooms, getMessages, deleteMessage, deleteRoom, tierColor, formatTimeLeft, type ChatRoom, type ChatMessage } from "@/lib/chatRooms";
import { getPhoneRequests, decidePhoneRequest, deletePhoneRequest, PHONE_PRICE, PHONE_NAME, type PhoneRequest } from "@/lib/phoneAccess";
import { syncPhoneDiscordRole } from "@/lib/phoneNotify.functions";
import { getAdminNotifications, unreadAdminCount, markAllAdminNotificationsRead, markAdminNotificationRead, deleteAdminNotification, clearAdminNotifications, type AdminNotification } from "@/lib/adminNotifications";
import { fetchAllPostsAdmin, adminRemovePost, adminPinPost, fetchAdminLogs, logAction, type ForumPost as FPost, type AdminLog as ALog } from "@/lib/forum";

type Tab = "overview" | "admins" | "members" | "maintenance" | "licenses" | "credits" | "posts" | "wheel" | "casino" | "announcements" | "bans" | "analytics" | "store" | "events" | "tickets" | "settings" | "coupons" | "chat" | "phone" | "sales" | "logs" | "forum";
const db = supabase as any;
const hasSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const noSupabaseError = () => new Error("Supabase is not configured, using local website accounts.");
const inputCls = "w-full px-3 py-2 rounded border border-fuchsia-400/35 bg-input text-foreground focus:border-fuchsia-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/35";
const fuchsiaPanel = "border-fuchsia-400/35 bg-fuchsia-950/10 shadow-[0_0_35px_rgba(217,70,239,0.20)]";
function AdminLoginGate() {
  const [ownerUser, setOwnerUser] = useState("");
  const [ownerPass, setOwnerPass] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPass, setMemberPass] = useState("");
  const [showOwnerPass, setShowOwnerPass] = useState(false);
  const [showMemberPass, setShowMemberPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"owner" | "member">("owner");

  function handleOwnerLogin(e: React.FormEvent) {
    e.preventDefault();
    if (ownerLogin(ownerUser, ownerPass)) {
      toast.success("Owner logged in");
      window.location.reload();
    } else {
      toast.error("Wrong owner username or password");
    }
  }

  async function handleMemberLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: memberEmail, password: memberPass });
      if (error) throw error;
      toast.success("Signed in");
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background" style={{ backgroundImage: "radial-gradient(circle at top right, rgba(217,70,239,0.35), transparent 30%), var(--gradient-dark)" }}>
      <div className={`w-full max-w-md rounded-lg border bg-card p-8 ${fuchsiaPanel}`}>
        <div className="flex items-center gap-3 mb-6">
          <Skull className="text-fuchsia-300" size={28} />
          <div>
            <h1 className="text-xl font-black uppercase tracking-widest">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">City of Fears — Owner / Admin Login</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded border border-fuchsia-400/35 overflow-hidden mb-6">
          <button
            onClick={() => setTab("owner")}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest transition ${tab === "owner" ? "bg-fuchsia-600 text-white" : "text-muted-foreground hover:bg-fuchsia-500/10"}`}
          >
            <Crown size={12} className="inline mr-1" />Owner
          </button>
          <button
            onClick={() => setTab("member")}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest transition ${tab === "member" ? "bg-fuchsia-600 text-white" : "text-muted-foreground hover:bg-fuchsia-500/10"}`}
          >
            <Shield size={12} className="inline mr-1" />Admin
          </button>
        </div>

        {tab === "owner" ? (
          <form onSubmit={handleOwnerLogin} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Owner Username</label>
              <input
                required
                autoFocus
                placeholder="Username"
                value={ownerUser}
                onChange={e => setOwnerUser(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Owner Password</label>
              <div className="relative">
                <input
                  required
                  type={showOwnerPass ? "text" : "password"}
                  placeholder="Password"
                  value={ownerPass}
                  onChange={e => setOwnerPass(e.target.value)}
                  className={inputCls}
                />
                <button type="button" onClick={() => setShowOwnerPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-fuchsia-300">
                  {showOwnerPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full py-3 rounded font-black uppercase tracking-widest text-white bg-fuchsia-600 hover:bg-fuchsia-500 transition flex items-center justify-center gap-2">
              <Lock size={14} />Enter Owner Panel
            </button>
          </form>
        ) : (
          <form onSubmit={handleMemberLogin} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Admin Email</label>
              <input
                required
                autoFocus
                type="email"
                placeholder="admin@example.com"
                value={memberEmail}
                onChange={e => setMemberEmail(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Password</label>
              <div className="relative">
                <input
                  required
                  type={showMemberPass ? "text" : "password"}
                  placeholder="Password"
                  value={memberPass}
                  onChange={e => setMemberPass(e.target.value)}
                  className={inputCls}
                />
                <button type="button" onClick={() => setShowMemberPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-fuchsia-300">
                  {showMemberPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={busy} className="w-full py-3 rounded font-black uppercase tracking-widest text-white bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 transition flex items-center justify-center gap-2">
              <Shield size={14} />{busy ? "Signing in…" : "Sign In as Admin"}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-fuchsia-400/20 text-center">
          <Link href="/" className="text-xs text-muted-foreground hover:text-fuchsia-300 transition">← Back to City of Fears</Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { user, isAdmin, loading } = useAuth();
  const [owner, setOwner] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => setOwner(isOwnerSession()), []);
  useEffect(() => {
    if (!loading && !user && !isOwnerSession()) navigate("/auth");
  }, [loading, user, navigate]);

  async function signOut() {
    ownerLogout();
    signOutLocal();
    await signOutSupabase();
    navigate("/");
  }

  if (loading && !owner) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!owner && !isAdmin) {
    return <AdminLoginGate />;
  }

  const tabs: [Tab, string, React.ElementType, boolean][] = [
    ["overview", "Overview", Shield, false],
    ["admins", "Admins", Crown, true],
    ["members", "Members", Users, false],
    ["maintenance", "Maintenance", Wrench, false],
    ["licenses", "License Keys", KeyRound, false],
    ["credits", "Credits", Coins, false],
    ["sales", "Sales Manager", DollarSign, false],
    ["forum", "Forum Manager", Newspaper, false],
    ["logs", "Admin Logs", FileText, false],
    ["posts", "Posts", Newspaper, false],
    ["wheel", "Wheel Spins", Gift, false],
    ["casino", "Casino Manager", Gamepad2, true],
    ["announcements", "Announcements", Megaphone, false],
    ["bans", "Bans & Appeals", Ban, false],
    ["analytics", "Analytics", BarChart3, true],
    ["store", "Store Manager", ShoppingBag, true],
    ["events", "Events", Calendar, false],
    ["tickets", "Support Tickets", Ticket, false],
      ["coupons", "Coupon Codes", Percent, false],
      ["chat", "Chat Manager", MessageCircle, false],
    ["phone", "Phone Requests", Smartphone, false],
    ["settings", "Site Settings", Settings, true],
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ backgroundImage: "radial-gradient(circle at top right, rgba(217,70,239,0.35), transparent 30%), var(--gradient-dark)" }}>
      <header className="border-b border-fuchsia-400/35 bg-card/80 backdrop-blur sticky top-0 z-10 shadow-[0_0_35px_rgba(217,70,239,0.20)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Skull className="text-fuchsia-300" />
            <span className="font-black tracking-widest text-sm">OWNER ADMIN - CITY OF FEARS</span>
            <span className="text-[10px] px-2 py-1 rounded-full border border-fuchsia-400/35 text-fuchsia-200">FUCHSIA PANEL</span>
          </Link>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{owner ? `Owner: ${OWNER_USERNAME}` : user?.email}</span>
            <button onClick={signOut} className="flex items-center gap-2 hover:text-fuchsia-300"><LogOut size={16} /> Sign out</button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-[245px_1fr] gap-6">
          <aside className={`rounded-lg border bg-card p-3 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto sticky top-20 ${fuchsiaPanel}`}>
            {tabs.map(([id, label, Icon, ownerOnly]) => (
              <button key={id} disabled={ownerOnly && !owner} onClick={() => setTab(id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-bold uppercase tracking-wide disabled:opacity-40 ${tab === id ? "bg-fuchsia-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.35)]" : "hover:bg-fuchsia-500/10 text-muted-foreground hover:text-fuchsia-100"}`}>
                <Icon size={16} /> {label} {ownerOnly && <span className="ml-auto text-[10px]">Owner</span>}
              </button>
            ))}
          </aside>
          <section>
            {tab === "overview" && <Overview owner={owner} />}
            {tab === "admins" && <AdminsPanel owner={owner} />}
            {tab === "members" && <MembersPanel owner={owner} />}
            {tab === "maintenance" && <MaintenancePanel canManage={owner || isAdmin} isOwner={owner} />}
            {tab === "licenses" && <LicenseKeysPanel owner={owner} userEmail={user?.email ?? OWNER_USERNAME} />}
            {tab === "credits" && <CreditsPanel />}
            {tab === "sales" && <SalesManagerPanel owner={owner} />}
            {tab === "forum" && <ForumManagerPanel owner={owner} isAdmin={isAdmin} />}
            {tab === "logs" && <AdminLogsPanel />}
            {tab === "posts" && <PostsPanel />}
            {tab === "wheel" && <WheelPanel />}
            {tab === "casino" && <CasinoManagerPanel owner={owner} />}
            {tab === "announcements" && <AnnouncementsPanel owner={owner} />}
            {tab === "bans" && <BansPanel owner={owner} />}
            {tab === "analytics" && <AnalyticsPanel />}
            {tab === "store" && <StoreManagerPanel owner={owner} />}
            {tab === "events" && <EventsPanel owner={owner} />}
            {tab === "tickets" && <TicketsPanel />}
              {tab === "coupons" && <CouponsPanel owner={owner} userEmail={user?.email ?? OWNER_USERNAME} />}
              {tab === "chat" && <ChatManagerPanel owner={owner} isAdmin={isAdmin} />}
            {tab === "phone" && <PhoneRequestsPanel />}
            {tab === "settings" && <SiteSettingsPanel owner={owner} />}
          </section>
        </div>
      </main>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg border bg-card p-6 ${fuchsiaPanel}`}>
      <div className="flex items-center gap-2 mb-4"><Icon className="text-fuchsia-300" /><h2 className="text-2xl font-black uppercase">{title}</h2></div>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-fuchsia-400/35 bg-background/50 p-3">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-black">{value}</div>
    </div>
  );
}
const ADMIN_FEATURES_50 = [
  "Create and remove admin accounts",
  "Ban and unban members",
  "Adjust member casino credits",
  "Delete member accounts",
  "Toggle maintenance mode with countdown timer",
  "Create and deactivate license keys",
  "Generate 3-day trial membership keys",
  "Generate membership keys (all 6 tiers)",
  "Generate item/pack purchase keys",
  "Generate casino credit keys",
  "Create and manage coupon codes",
  "Toggle coupon codes on/off",
  "Set coupon expiry dates and max uses",
  "Manage sales — turn sales on or off",
  "Set global discount percentage",
  "Create sale events with start/end dates",
  "Manage and moderate the FiveM forum",
  "Remove inappropriate forum posts",
  "Pin important forum posts",
  "View all forum posts including removed ones",
  "Review and approve phone purchase requests",
  "Sync Discord phone role on approval",
  "Deny or revoke phone access",
  "Manage casino games — enable/disable",
  "View casino house edge and play stats",
  "Post site announcements (info/warning/event)",
  "Delete announcements",
  "Create and remove ban records",
  "Create and manage server events",
  "View analytics dashboard (members, activity, credits)",
  "View top casino game statistics",
  "Manage store items (add/remove)",
  "Reply to support tickets",
  "Assign license keys to tickets on approval",
  "Resolve and close support tickets",
  "Moderate chat rooms — delete messages",
  "Clear all messages in a chat room",
  "Delete private chat rooms",
  "View active private rooms with PINs",
  "Configure site settings (casino, wheel, store toggles)",
  "Set Discord invite link and server connect command",
  "Toggle registration open/closed",
  "Toggle leaderboard visibility",
  "Auto audit log — every admin action is tracked",
  "View full admin action history with timestamps",
  "Promote existing members to admin without changing password",
  "Create member accounts with custom starting credits",
  "Search and filter member accounts",
  "View admin notifications and mark as read",
  "Owner-only restricted tabs for sensitive operations",
];

function Overview({ owner }: { owner: boolean }) {
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Owner Powers" icon={Shield}>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><CheckCircle2 className="inline text-fuchsia-300 mr-2" size={16} />Owner can create admins, remove admins, kick/ban members.</li>
            <li><CheckCircle2 className="inline text-fuchsia-300 mr-2" size={16} />Only the owner can toggle maintenance mode.</li>
            <li><CheckCircle2 className="inline text-fuchsia-300 mr-2" size={16} />22 admin tabs including sales, forum, and audit logs.</li>
            <li><CheckCircle2 className="inline text-fuchsia-300 mr-2" size={16} />Global 45% discount is active on the website.</li>
          </ul>
          {!owner && <p className="mt-4 text-fuchsia-300 text-sm font-bold">You are an admin, not the owner. Owner-only controls are locked.</p>}
        </Card>
        <Card title="Live Features" icon={Sparkles}>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Info label="Casino Games" value="25 games live" />
            <Info label="Server Features" value="125+ features" />
            <Info label="Admin Features" value="50 features" />
            <Info label="Forum" value="Live with locked links" />
            <Info label="Daily Wheel" value="1 free daily spin" />
            <Info label="Jackpot" value="10,000 credits" />
          </div>
        </Card>
      </div>
      <Card title="50 Admin Panel Features" icon={CheckCircle2}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ADMIN_FEATURES_50.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground rounded border border-fuchsia-400/20 p-2">
              <span className="text-fuchsia-300 font-black shrink-0">{i + 1}.</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AccountCreateForm({
  owner,
  defaultRole,
  onCreated,
}: {
  owner: boolean;
  defaultRole: "admin" | "member";
  onCreated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [credits, setCredits] = useState(2600);
  const [role, setRole] = useState<"admin" | "member">(defaultRole);
  const [busy, setBusy] = useState(false);
  const [lastCreated, setLastCreated] = useState<{ email: string; password: string; role: string } | null>(null);

  function reset() {
    setEmail(""); setDisplayName(""); setPassword(""); setCredits(2600); setRole(defaultRole);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!owner) return toast.error("Owner only");
    if (!email.trim()) return toast.error("Email is required");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setBusy(true);
    try {
      const created = createLocalMember(email.trim(), password, displayName.trim() || undefined, role);
      if (role === "admin") {
        try { promoteLocalAdmin(created.email); } catch { /* already set */ }
      }
      setLastCreated({ email: created.email, password, role });
      reset();
      onCreated();
      toast.success(`${role === "admin" ? "Admin" : "Member"} account created for ${created.email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create account");
    } finally { setBusy(false); }
  }

  return (
    <div className={`rounded-lg border p-5 mb-6 ${role === "admin" ? "border-fuchsia-400/50 bg-fuchsia-950/20" : "border-fuchsia-400/25 bg-card"}`}>
      <div className="flex items-center gap-2 mb-4">
        {role === "admin" ? <Crown size={18} className="text-fuchsia-300" /> : <Users size={18} className="text-fuchsia-300" />}
        <h3 className="font-black uppercase tracking-widest text-sm">Create New Account</h3>
      </div>

      {lastCreated && (
        <div className="mb-4 rounded border border-green-500/40 bg-green-950/30 p-4 text-sm">
          <div className="font-bold text-green-300 mb-1 flex items-center gap-2"><CheckCircle2 size={15} /> Account created — save these credentials</div>
          <div className="text-green-200 font-mono text-xs space-y-1">
            <div><span className="text-green-400">Email:</span> {lastCreated.email}</div>
            <div><span className="text-green-400">Password:</span> {lastCreated.password}</div>
            <div><span className="text-green-400">Role:</span> {lastCreated.role}</div>
          </div>
          <button onClick={() => setLastCreated(null)} className="mt-2 text-xs text-green-400/60 hover:text-green-300">Dismiss</button>
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Email *</label>
            <input
              required
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Display Name</label>
            <input
              placeholder="Optional display name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Password * (min 8 chars)</label>
            <div className="relative">
              <input
                required
                type={showPass ? "text" : "password"}
                placeholder="Set login password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputCls + " pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-fuchsia-300"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Starting Casino Credits</label>
            <input
              type="number"
              min={0}
              value={credits}
              onChange={e => setCredits(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Account Role</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRole("member")}
              className={`flex-1 py-2 rounded border text-xs font-black uppercase tracking-widest transition ${role === "member" ? "border-fuchsia-400 bg-fuchsia-600/20 text-fuchsia-100" : "border-fuchsia-400/30 text-muted-foreground hover:bg-fuchsia-500/10"}`}
            >
              <Users size={13} className="inline mr-1" />Member
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`flex-1 py-2 rounded border text-xs font-black uppercase tracking-widest transition ${role === "admin" ? "border-fuchsia-400 bg-fuchsia-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.4)]" : "border-fuchsia-400/30 text-muted-foreground hover:bg-fuchsia-500/10"}`}
            >
              <Crown size={13} className="inline mr-1" />Admin
            </button>
          </div>
          {role === "admin" && (
            <p className="mt-1 text-[11px] text-fuchsia-300/70">Admin accounts can log into this panel and manage members, licenses, tickets, and more.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!owner || busy}
          className="w-full py-3 rounded font-black uppercase tracking-widest text-white bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 transition flex items-center justify-center gap-2"
        >
          <UserPlus size={16} />
          {busy ? "Creating…" : `Create ${role === "admin" ? "Admin" : "Member"} Account`}
        </button>
      </form>
    </div>
  );
}

function AdminsPanel({ owner }: { owner: boolean }) {
  const [admins, setAdmins] = useState<any[]>([]);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteBusy, setPromoteBusy] = useState(false);

  function load() {
    setAdmins(getLocalUsers().filter(u => u.role === "admin").map(u => ({
      id: u.id, user_id: u.id, role: "admin", created_at: u.created_at, profiles: u,
    })));
  }
  useEffect(() => { load(); }, []);

  async function handlePromote(e: React.FormEvent) {
    e.preventDefault();
    if (!owner) return toast.error("Owner only");
    if (!promoteEmail.trim()) return toast.error("Enter the member's email");
    setPromoteBusy(true);
    try {
      if (!hasSupabase) throw noSupabaseError();
      const creds = getOwnerCredentials();
      const { error } = await db.rpc("owner_manage_admin", { _username: creds.username, _password: creds.password, _action: "add", _target_email: promoteEmail });
      if (error) throw error;
      toast.success("Member promoted to admin"); setPromoteEmail(""); load();
    } catch (err) {
      if (!isSupabaseFetchError(err)) toast.error(err instanceof Error ? err.message : "Could not promote");
      else {
        try { promoteLocalAdmin(promoteEmail); toast.success("Member promoted to admin"); setPromoteEmail(""); load(); }
        catch (e) { toast.error(e instanceof Error ? e.message : "Member not found — create their account first"); }
      }
    } finally { setPromoteBusy(false); }
  }

  async function removeAdmin(row: any) {
    if (!owner) return toast.error("Owner only");
    if (!confirm("Remove admin permission for this account?")) return;
    const targetEmail = row.profiles?.email;
    if (!targetEmail) return toast.error("No email found for this admin.");
    try {
      if (!hasSupabase) throw noSupabaseError();
      const creds = getOwnerCredentials();
      const { error } = await db.rpc("owner_manage_admin", { _username: creds.username, _password: creds.password, _action: "remove", _target_email: targetEmail });
      if (error) throw error;
      toast.success("Admin removed"); load();
    } catch (err) {
      if (!isSupabaseFetchError(err)) toast.error(err instanceof Error ? err.message : "Could not remove admin");
      else { try { removeLocalAdmin(targetEmail); toast.success("Admin removed"); load(); } catch (e) { toast.error(e instanceof Error ? e.message : "Not found"); } }
    }
  }

  return (
    <Card title="Admin Accounts" icon={Crown}>
      <AccountCreateForm owner={owner} defaultRole="admin" onCreated={load} />

      <div className="rounded-lg border border-fuchsia-400/25 bg-card p-5 mb-6">
        <h3 className="font-black uppercase tracking-widest text-sm mb-3 flex items-center gap-2">
          <Sparkles size={15} className="text-fuchsia-300" /> Promote Existing Member to Admin
        </h3>
        <p className="text-xs text-muted-foreground mb-3">If the member already has an account, enter their email to grant admin access without changing their password.</p>
        <form onSubmit={handlePromote} className="flex gap-2">
          <input
            disabled={!owner}
            type="email"
            placeholder="existing member email"
            value={promoteEmail}
            onChange={e => setPromoteEmail(e.target.value)}
            className={inputCls}
          />
          <button
            type="submit"
            disabled={!owner || promoteBusy}
            className="px-4 py-2 rounded font-bold uppercase text-white bg-fuchsia-600 disabled:opacity-40 whitespace-nowrap flex items-center gap-2"
          >
            <Crown size={14} />Promote
          </button>
        </form>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black uppercase tracking-widest text-sm text-muted-foreground">Current Admins ({admins.length})</h3>
          <button onClick={load} className="px-3 py-1.5 rounded border border-fuchsia-400/35 text-xs font-bold uppercase"><RefreshCcw size={13} /></button>
        </div>
        <div className="space-y-2">
          {admins.length === 0 && <p className="text-sm text-muted-foreground">No admin accounts yet.</p>}
          {admins.map(a => (
            <div key={a.id} className="flex items-center gap-3 rounded border border-fuchsia-400/35 bg-fuchsia-950/10 p-3">
              <Crown size={16} className="text-fuchsia-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{a.profiles?.display_name ?? a.profiles?.email ?? a.user_id}</div>
                <div className="text-xs text-muted-foreground">{a.profiles?.email} · Admin since {new Date(a.created_at).toLocaleDateString()}</div>
              </div>
              <button
                disabled={!owner}
                onClick={() => removeAdmin(a)}
                className="px-3 py-1.5 rounded border border-destructive/50 text-destructive text-xs font-bold uppercase disabled:opacity-40 flex items-center gap-1"
              >
                <Ban size={13} />Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function MembersPanel({ owner }: { owner: boolean }) {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const filtered = useMemo(() => members.filter(m =>
    `${m.email ?? ""} ${m.display_name ?? ""}`.toLowerCase().includes(query.toLowerCase())
  ), [members, query]);

  function load() {
    try {
      if (!hasSupabase) throw noSupabaseError();
      db.from("profiles").select("id,email,display_name,credits,is_banned,created_at,role").order("created_at", { ascending: false }).limit(100)
        .then(({ data, error }: any) => {
          if (error) throw error;
          setMembers(data ?? []);
        }).catch(() => setMembers(getLocalUsers()));
    } catch { setMembers(getLocalUsers()); }
  }
  useEffect(() => { load(); }, []);

  async function updateCredits(member: any, amount: number) {
    if (!owner) return toast.error("Owner only");
    const next = Math.max(0, (member.credits ?? 0) + amount);
    try {
      if (!hasSupabase) throw noSupabaseError();
      const creds = getOwnerCredentials();
      const { error } = await db.rpc("owner_update_site_member", { _username: creds.username, _password: creds.password, _member_id: member.id, _credits: next, _is_banned: member.is_banned });
      if (error) throw error;
      toast.success(`Credits → ${next.toLocaleString()}`); load();
    } catch (err) {
      if (!isSupabaseFetchError(err)) toast.error(err instanceof Error ? err.message : "Could not update credits");
      else { updateLocalMember(member.id, { credits: next }); toast.success(`Credits → ${next.toLocaleString()}`); load(); }
    }
  }

  async function toggleBan(member: any) {
    if (!owner) return toast.error("Owner only");
    try {
      if (!hasSupabase) throw noSupabaseError();
      const creds = getOwnerCredentials();
      const { error } = await db.rpc("owner_update_site_member", { _username: creds.username, _password: creds.password, _member_id: member.id, _credits: member.credits ?? 0, _is_banned: !member.is_banned });
      if (error) throw error;
      toast.success(member.is_banned ? "Unbanned" : "Banned"); load();
    } catch (err) {
      if (!isSupabaseFetchError(err)) toast.error(err instanceof Error ? err.message : "Could not update member");
      else { updateLocalMember(member.id, { is_banned: !member.is_banned }); toast.success(member.is_banned ? "Unbanned" : "Banned"); load(); }
    }
  }

  async function removeMember(member: any) {
    if (!owner) return toast.error("Owner only");
    if (!confirm(`Remove account for ${member.email}?`)) return;
    try {
      if (!hasSupabase) throw noSupabaseError();
      const creds = getOwnerCredentials();
      const { error } = await db.rpc("owner_delete_site_member", { _username: creds.username, _password: creds.password, _member_id: member.id });
      if (error) throw error;
      toast.success("Member removed"); load();
    } catch (err) {
      if (!isSupabaseFetchError(err)) toast.error(err instanceof Error ? err.message : "Could not remove member");
      else { deleteLocalMember(member.id); toast.success("Member removed"); load(); }
    }
  }

  return (
    <Card title="Member Accounts" icon={Users}>
      <AccountCreateForm owner={owner} defaultRole="member" onCreated={load} />

      <div className="flex items-center gap-2 mb-4">
        <Search size={15} className="text-fuchsia-300 shrink-0" />
        <input
          placeholder="Search by email or name…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className={inputCls}
        />
        <button onClick={load} className="px-3 py-2 rounded border border-fuchsia-400/35 text-xs font-bold uppercase shrink-0"><RefreshCcw size={14} /></button>
      </div>

      <div className="text-xs text-muted-foreground mb-3 font-bold uppercase tracking-wider">
        {filtered.length} account{filtered.length !== 1 ? "s" : ""}
        {query ? ` matching "${query}"` : ""}
      </div>

      <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No accounts found.</p>}
        {filtered.map(m => (
          <div key={m.id} className="rounded border border-fuchsia-400/25 bg-card p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="font-bold flex items-center gap-2 flex-wrap">
                  {m.display_name || m.email || m.id}
                  {m.role === "admin" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-600/30 text-fuchsia-200 font-black uppercase tracking-wider border border-fuchsia-400/30">Admin</span>}
                  {m.is_banned && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-black uppercase tracking-wider border border-destructive/30">Banned</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {m.email} · {(m.credits ?? 0).toLocaleString()} credits
                  {m.created_at && ` · Joined ${new Date(m.created_at).toLocaleDateString()}`}
                </div>
              </div>
              <button
                disabled={!owner}
                onClick={() => removeMember(m)}
                className="p-1.5 rounded border border-border text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-40 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button disabled={!owner} onClick={() => updateCredits(m, 1000)} className="px-3 py-1.5 rounded bg-fuchsia-600/20 text-fuchsia-100 text-xs font-bold uppercase disabled:opacity-40 hover:bg-fuchsia-600/30 transition">+1,000 credits</button>
              <button disabled={!owner} onClick={() => updateCredits(m, -1000)} className="px-3 py-1.5 rounded bg-secondary text-xs font-bold uppercase disabled:opacity-40 hover:bg-secondary/80 transition">−1,000 credits</button>
              <button disabled={!owner} onClick={() => updateCredits(m, 5000)} className="px-3 py-1.5 rounded bg-fuchsia-600/20 text-fuchsia-100 text-xs font-bold uppercase disabled:opacity-40 hover:bg-fuchsia-600/30 transition">+5,000 credits</button>
              <button
                disabled={!owner}
                onClick={() => toggleBan(m)}
                className={`px-3 py-1.5 rounded border text-xs font-bold uppercase disabled:opacity-40 transition ${m.is_banned ? "border-green-500/50 text-green-400 hover:bg-green-500/10" : "border-destructive/50 text-destructive hover:bg-destructive/10"}`}
              >
                {m.is_banned ? <><Unlock size={12} className="inline mr-1" />Unban</> : <><Ban size={12} className="inline mr-1" />Ban</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
// Shared maintenance state stored in localStorage so the front-end can read it
const MAINT_KEY = "cof_maintenance_v2";

function getMaintenanceState(): { enabled: boolean; message: string; endsAt: number | null } {
  try {
    const raw = safeStorage.getItem(MAINT_KEY);
    if (!raw) return { enabled: false, message: "", endsAt: null };
    return JSON.parse(raw);
  } catch { return { enabled: false, message: "", endsAt: null }; }
}

function saveMaintenanceState(state: { enabled: boolean; message: string; endsAt: number | null }) {
  safeStorage.setItem(MAINT_KEY, JSON.stringify(state));
}

function MaintenancePanel({ canManage, isOwner }: { canManage: boolean; isOwner: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("Service update is in progress. Maintenance mode is active. The website will reopen automatically when the countdown hits zero.");
  const [useTimer, setUseTimer] = useState(false);
  const [durationMins, setDurationMins] = useState(30);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  // Load saved state
  useEffect(() => {
    const s = getMaintenanceState();
    setEnabled(s.enabled);
    if (s.message) setMessage(s.message);
    if (s.endsAt) { setEndsAt(s.endsAt); setUseTimer(true); }
    // Also try supabase. Routed through safeSupabaseQuery because the client is
    // a lazy Proxy that throws on property access when Supabase isn't
    // configured — an unguarded call here escapes the effect into the error
    // boundary and blanks the maintenance tab.
    void safeSupabaseQuery(() =>
      db.from("site_settings").select("value").eq("key", "maintenance").maybeSingle(),
    ).then((result: any) => {
      const value = result?.data?.value;
      if (value) {
        setEnabled(!!value.enabled);
        if (value.message) setMessage(value.message);
        if (value.endsAt) { setEndsAt(value.endsAt); setUseTimer(true); }
      }
    });
  }, []);

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-disable when timer hits zero
  useEffect(() => {
    if (enabled && endsAt && now >= endsAt) {
      const newState = { enabled: false, message, endsAt: null };
      saveMaintenanceState(newState);
      setEnabled(false);
      setEndsAt(null);
      toast.success("Maintenance ended automatically - website is back online!");
    }
  }, [now, endsAt, enabled, message]);

  const remaining = endsAt ? Math.max(0, endsAt - now) : 0;
  const remH = Math.floor(remaining / 3600000);
  const remM = Math.floor((remaining % 3600000) / 60000);
  const remS = Math.floor((remaining % 60000) / 1000);
  const countdownStr = remaining > 0 ? `${String(remH).padStart(2,"0")}:${String(remM).padStart(2,"0")}:${String(remS).padStart(2,"0")}` : "00:00:00";

  async function save() {
    if (!canManage) return toast.error("Admins and the owner can change maintenance mode.");
    const newEndsAt = (enabled && useTimer) ? Date.now() + durationMins * 60 * 1000 : null;
    const state = { enabled, message, endsAt: newEndsAt };
    saveMaintenanceState(state);
    setEndsAt(newEndsAt);
    // Also save to Supabase if available. Owner uses the secure owner RPC; admins try a normal upsert.
    try {
      const value = {
        enabled,
        message,
        endsAt: newEndsAt,
        updatedBy: isOwner ? OWNER_USERNAME : "admin",
        updatedAt: new Date().toISOString(),
      };
      if (isOwner) {
        const creds = getOwnerCredentials();
        await db.rpc("owner_upsert_setting", { _username: creds.username, _password: creds.password, _key: "maintenance", _value: value });
      } else {
        await db.rpc("admin_upsert_setting", { _key: "maintenance", _value: value });
      }
    } catch { /* Supabase optional; local storage still works */ }
    toast.success(enabled ? `Maintenance ON${useTimer ? ` - auto-reopens in ${durationMins}m` : ""}` : "Maintenance OFF - website is live");
  }

  function cancelTimer() {
    if (!canManage) return toast.error("Admins and owner only");
    const state = { enabled, message, endsAt: null };
    saveMaintenanceState(state);
    setEndsAt(null);
    setUseTimer(false);
    toast.success("Countdown cancelled");
  }

  return (
    <Card title="Maintenance Mode + Countdown" icon={Wrench}>
      {/* Status Banner */}
      <div className={`mb-6 rounded-lg border p-4 flex items-center gap-3 ${enabled ? "border-red-500/40 bg-red-950/20" : "border-green-500/40 bg-green-950/20"}`}>
        <div className={`w-3 h-3 rounded-full ${enabled ? "bg-red-500 animate-pulse" : "bg-green-500"}`} />
        <div className="flex-1">
          <div className={`font-black uppercase text-sm ${enabled ? "text-red-300" : "text-green-300"}`}>
            {enabled ? "MAINTENANCE ACTIVE" : "WEBSITE LIVE"}
          </div>
          {enabled && endsAt && remaining > 0 && (
            <div className="text-xs text-muted-foreground mt-0.5">Auto-reopens in {countdownStr}</div>
          )}
        </div>
        {enabled && endsAt && remaining > 0 && (
          <div className="text-3xl font-black font-mono text-fuchsia-300">{countdownStr}</div>
        )}
      </div>

      {/* Toggle */}
      <div className="flex items-center gap-3 mb-4">
        <button
          disabled={!canManage}
          onClick={() => setEnabled(e => !e)}
          className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-40 ${enabled ? "bg-red-500" : "bg-fuchsia-600/30 border border-fuchsia-400/35"}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-0.5"}`} />
        </button>
        <span className="font-bold text-sm">{enabled ? "Maintenance ON" : "Maintenance OFF"}</span>
      </div>

      {/* Message */}
      <div className="mb-4">
        <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Maintenance Message</label>
        <textarea
          disabled={!canManage}
          rows={3}
          value={message}
          onChange={e => setMessage(e.target.value)}
          className={inputCls}
          placeholder="Message shown to visitors during maintenance..."
        />
      </div>

      {/* Timer Section */}
      <div className={`rounded-lg border p-4 mb-4 ${useTimer ? "border-fuchsia-400/35 bg-fuchsia-950/10" : "border-fuchsia-400/20"}`}>
        <div className="flex items-center gap-3 mb-3">
          <Timer size={16} className="text-fuchsia-300" />
          <span className="font-bold text-sm uppercase tracking-wide">Auto-Reopen Timer</span>
          <button
            disabled={!canManage}
            onClick={() => setUseTimer(t => !t)}
            className={`ml-auto relative w-10 h-5 rounded-full transition-colors disabled:opacity-40 ${useTimer ? "bg-fuchsia-600" : "bg-fuchsia-600/20 border border-fuchsia-400/35"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${useTimer ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        {useTimer && (
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Duration (minutes)</label>
              <div className="flex items-center gap-2">
                <input
                  disabled={!canManage}
                  type="number"
                  min={1}
                  max={1440}
                  value={durationMins}
                  onChange={e => setDurationMins(Math.max(1, Number(e.target.value)))}
                  className="w-32 px-3 py-2 rounded border border-fuchsia-400/35 bg-input text-foreground focus:outline-none"
                />
                <div className="flex gap-1">
                  {[15, 30, 60, 120, 240].map(m => (
                    <button
                      key={m}
                      disabled={!canManage}
                      onClick={() => setDurationMins(m)}
                      className={`px-2 py-1 rounded text-xs font-bold uppercase disabled:opacity-40 ${durationMins === m ? "bg-fuchsia-600 text-white" : "border border-fuchsia-400/35 hover:bg-fuchsia-500/10"}`}
                    >
                      {m >= 60 ? `${m / 60}h` : `${m}m`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live countdown if active */}
            {endsAt && remaining > 0 && (
              <div className="flex items-center gap-3 rounded border border-fuchsia-400/35 bg-fuchsia-950/20 p-3">
                <Clock size={16} className="text-fuchsia-300" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">Time Remaining</div>
                  <div className="text-2xl font-black font-mono text-fuchsia-200">{countdownStr}</div>
                </div>
                <button
                  disabled={!canManage}
                  onClick={cancelTimer}
                  className="ml-auto px-3 py-2 rounded border border-fuchsia-400/35 text-xs font-bold uppercase hover:bg-fuchsia-500/10 disabled:opacity-40"
                >
                  <RotateCcw size={12} className="inline mr-1" />Cancel Timer
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Presets */}
      <div className="mb-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Quick Presets</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Quick Update", msg: "Quick update in progress. Back in a few minutes!", mins: 15 },
            { label: "Patch Deploy", msg: "Deploying a new patch. The city will reopen shortly.", mins: 30 },
            { label: "Major Update", msg: "Major update underway. Thank you for your patience!", mins: 120 },
            { label: "Emergency", msg: "Emergency maintenance. We are working to resolve the issue.", mins: 60 },
          ].map(p => (
            <button
              key={p.label}
              disabled={!canManage}
              onClick={() => { setMessage(p.msg); setDurationMins(p.mins); setUseTimer(true); setEnabled(true); }}
              className="px-3 py-2 rounded border border-fuchsia-400/35 text-xs font-bold uppercase text-left hover:bg-fuchsia-500/10 disabled:opacity-40"
            >
              <div>{p.label}</div>
              <div className="text-[10px] text-muted-foreground font-normal normal-case">{p.mins}m timer</div>
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        disabled={!canManage}
        onClick={save}
        className="w-full px-5 py-3 rounded font-bold uppercase text-white bg-fuchsia-600 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <Save size={16} />{enabled ? "Activate Maintenance" : "Save (Keep Live)"}
      </button>
    </Card>
  );
}

function CreditsPanel() {
  return (
    <Card title="Credit Economy" icon={Coins}>
      <div className="grid md:grid-cols-3 gap-4">
        <Info label="Credit Store" value="Users can buy credits from profile" />
        <Info label="Posting" value="Credits required to post" />
        <Info label="Casino Games" value="Win or lose credits" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Database tables included for credit wallets, transactions, purchases, casino results, and post spending.</p>
    </Card>
  );
}

function PostsPanel() {
  return (
    <Card title="Website Posts" icon={Newspaper}>
      <p className="text-sm text-muted-foreground">Users can spend credits to post on the website. Admins can review, approve, feature, or remove posts.</p>
      <div className="mt-4 grid md:grid-cols-3 gap-3">
        <Info label="Draft" value="User creates post" />
        <Info label="Review" value="Admin approves" />
        <Info label="Feature" value="Boost important posts" />
      </div>
    </Card>
  );
}

function WheelPanel() {
  return (
    <Card title="Daily + Weekly Wheel" icon={Gift}>
      <div className="grid md:grid-cols-4 gap-3">
        <Info label="Daily Spin" value="Free every day" />
        <Info label="Weekly Spin" value="Free every week" />
        <Info label="Buy Spin" value="5,000 credits" />
        <Info label="Jackpot" value="10,000 credits" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Wheel rewards include credits, discounts, bonus posting passes, and the jackpot.</p>
    </Card>
  );
}
function CasinoManagerPanel({ owner }: { owner: boolean }) {
  const [games, setGames] = useState([
    { id: "slots", name: "Slot Machine", icon: "Slots", enabled: true, totalPlays: 1482, totalWon: 74100, totalLost: 88920 },
    { id: "blackjack", name: "Blackjack", icon: "Cards", enabled: true, totalPlays: 893, totalWon: 44650, totalLost: 53580 },
    { id: "roulette", name: "Roulette", icon: "Wheel", enabled: false, totalPlays: 321, totalWon: 16050, totalLost: 19260 },
    { id: "poker", name: "Video Poker", icon: "Poker", enabled: true, totalPlays: 654, totalWon: 32700, totalLost: 39240 },
    { id: "dice", name: "Dice Roll", icon: "Dice", enabled: true, totalPlays: 2103, totalWon: 105150, totalLost: 126180 },
    { id: "crash", name: "Crash", icon: "Crash", enabled: true, totalPlays: 987, totalWon: 49350, totalLost: 59220 },
    { id: "mines", name: "Mines", icon: "Mines", enabled: true, totalPlays: 543, totalWon: 27150, totalLost: 32580 },
    { id: "baccarat", name: "Baccarat", icon: "Baccarat", enabled: false, totalPlays: 234, totalWon: 11700, totalLost: 14040 },
  ]);

  function toggle(id: string) {
    if (!owner) return toast.error("Owner only");
    setGames(g => g.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x));
    toast.success("Game status updated");
  }

  const totalPlays = games.reduce((a, g) => a + g.totalPlays, 0);
  const totalWon = games.reduce((a, g) => a + g.totalWon, 0);
  const totalLost = games.reduce((a, g) => a + g.totalLost, 0);
  const houseEdge = totalLost > 0 ? (((totalLost - totalWon) / totalLost) * 100).toFixed(1) : "0";

  return (
    <Card title="Casino Manager" icon={Gamepad2}>
      <div className="grid sm:grid-cols-4 gap-3 mb-6">
        <Info label="Total Plays" value={totalPlays.toLocaleString()} />
        <Info label="Credits Won" value={totalWon.toLocaleString()} />
        <Info label="Credits Lost" value={totalLost.toLocaleString()} />
        <Info label="House Edge" value={`${houseEdge}%`} />
      </div>
      <div className="space-y-3">
        {games.map(g => (
          <div key={g.id} className="flex items-center gap-3 rounded border border-fuchsia-400/35 p-3">
            <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-fuchsia-950/40 text-fuchsia-300 w-20 text-center">{g.icon}</span>
            <div className="flex-1">
              <div className="font-bold">{g.name}</div>
              <div className="text-xs text-muted-foreground">{g.totalPlays} plays - {g.totalWon.toLocaleString()} won - {g.totalLost.toLocaleString()} lost</div>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded ${g.enabled ? "bg-fuchsia-600/20 text-fuchsia-200" : "bg-secondary text-muted-foreground"}`}>{g.enabled ? "LIVE" : "OFF"}</span>
            <button disabled={!owner} onClick={() => toggle(g.id)} className="px-3 py-2 rounded border border-fuchsia-400/35 text-xs font-bold uppercase disabled:opacity-40 hover:bg-fuchsia-500/10">
              {g.enabled ? <><EyeOff size={14} className="inline mr-1" />Disable</> : <><Eye size={14} className="inline mr-1" />Enable</>}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AnnouncementsPanel({ owner: _owner }: { owner: boolean }) {
  const [announcements, setAnnouncements] = useState([
    { id: 1, title: "Server Wipe Coming", body: "The server will wipe on Friday at 8PM EST.", type: "warning" as const, date: "2025-01-10" },
    { id: 2, title: "Double XP Weekend", body: "Earn double XP all weekend long!", type: "event" as const, date: "2025-01-08" },
    { id: 3, title: "25 Casino Games Live", body: "All 25 casino games are now live on the website.", type: "info" as const, date: "2025-01-05" },
  ]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<"info" | "warning" | "event">("info");

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return toast.error("Fill in all fields");
    setAnnouncements(a => [{ id: Date.now(), title, body, type, date: new Date().toISOString().slice(0, 10) }, ...a]);
    toast.success("Announcement posted");
    setTitle(""); setBody("");
  }

  const typeColor: Record<string, string> = {
    info: "text-blue-300 border-blue-400/35",
    warning: "text-yellow-300 border-yellow-400/35",
    event: "text-fuchsia-300 border-fuchsia-400/35",
  };

  return (
    <Card title="Announcements" icon={Megaphone}>
      <form onSubmit={add} className="space-y-3 mb-6">
        <input placeholder="Announcement title" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
        <textarea placeholder="Announcement body..." rows={3} value={body} onChange={e => setBody(e.target.value)} className={inputCls} />
        <div className="flex gap-2">
          {(["info", "warning", "event"] as const).map(t => (
            <button key={t} type="button" onClick={() => setType(t)} className={`px-3 py-2 rounded border text-xs font-bold uppercase ${type === t ? "bg-fuchsia-600 text-white border-fuchsia-400" : "border-fuchsia-400/35 text-muted-foreground hover:bg-fuchsia-500/10"}`}>{t}</button>
          ))}
          <button type="submit" className="ml-auto px-4 py-2 rounded font-bold uppercase text-white bg-fuchsia-600 text-sm"><Bell size={14} className="inline mr-1" />Post</button>
        </div>
      </form>
      <div className="space-y-3">
        {announcements.map(a => (
          <div key={a.id} className={`rounded border p-3 ${typeColor[a.type]}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold">{a.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{a.body}</div>
                <div className="text-xs mt-1 opacity-60">{a.date} - {a.type.toUpperCase()}</div>
              </div>
              <button onClick={() => setAnnouncements(x => x.filter(i => i.id !== a.id))} className="text-destructive hover:text-red-400"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
function BansPanel({ owner }: { owner: boolean }) {
  const [bans, setBans] = useState([
    { id: 1, name: "xX_Griefer_Xx", reason: "Repeated RDM and harassment", date: "2025-01-09", manual: false },
    { id: 2, name: "SpeedHacker99", reason: "Cheating - speed hack detected", date: "2025-01-07", manual: false },
    { id: 3, name: "ToxicPlayer42", reason: "Hate speech in voice chat", date: "2025-01-03", manual: true },
  ]);
  const [newName, setNewName] = useState("");
  const [newReason, setNewReason] = useState("");

  function addBan(e: React.FormEvent) {
    e.preventDefault();
    if (!owner) return toast.error("Owner only");
    if (!newName.trim() || !newReason.trim()) return toast.error("Fill in all fields");
    setBans(b => [{ id: Date.now(), name: newName, reason: newReason, date: new Date().toISOString().slice(0, 10), manual: true }, ...b]);
    toast.success(`${newName} has been banned`);
    setNewName(""); setNewReason("");
  }

  return (
    <Card title="Bans & Appeals" icon={Ban}>
      <form onSubmit={addBan} className="grid md:grid-cols-[1fr_1fr_auto] gap-2 mb-6">
        <input disabled={!owner} placeholder="Player name / ID" value={newName} onChange={e => setNewName(e.target.value)} className={inputCls} />
        <input disabled={!owner} placeholder="Ban reason" value={newReason} onChange={e => setNewReason(e.target.value)} className={inputCls} />
        <button type="submit" disabled={!owner} className="px-4 py-2 rounded font-bold uppercase text-white bg-fuchsia-600 disabled:opacity-40 text-sm"><Lock size={14} className="inline mr-1" />Ban</button>
      </form>
      <div className="space-y-3">
        {bans.map(b => (
          <div key={b.id} className="flex items-center gap-3 rounded border border-destructive/30 bg-destructive/5 p-3">
            <Ban size={16} className="text-destructive shrink-0" />
            <div className="flex-1">
              <div className="font-bold">{b.name}</div>
              <div className="text-xs text-muted-foreground">{b.reason} - {b.date}{b.manual ? " - Manual" : ""}</div>
            </div>
            <button disabled={!owner} onClick={() => { if (!owner) return; setBans(x => x.filter(i => i.id !== b.id)); toast.success(`${b.name} unbanned`); }}
              className="px-3 py-2 rounded border border-fuchsia-400/35 text-xs font-bold uppercase disabled:opacity-40 hover:bg-fuchsia-500/10">
              <Unlock size={14} className="inline mr-1" />Unban
            </button>
          </div>
        ))}
        {bans.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No active bans.</p>}
      </div>
    </Card>
  );
}

function AnalyticsPanel() {
  const stats = [
    { label: "Total Members", value: "1,284", icon: Users, trend: "+12 this week", up: true },
    { label: "Active Today", value: "87", icon: Activity, trend: "+5 vs yesterday", up: true },
    { label: "Credits in Circulation", value: "4,821,600", icon: Coins, trend: "-32,000 today", up: false },
    { label: "Casino Plays Today", value: "342", icon: Gamepad2, trend: "+18% vs avg", up: true },
  ];
  const topGames = [
    { name: "Dice Roll", plays: 2103, pct: 45 },
    { name: "Slot Machine", plays: 1482, pct: 32 },
    { name: "Blackjack", plays: 893, pct: 19 },
    { name: "Video Poker", plays: 654, pct: 14 },
  ];

  return (
    <Card title="Analytics" icon={BarChart3}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map(s => (
          <div key={s.label} className="rounded border border-fuchsia-400/35 bg-background/50 p-3">
            <div className="flex items-center gap-2 mb-1"><s.icon size={14} className="text-fuchsia-300" /><span className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</span></div>
            <div className="text-2xl font-black">{s.value}</div>
            <div className={`text-xs mt-1 flex items-center gap-1 ${s.up ? "text-green-400" : "text-red-400"}`}>
              {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{s.trend}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded border border-fuchsia-400/35 p-4">
        <div className="flex items-center gap-2 mb-3"><Trophy size={14} className="text-fuchsia-300" /><span className="text-sm font-bold uppercase tracking-wide">Top Casino Games</span></div>
        <div className="space-y-2">
          {topGames.map(g => (
            <div key={g.name}>
              <div className="flex justify-between text-xs mb-1"><span>{g.name}</span><span className="text-muted-foreground">{g.plays.toLocaleString()} plays</span></div>
              <div className="h-2 rounded-full bg-fuchsia-950/40 overflow-hidden"><div className="h-full rounded-full bg-fuchsia-500" style={{ width: `${g.pct}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
function StoreManagerPanel({ owner }: { owner: boolean }) {
  const [items, setItems] = useState([
    { id: 1, name: "VIP Pass (30 days)", price: 15000, category: "membership" },
    { id: 2, name: "Custom Name Color", price: 5000, category: "cosmetic" },
    { id: 3, name: "Extra Spin Token", price: 3000, category: "casino" },
    { id: 4, name: "Post Boost x5", price: 2500, category: "posts" },
    { id: 5, name: "Credit Bundle (10k)", price: 9.99, category: "credits" },
  ]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState("cosmetic");

  function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!owner) return toast.error("Owner only");
    if (!name.trim() || price <= 0) return toast.error("Fill in all fields");
    setItems(i => [...i, { id: Date.now(), name, price, category }]);
    toast.success("Item added to store");
    setName(""); setPrice(0);
  }

  return (
    <Card title="Store Manager" icon={ShoppingBag}>
      <form onSubmit={addItem} className="grid md:grid-cols-[1fr_120px_150px_auto] gap-2 mb-6">
        <input disabled={!owner} placeholder="Item name" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
        <input disabled={!owner} type="number" min={0} placeholder="Price" value={price || ""} onChange={e => setPrice(Number(e.target.value))} className={inputCls} />
        <select disabled={!owner} value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
          {["cosmetic", "membership", "casino", "posts", "credits"].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" disabled={!owner} className="px-4 py-2 rounded font-bold uppercase text-white bg-fuchsia-600 disabled:opacity-40 text-sm"><Package size={14} className="inline mr-1" />Add</button>
      </form>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 rounded border border-fuchsia-400/35 p-3">
            <DollarSign size={16} className="text-fuchsia-300 shrink-0" />
            <div className="flex-1">
              <div className="font-bold">{item.name}</div>
              <div className="text-xs text-muted-foreground">{item.price.toLocaleString()} credits - {item.category}</div>
            </div>
            <button disabled={!owner} onClick={() => { if (!owner) return; setItems(i => i.filter(x => x.id !== item.id)); toast.success("Item removed"); }}
              className="text-destructive hover:text-red-400 disabled:opacity-40"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function EventsPanel({ owner }: { owner: boolean }) {
  const [events, setEvents] = useState([
    { id: 1, name: "New Year Heist", date: "2025-01-15", description: "Coordinate the biggest heist in City of Fears history.", reward: "25,000 credits" },
    { id: 2, name: "Street Race Championship", date: "2025-01-20", description: "Race through the city streets for glory and credits.", reward: "15,000 credits" },
    { id: 3, name: "Casino Royale Night", date: "2025-01-25", description: "Special casino event with doubled payouts all night.", reward: "2x Casino Payouts" },
  ]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [desc, setDesc] = useState("");
  const [reward, setReward] = useState("");

  function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!owner) return toast.error("Owner only");
    if (!name.trim() || !date || !desc.trim()) return toast.error("Fill in all fields");
    setEvents(ev => [...ev, { id: Date.now(), name, date, description: desc, reward }]);
    toast.success("Event created");
    setName(""); setDate(""); setDesc(""); setReward("");
  }

  return (
    <Card title="Events" icon={Calendar}>
      <form onSubmit={addEvent} className="space-y-2 mb-6">
        <div className="grid md:grid-cols-2 gap-2">
          <input disabled={!owner} placeholder="Event name" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          <input disabled={!owner} type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
        </div>
        <textarea disabled={!owner} placeholder="Event description..." rows={2} value={desc} onChange={e => setDesc(e.target.value)} className={inputCls} />
        <div className="flex gap-2">
          <input disabled={!owner} placeholder="Reward (e.g. 10,000 credits)" value={reward} onChange={e => setReward(e.target.value)} className={inputCls} />
          <button type="submit" disabled={!owner} className="px-4 py-2 rounded font-bold uppercase text-white bg-fuchsia-600 disabled:opacity-40 text-sm whitespace-nowrap"><Zap size={14} className="inline mr-1" />Create</button>
        </div>
      </form>
      <div className="space-y-3">
        {events.map(ev => (
          <div key={ev.id} className="rounded border border-fuchsia-400/35 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold flex items-center gap-2"><Star size={14} className="text-fuchsia-300" />{ev.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{ev.description}</div>
                <div className="text-xs mt-1 flex gap-3">
                  <span className="text-fuchsia-300">{ev.date}</span>
                  {ev.reward && <span className="text-yellow-300 flex items-center gap-1"><Trophy size={10} />{ev.reward}</span>}
                </div>
              </div>
              <button disabled={!owner} onClick={() => { if (!owner) return; setEvents(x => x.filter(i => i.id !== ev.id)); toast.success("Event removed"); }}
                className="text-destructive hover:text-red-400 disabled:opacity-40 mt-1"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
function LicenseKeysPanel({ owner, userEmail }: { owner: boolean; userEmail: string }) {
  const [keyType, setKeyType] = useState<KeyType>("membership");
  const [tier, setTier] = useState<TierName>("Silver");
  const [packName, setPackName] = useState<PackName>("Rookie Welcome Pack");
  const [creditsAmount, setCreditsAmount] = useState(10000);
  const [note, setNote] = useState("");
  const [refresh, setRefresh] = useState(0);
  const keys = useMemo(() => getLicenseKeys(), [refresh]);

  function createKey() {
    const key = createLicenseKey({
      type: keyType,
      tier: keyType === "membership" || keyType === "trial" ? tier : undefined,
      packName: keyType === "pack" ? packName : undefined,
      creditsAmount: keyType === "credits" ? creditsAmount : undefined,
      isTrial: keyType === "trial",
      durationDays: keyType === "membership" || keyType === "trial" ? 3 : 0,
      createdBy: owner ? OWNER_USERNAME : userEmail,
      note,
    });
    navigator.clipboard?.writeText(key.key).catch(() => undefined);
    setRefresh(x => x + 1);
    toast.success("License key created and copied");
  }

  function deactivate(key: string) {
    deactivateLicenseKey(key);
    setRefresh(x => x + 1);
    toast.success("License key deactivated");
  }

  return (
    <Card title="License Keys" icon={KeyRound}>
      <div className="rounded border border-fuchsia-400/35 bg-fuchsia-950/20 p-4 mb-5">
        <div className="grid md:grid-cols-5 gap-3">
          <select value={keyType} onChange={e => setKeyType(e.target.value as KeyType)} className={inputCls}>
            <option value="trial">3-Day Free Trial Membership</option>
            <option value="membership">3-Day Membership</option>
            <option value="pack">Item / Pack Purchase</option>
            <option value="credits">Casino Credits</option>
          </select>
          {(keyType === "membership" || keyType === "trial") && (
            <select value={tier} onChange={e => setTier(e.target.value as TierName)} className={inputCls}>{ALL_TIERS.map(t => <option key={t} value={t}>{t}</option>)}</select>
          )}
          {keyType === "pack" && (
            <select value={packName} onChange={e => setPackName(e.target.value as PackName)} className={inputCls}>{ALL_PACKS.map(p => <option key={p} value={p}>{p}</option>)}</select>
          )}
          {keyType === "credits" && (
            <input type="number" min={1000} step={1000} value={creditsAmount} onChange={e => setCreditsAmount(Number(e.target.value))} className={inputCls} />
          )}
          <input placeholder="Admin note / buyer name" value={note} onChange={e => setNote(e.target.value)} className={inputCls} />
          <button onClick={createKey} className="px-4 py-2 rounded bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-black uppercase tracking-widest"><PlusCircle size={14} className="inline mr-1" />Create Key</button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Membership and free-trial keys last 3 days. Each account can redeem only one free trial. Packs and casino credits are permanent unlocks after redeeming.</p>
      </div>
      <div className="space-y-2 max-h-[520px] overflow-auto">
        {keys.length === 0 && <p className="text-sm text-muted-foreground">No keys created yet.</p>}
        {keys.map(k => (
          <div key={k.key} className={`rounded border p-3 ${k.isActive ? "border-fuchsia-400/35" : "border-red-500/30 opacity-60"}`}>
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <code className="text-fuchsia-200 font-mono text-sm">{k.key}</code>
              <div className="flex gap-2">
                <button onClick={() => { navigator.clipboard?.writeText(k.key); toast.success("Copied"); }} className="px-2 py-1 rounded border border-fuchsia-400/35 text-xs"><ClipboardCopy size={12} className="inline mr-1" />Copy</button>
                {k.isActive && !k.redeemedBy && <button onClick={() => deactivate(k.key)} className="px-2 py-1 rounded border border-red-500/40 text-red-300 text-xs"><Trash2 size={12} className="inline mr-1" />Disable</button>}
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {k.type.toUpperCase()} · {k.tier || k.packName || `${(k.creditsAmount ?? 0).toLocaleString()} credits`} · {k.durationDays ? `${k.durationDays} days` : "permanent"} · Created by {k.createdBy}
              {k.redeemedBy ? ` · Redeemed by ${k.redeemedBy}` : " · Unused"}{k.note ? ` · ${k.note}` : ""}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TicketsPanel() {
  const [refresh, setRefresh] = useState(0);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [keyText, setKeyText] = useState<Record<string, string>>({});
  const tickets = useMemo(() => getSupportTickets(), [refresh]);

  function resolve(id: string) {
    updateTicketStatus(id, "resolved");
    setRefresh(x => x + 1);
    toast.success("Ticket resolved");
  }

  function sendReply(id: string) {
    const text = replyText[id];
    if (!text?.trim()) return toast.error("Enter a reply first");
    replyToTicket(id, "staff", text, true);
    setReplyText(r => ({ ...r, [id]: "" }));
    setRefresh(x => x + 1);
    toast.success("Reply sent");
  }

  function assign(id: string) {
    const key = keyText[id]?.trim().toUpperCase();
    if (!key) return toast.error("Enter a license key first");
    assignKeyToTicket(id, key);
    replyToTicket(id, "staff", `Approved. Redeem this license key on your Profile: ${key}`, true);
    setRefresh(x => x + 1);
    toast.success("Key assigned to ticket");
  }

  return (
    <Card title="Support Tickets" icon={Ticket}>
      <div className="flex items-center gap-3 mb-4">
        <Info label="Open" value={String(tickets.filter(t => t.status === "open").length)} />
        <Info label="In Progress" value={String(tickets.filter(t => t.status === "in_progress").length)} />
        <Info label="Resolved" value={String(tickets.filter(t => t.status === "resolved").length)} />
      </div>
      <div className="space-y-3">
        {tickets.length === 0 && <p className="text-sm text-muted-foreground">No support tickets yet.</p>}
        {tickets.map((t: SupportTicket) => (
          <div key={t.id} className={`rounded border p-3 ${t.status === "resolved" ? "border-fuchsia-400/20 opacity-80" : "border-fuchsia-400/35"}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold flex items-center gap-2"><MessageCircle size={14} className="text-fuchsia-300" />{t.subject}<span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-fuchsia-600/20 text-fuchsia-200">{t.status}</span></div>
                <div className="text-xs text-muted-foreground mt-1">{t.userEmail} · {new Date(t.createdAt).toLocaleString()} · {t.type}</div>
                <p className="text-sm mt-2 whitespace-pre-wrap">{t.body}</p>
                {t.requestedItem && <div className="text-xs mt-2 text-fuchsia-200">Request: {t.requestedItemType} · {t.requestedItem}</div>}
                {t.assignedKey && <div className="text-xs mt-2 rounded bg-green-900/20 border border-green-500/30 p-2 text-green-300">Assigned key: {t.assignedKey}</div>}
                {t.replies.map(r => <div key={r.id} className="text-xs mt-2 text-fuchsia-100 bg-fuchsia-950/30 rounded p-2">{r.author}: {r.body}</div>)}
              </div>
              {t.status !== "resolved" && <button onClick={() => resolve(t.id)} className="px-3 py-1 rounded border border-green-500/40 text-green-300 text-xs font-bold uppercase hover:bg-green-900/20 whitespace-nowrap"><CheckCircle2 size={12} className="inline mr-1" />Resolve</button>}
            </div>
            {t.status !== "resolved" && (
              <div className="grid md:grid-cols-[1fr_auto] gap-2 mt-3">
                <input placeholder="Type a reply..." value={replyText[t.id] ?? ""} onChange={e => setReplyText(r => ({ ...r, [t.id]: e.target.value }))} className={inputCls} />
                <button onClick={() => sendReply(t.id)} className="px-3 py-2 rounded font-bold uppercase text-white bg-fuchsia-600 text-xs whitespace-nowrap"><FileText size={14} className="inline mr-1" />Send</button>
                <input placeholder="Paste approved license key for this request" value={keyText[t.id] ?? ""} onChange={e => setKeyText(r => ({ ...r, [t.id]: e.target.value }))} className={inputCls} />
                <button onClick={() => assign(t.id)} className="px-3 py-2 rounded font-bold uppercase border border-green-500/40 text-green-300 text-xs whitespace-nowrap"><KeyRound size={14} className="inline mr-1" />Approve With Key</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function SiteSettingsPanel({ owner }: { owner: boolean }) {
  const [settings, setSettings] = useState({
    casinoEnabled: true,
    wheelEnabled: true,
    storeEnabled: true,
    maintenanceMode: false,
    registrationOpen: true,
    showLeaderboard: true,
    discordLink: "https://discord.gg/UPxFnhurmb",
    serverIP: "connect 6aa9y6",
  });
  const [saved, setSaved] = useState(false);

  function toggle(key: keyof typeof settings) {
    if (!owner) return toast.error("Owner only");
    setSettings(s => ({ ...s, [key]: !s[key as keyof typeof settings] }));
  }

  function save() {
    if (!owner) return toast.error("Owner only");
    setSaved(true);
    toast.success("Site settings saved");
    setTimeout(() => setSaved(false), 2000);
  }

  const toggles: [keyof typeof settings, string, React.ElementType][] = [
    ["casinoEnabled", "Casino Enabled", Gamepad2],
    ["wheelEnabled", "Wheel Spins Enabled", Gift],
    ["storeEnabled", "Store Enabled", ShoppingBag],
    ["maintenanceMode", "Maintenance Mode", Wrench],
    ["registrationOpen", "Registration Open", Users],
    ["showLeaderboard", "Show Leaderboard", Trophy],
  ];

  return (
    <Card title="Site Settings" icon={Settings}>
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {toggles.map(([key, label, Icon]) => (
          <button key={key} disabled={!owner} onClick={() => toggle(key)}
            className={`flex items-center gap-3 rounded border p-3 text-left disabled:opacity-40 transition-colors ${settings[key as keyof typeof settings] ? "border-fuchsia-400/50 bg-fuchsia-950/20" : "border-fuchsia-400/20 bg-background/30"}`}>
            <Icon size={16} className={settings[key as keyof typeof settings] ? "text-fuchsia-300" : "text-muted-foreground"} />
            <span className="font-bold text-sm">{label}</span>
            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${settings[key as keyof typeof settings] ? "bg-fuchsia-600/30 text-fuchsia-200" : "bg-secondary text-muted-foreground"}`}>
              {settings[key as keyof typeof settings] ? "ON" : "OFF"}
            </span>
          </button>
        ))}
      </div>
      <div className="space-y-3 mb-6">
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Discord Invite Link</label>
          <input disabled={!owner} value={settings.discordLink} onChange={e => setSettings(s => ({ ...s, discordLink: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">FiveM Server Connect Command</label>
          <input disabled={!owner} value={settings.serverIP} onChange={e => setSettings(s => ({ ...s, serverIP: e.target.value }))} className={inputCls} />
        </div>
      </div>
      <button disabled={!owner} onClick={save} className="px-5 py-3 rounded font-bold uppercase text-white bg-fuchsia-600 disabled:opacity-40 flex items-center gap-2">
        {saved ? <><CheckCircle2 size={16} />Saved!</> : <><Save size={16} />Save Settings</>}
      </button>
    </Card>
  );
}
function ChatManagerPanel({ owner, isAdmin }: { owner: boolean; isAdmin: boolean }) {
  const [customRooms, setCustomRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const canManage = owner || isAdmin;

  function loadRooms() { setCustomRooms(getCustomRooms()); }
  useEffect(() => { loadRooms(); }, []);

  function selectRoom(room: ChatRoom) {
    setSelectedRoom(room);
    setMessages(getMessages(room.id));
  }

  function handleDeleteMsg(roomId: string, msgId: string) {
    if (!canManage) return;
    deleteMessage(roomId, msgId);
    setMessages(getMessages(roomId));
    toast.success("Message deleted");
  }

  function handleDeleteRoom(room: ChatRoom) {
    if (!owner) return toast.error("Owner only");
    if (!confirm(`Delete private room "${room.name}"? All messages will be lost.`)) return;
    deleteRoom(room.id);
    if (selectedRoom?.id === room.id) { setSelectedRoom(null); setMessages([]); }
    loadRooms();
    toast.success("Room deleted");
  }

  function handleClearRoom(roomId: string) {
    if (!canManage) return;
    if (!confirm("Clear ALL messages in this room? This cannot be undone.")) return;
    safeStorage.removeItem(`cof_chat_msgs_${roomId}`);
    setMessages([]);
    toast.success("Room cleared");
  }

  const allRooms = [...BUILT_IN_ROOMS, ...customRooms];

  return (
    <div className="space-y-6">
      <Card title="Chat Room Manager" icon={MessageCircle}>
        <p className="text-sm text-muted-foreground mb-5">
          Moderate all chat rooms — delete messages, clear history, and remove private rooms. Click a room to view and manage its messages.
        </p>

        <div className="grid md:grid-cols-[240px_1fr] gap-4">
          {/* Room list */}
          <div className="space-y-1">
            <div className="text-xs font-black uppercase tracking-widest text-fuchsia-300 mb-2">All Rooms ({allRooms.length})</div>
            {allRooms.map(room => (
              <div key={room.id}
                className={`rounded border p-2.5 cursor-pointer transition ${selectedRoom?.id === room.id ? "border-fuchsia-400 bg-fuchsia-600/20" : "border-fuchsia-400/25 hover:border-fuchsia-400/50 hover:bg-fuchsia-500/5"}`}
                onClick={() => selectRoom(room)}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-sm truncate">{room.name}</div>
                  {room.type === "private" && owner && (
                    <button onClick={e => { e.stopPropagation(); handleDeleteRoom(room); }} className="p-1 rounded text-destructive/60 hover:text-destructive hover:bg-destructive/10">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${room.type === "staff" ? "bg-fuchsia-600/20 text-fuchsia-200" : room.type === "private" ? "bg-amber-500/20 text-amber-300" : "bg-primary/10 text-primary"}`}>{room.type}</span>
                  {room.pin && <span className="text-[10px] text-muted-foreground font-mono">PIN: {room.pin}</span>}
                  {room.expiresAt && <span className="text-[10px] text-muted-foreground">{formatTimeLeft(room.expiresAt)}</span>}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{getMessages(room.id).length} messages</div>
              </div>
            ))}
          </div>

          {/* Message viewer */}
          <div className={`rounded-lg border border-fuchsia-400/25 bg-card min-h-[400px] flex flex-col`}>
            {!selectedRoom ? (
              <div className="flex-1 grid place-items-center text-muted-foreground text-sm">
                <div className="text-center">
                  <MessageCircle className="mx-auto mb-2 opacity-20" size={32} />
                  Select a room to view messages
                </div>
              </div>
            ) : (
              <>
                <div className="p-3 border-b border-fuchsia-400/25 flex items-center justify-between">
                  <span className="font-black text-sm">{selectedRoom.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { selectRoom(selectedRoom); }} className="px-3 py-1.5 rounded border border-fuchsia-400/35 text-xs font-bold uppercase hover:bg-fuchsia-500/10"><RefreshCcw size={12} className="inline mr-1" />Refresh</button>
                    <button onClick={() => handleClearRoom(selectedRoom.id)} disabled={!canManage} className="px-3 py-1.5 rounded border border-destructive/40 text-destructive text-xs font-bold uppercase disabled:opacity-40 hover:bg-destructive/10"><Trash2 size={12} className="inline mr-1" />Clear All</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[500px]">
                  {messages.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No messages in this room.</p>}
                  {messages.map(msg => (
                    <div key={msg.id} className="group flex items-start gap-3 p-2 rounded hover:bg-fuchsia-500/5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className={`text-xs font-black ${msg.isOwner ? "text-fuchsia-300" : msg.isAdmin ? "text-fuchsia-400" : "text-foreground"}`}>{msg.displayName}</span>
                          {msg.isOwner && <span className="text-[10px] px-1 rounded bg-fuchsia-600/20 text-fuchsia-200">Owner</span>}
                          {!msg.isOwner && msg.isAdmin && <span className="text-[10px] px-1 rounded bg-fuchsia-600/10 text-fuchsia-300">Admin</span>}
                          <span className="text-[10px] text-muted-foreground">{new Date(msg.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 break-words">{msg.body}</p>
                      </div>
                      <button
                        disabled={!canManage}
                        onClick={() => handleDeleteMsg(selectedRoom.id, msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition p-1 rounded text-destructive/60 hover:text-destructive disabled:opacity-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Private Rooms Summary */}
      <Card title="Active Private Rooms" icon={Lock}>
        {customRooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No private rooms currently active.</p>
        ) : (
          <div className="space-y-3">
            {customRooms.map(room => (
              <div key={room.id} className="flex items-center gap-4 rounded border border-amber-400/25 bg-amber-500/5 p-4">
                <div className="flex-1 min-w-0">
                  <div className="font-bold flex items-center gap-2">{room.name}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black uppercase border border-amber-400/30">Private</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-4">
                    <span>PIN: <code className="font-mono font-black text-amber-300">{room.pin}</code></span>
                    <span>{getMessages(room.id).length} messages</span>
                    {room.expiresAt && <span className="flex items-center gap-1"><Clock size={11} />{formatTimeLeft(room.expiresAt)}</span>}
                    {room.createdBy && <span>Created by: {room.createdBy.slice(0, 12)}…</span>}
                  </div>
                </div>
                <button
                  disabled={!owner}
                  onClick={() => handleDeleteRoom(room)}
                  className="px-3 py-2 rounded border border-destructive/40 text-destructive text-xs font-bold uppercase disabled:opacity-40 hover:bg-destructive/10 flex items-center gap-1"
                >
                  <Trash2 size={13} />Close
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

  function CouponsPanel({ owner, userEmail }: { owner: boolean; userEmail: string }) {
    const [coupons, setCoupons] = useState<CouponCode[]>([]);
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [percentOff, setPercentOff] = useState(10);
    const [maxUses, setMaxUses] = useState<string>("");
    const [expiresAt, setExpiresAt] = useState("");

    function load() { setCoupons(getCoupons()); }
    useEffect(load, []);

    function handleCreate(e: React.FormEvent) {
      e.preventDefault();
      try {
        createCoupon({
          code,
          description,
          percentOff,
          appliesToAll: true,
          maxUses: maxUses ? parseInt(maxUses) : null,
          expiresAt: expiresAt || null,
          createdBy: userEmail,
        });
        toast.success(`Coupon "${code.toUpperCase()}" created!`);
        setCode(""); setDescription(""); setPercentOff(10); setMaxUses(""); setExpiresAt("");
        load();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not create coupon");
      }
    }

    function handleToggle(id: string) {
      try { toggleCoupon(id); load(); toast.success("Coupon updated"); }
      catch (err) { toast.error(err instanceof Error ? err.message : "Error"); }
    }

    function handleDelete(id: string, c: string) {
      if (!confirm(`Delete coupon "${c}"? This cannot be undone.`)) return;
      deleteCoupon(id); load(); toast.success("Coupon deleted");
    }

    const statusColor: Record<string, string> = {
      active: "text-green-400",
      inactive: "text-muted-foreground",
      expired: "text-red-400",
      maxed: "text-yellow-400",
    };

    return (
      <div className="space-y-6">
        <Card title="Coupon Codes" icon={Tag}>
          <p className="text-sm text-muted-foreground mb-6">
            Create promo/coupon codes that members can enter on the pricing page for an extra percentage off on top of the global 45% discount.
          </p>

          {/* Create form */}
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-fuchsia-300 block mb-1">Coupon Code</label>
              <input
                required
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                placeholder="e.g. GHOST20"
                maxLength={20}
                className={inputCls + " font-mono tracking-widest"}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Letters, numbers, hyphens, underscores. Auto-uppercased.</p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-fuchsia-300 block mb-1">Description</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. Halloween special"
                className={inputCls}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-fuchsia-300 block mb-1">Extra % Off</label>
              <input
                required
                type="number"
                min={1}
                max={99}
                value={percentOff}
                onChange={e => setPercentOff(Number(e.target.value))}
                className={inputCls}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Stacks on top of the 45% global discount.</p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-fuchsia-300 block mb-1">Max Uses (blank = unlimited)</label>
              <input
                type="number"
                min={1}
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                className={inputCls}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-fuchsia-300 block mb-1">Expires At (blank = never)</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full px-4 py-3 rounded text-sm font-black uppercase tracking-widest text-white"
                style={{ background: "var(--gradient-blood)" }}>
                <Percent size={14} className="inline mr-2" />
                Create Coupon Code
              </button>
            </div>
          </form>

          {/* Coupon list */}
          {coupons.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No coupon codes yet. Create one above.</p>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-fuchsia-300 mb-2">{coupons.length} Code{coupons.length !== 1 ? "s" : ""}</div>
              {coupons.map((c) => {
                const status = couponStatus(c);
                return (
                  <div key={c.id} className={`rounded-lg border p-4 flex flex-wrap items-center gap-4 ${status === "active" ? "border-green-600/40 bg-green-950/10" : "border-border bg-card/50"}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-black text-lg tracking-widest">{c.code}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border"
                          style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                          −{c.percentOff}% extra
                        </span>
                        <span className={`text-xs font-bold uppercase ${statusColor[status]}`}>{status}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                      <div className="mt-1 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
                        <span>Uses: <span className="font-bold text-foreground">{c.usedCount}{c.maxUses !== null ? ` / ${c.maxUses}` : " (unlimited)"}</span></span>
                        {c.expiresAt && <span>Expires: <span className="font-bold text-foreground">{new Date(c.expiresAt).toLocaleDateString()}</span></span>}
                        <span>By: <span className="font-bold text-foreground">{c.createdBy}</span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggle(c.id)}
                        className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest border transition ${c.isActive ? "border-yellow-600/50 text-yellow-300 hover:bg-yellow-950/20" : "border-green-600/50 text-green-300 hover:bg-green-950/20"}`}>
                        {c.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.code)}
                        className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest border border-red-600/50 text-red-300 hover:bg-red-950/20 transition">
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    );
  }

function AdminNotificationsCard() {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const refresh = () => setItems(getAdminNotifications());
  useEffect(() => { refresh(); const id = setInterval(refresh, 1500); return () => clearInterval(id); }, []);
  const unread = items.filter((n) => !n.read).length;

  return (
    <Card title={`Notifications${unread ? ` (${unread} new)` : ""}`} icon={Bell}>
      <div className="flex gap-2 mb-3">
        <button onClick={() => { markAllAdminNotificationsRead(); refresh(); }} className="rounded border border-border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground">Mark all read</button>
        <button onClick={() => { clearAdminNotifications(); refresh(); }} className="rounded border border-border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground">Clear</button>
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">No notifications yet.</div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-auto pr-1">
          {items.map((n) => (
            <div key={n.id} className={`flex items-start justify-between gap-3 rounded border px-3 py-2 ${n.read ? "border-border bg-card/40" : "border-fuchsia-400/40 bg-fuchsia-500/10"}`}>
              <div>
                <div className="text-sm font-bold">{n.title}</div>
                {n.body && <div className="text-xs text-muted-foreground">{n.body}</div>}
                <div className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-1">
                {!n.read && <button onClick={() => { markAdminNotificationRead(n.id); refresh(); }} className="rounded bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-2 py-1 text-[10px] font-black uppercase">Read</button>}
                <button onClick={() => { deleteAdminNotification(n.id); refresh(); }} className="rounded border border-border px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function PhoneRequestsPanel() {
  const [reqs, setReqs] = useState<PhoneRequest[]>([]);
  const refresh = () => setReqs(getPhoneRequests().sort((a, b) => b.createdAt - a.createdAt));
  useEffect(() => { refresh(); const id = setInterval(refresh, 1500); return () => clearInterval(id); }, []);

  async function approve(id: string) {
    const req = getPhoneRequests().find((r) => r.id === id);
    decidePhoneRequest(id, "approved");
    refresh();
    toast.success("Approved. User now has phone access.");
    if (req?.discord) {
      try {
        const res = await syncPhoneDiscordRole({ data: { discord: req.discord, action: "grant" } });
        res.ok ? toast.success(`Discord: ${res.message}`) : toast.error(`Discord: ${res.message}`);
      } catch {
        toast.error("Discord role sync failed.");
      }
    } else {
      toast.message("No Discord provided — role not synced.");
    }
  }
  async function deny(id: string) {
    const req = getPhoneRequests().find((r) => r.id === id);
    const wasApproved = req?.status === "approved";
    decidePhoneRequest(id, "denied");
    refresh();
    toast.message("Request denied.");
    if (wasApproved && req?.discord) {
      try {
        const res = await syncPhoneDiscordRole({ data: { discord: req.discord, action: "revoke" } });
        if (!res.ok) toast.error(`Discord: ${res.message}`);
      } catch { /* ignore */ }
    }
  }
  function remove(id: string) { deletePhoneRequest(id); refresh(); }

  const pending = reqs.filter((r) => r.status === "pending");
  const decided = reqs.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <AdminNotificationsCard />
      <Card title="Phone Requests" icon={Smartphone}>
        <p className="text-xs text-muted-foreground mb-4">
          {PHONE_NAME} — ${PHONE_PRICE.toFixed(2)}. Approve a request to grant the buyer access to use the phone on the site.
        </p>
        {pending.length === 0 ? (
          <div className="text-sm text-muted-foreground">No pending requests.</div>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-bold">{r.username} <span className="text-xs text-muted-foreground">· {r.email ?? "no email"}</span></div>
                    <div className="text-[11px] text-muted-foreground">Requested {new Date(r.createdAt).toLocaleString()}</div>
                    <div className="text-[11px] text-fuchsia-300">Discord: {r.discord || "not provided"}</div>
                    {r.note && <p className="mt-2 text-sm text-muted-foreground italic">"{r.note}"</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approve(r.id)} className="inline-flex items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-black uppercase tracking-wider">
                      <Check size={14} /> Approve
                    </button>
                    <button onClick={() => deny(r.id)} className="inline-flex items-center gap-1 rounded bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 text-xs font-black uppercase tracking-wider">
                      <X size={14} /> Deny
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="History" icon={Clock}>
        {decided.length === 0 ? (
          <div className="text-sm text-muted-foreground">No decisions yet.</div>
        ) : (
          <div className="space-y-2">
            {decided.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded border border-border bg-card/50 px-3 py-2 text-sm">
                <div>
                  <span className="font-bold">{r.username}</span>{" "}
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${r.status === "approved" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                    {r.status}
                  </span>
                  <span className="ml-2 text-[11px] text-muted-foreground">{r.decidedAt ? new Date(r.decidedAt).toLocaleString() : ""}</span>
                </div>
                <div className="flex gap-1">
                  {r.status === "denied" && (
                    <button onClick={() => approve(r.id)} className="rounded bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 text-[10px] font-black uppercase">Approve</button>
                  )}
                  {r.status === "approved" && (
                    <button onClick={() => deny(r.id)} className="rounded bg-red-600 hover:bg-red-500 text-white px-2 py-1 text-[10px] font-black uppercase">Revoke</button>
                  )}
                  <button onClick={() => remove(r.id)} className="rounded border border-border px-2 py-1 text-[10px] font-black uppercase text-muted-foreground hover:text-foreground"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
  
