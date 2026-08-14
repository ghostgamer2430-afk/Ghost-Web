import { Link } from "@/lib/wouter-compat";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Skull, Lock, Unlock, Plus, MessageCircle, Eye, Coins, Pin, Trash2,
  Send, Tag, Loader2, Search, RefreshCcw, ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isOwnerSession } from "@/lib/owner";
import { safeStorage } from "@/lib/safe-storage";
import {
  fetchPosts, createPost, stripLockedLink, unlockLink,
  checkUnlocked, incrementViews, FORUM_CATEGORIES, POST_COST,
  type ForumPost,
} from "@/lib/forum";

const inputCls = "w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none text-sm";
const cardCls = "rounded-lg border border-border bg-card p-6";

export default function ForumPage() {
  const { user, isAdmin, loading } = useAuth();
  const isOwner = isOwnerSession();
  const canManage = isAdmin || isOwner;

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [busy, setBusy] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [credits, setCredits] = useState(() => Number(safeStorage.getItem("cof_credits") || "0"));
  const [refreshKey, setRefreshKey] = useState(0);

  const loadPosts = useCallback(async () => {
    setBusy(true);
    try {
      const data = await fetchPosts();
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts, refreshKey]);

  const filtered = posts.filter(p => {
    if (activeCategory !== "all" && p.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q) || p.author_display_name.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center px-4" style={{ background: "var(--gradient-dark)" }}>
        <div className={cardCls + " max-w-md text-center"}>
          <Lock className="mx-auto text-primary mb-4" size={44} />
          <h1 className="text-3xl font-black uppercase">Forum</h1>
          <p className="mt-3 text-muted-foreground text-sm">Sign in to browse and post on the City of Fears forum.</p>
          <Link href="/auth" className="mt-6 inline-block px-6 py-3 rounded font-black uppercase tracking-widest text-primary-foreground text-sm" style={{ background: "var(--gradient-blood)" }}>Sign In</Link>
          <div className="mt-3"><Link href="/" className="text-xs text-muted-foreground hover:text-primary">← Back home</Link></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ background: "var(--gradient-dark)" }}>
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-sm font-black tracking-widest hover:text-primary transition">
              <Skull className="text-primary" size={20} />
              <span className="hidden sm:block">CITY OF FEARS</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-black uppercase tracking-widest text-sm">Forum</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Coins size={13} className="text-primary" />{credits.toLocaleString()}</span>
            <button onClick={() => setRefreshKey(k => k + 1)} className="hover:text-primary transition"><RefreshCcw size={14} /></button>
            <Link href="/" className="hover:text-primary transition">← Home</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black uppercase">FiveM Forum</h1>
            <p className="text-sm text-muted-foreground mt-1">Post links, guides, and marketplace listings. Lock links behind a credit paywall.</p>
          </div>
          <button onClick={() => setShowCreate(v => !v)} className="flex items-center gap-2 px-4 py-2.5 rounded font-black uppercase tracking-widest text-primary-foreground text-sm" style={{ background: "var(--gradient-blood)" }}>
            <Plus size={16} /> New Post
          </button>
        </div>

        {showCreate && (
          <CreatePostForm credits={credits} onCreated={() => { setShowCreate(false); setRefreshKey(k => k + 1); }} onCancel={() => setShowCreate(false)} />
        )}

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search size={15} className="text-muted-foreground shrink-0" />
            <input placeholder="Search posts…" value={search} onChange={e => setSearch(e.target.value)} className={inputCls} />
          </div>
          <select value={activeCategory} onChange={e => setActiveCategory(e.target.value)} className={inputCls + " max-w-[160px]"}>
            <option value="all">All Categories</option>
            {FORUM_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>

        {busy ? (
          <div className="grid place-items-center py-16 text-muted-foreground"><Loader2 className="animate-spin mb-2" size={28} />Loading posts…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageCircle className="mx-auto mb-3 opacity-20" size={48} />
            <p className="text-sm">No posts yet. Be the first to post!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(post => (
              <PostCard key={post.id} post={post} canManage={canManage} credits={credits} onCreditsChange={(c) => { setCredits(c); setRefreshKey(k => k + 1); }} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CreatePostForm({ credits, onCreated, onCancel }: { credits: number; onCreated: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [hasLockedLink, setHasLockedLink] = useState(false);
  const [lockedUrl, setLockedUrl] = useState("");
  const [lockedCost, setLockedCost] = useState(500);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return toast.error("Title and body are required");
    if (credits < POST_COST) return toast.error(`You need ${POST_COST} credits to post. You have ${credits}.`);
    if (hasLockedLink && (!lockedUrl.trim() || lockedCost < 1)) return toast.error("Enter a valid URL and cost for the locked link");
    setBusy(true);
    try {
      let finalBody = body;
      let finalUrl: string | undefined;
      let finalCost: number | undefined;
      if (hasLockedLink) {
        finalUrl = lockedUrl.trim();
        finalCost = lockedCost;
        finalBody = body + `\n\n[locked:${lockedCost}]${lockedUrl.trim()}[/locked]`;
      }
      await createPost({ title, body: finalBody, category, lockedUrl: finalUrl, lockedCost: finalCost });
      const next = credits - POST_COST;
      safeStorage.setItem("cof_credits", String(next));
      toast.success("Post created!");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create post");
    } finally { setBusy(false); }
  }

  return (
    <div className={cardCls + " mb-6"}>
      <div className="flex items-center gap-2 mb-4">
        <Plus className="text-primary" size={18} />
        <h2 className="text-xl font-black uppercase">Create Post</h2>
        <span className="ml-auto text-xs text-muted-foreground">Costs {POST_COST} credits</span>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid md:grid-cols-[1fr_160px] gap-3">
          <input placeholder="Post title" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
          <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
            {FORUM_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <textarea placeholder="Write your post body…" rows={4} value={body} onChange={e => setBody(e.target.value)} className={inputCls} />
        <div className="rounded border border-border p-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={hasLockedLink} onChange={e => setHasLockedLink(e.target.checked)} className="accent-primary" />
            <Lock size={14} className="text-primary" />
            <span className="text-sm font-bold">Include a locked link (users pay credits to unlock)</span>
          </label>
          {hasLockedLink && (
            <div className="mt-3 grid md:grid-cols-[1fr_140px] gap-3">
              <input placeholder="https://your-link-here.com" value={lockedUrl} onChange={e => setLockedUrl(e.target.value)} className={inputCls} />
              <div className="flex items-center gap-2">
                <Coins size={14} className="text-primary shrink-0" />
                <input type="number" min={1} value={lockedCost} onChange={e => setLockedCost(Math.max(1, Number(e.target.value)))} className={inputCls} />
              </div>
              <p className="text-xs text-muted-foreground md:col-span-2">You set the credit cost. When someone pays, the credits are deducted from their balance.</p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="flex items-center gap-2 px-5 py-2.5 rounded font-black uppercase tracking-widest text-primary-foreground text-sm disabled:opacity-50" style={{ background: "var(--gradient-blood)" }}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Post
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded border border-border text-sm font-bold uppercase hover:bg-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}

function PostCard({ post, canManage, credits, onCreditsChange }: { post: ForumPost; canManage: boolean; credits: number; onCreditsChange: (c: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [revealUrl, setRevealUrl] = useState<string | null>(null);
  const hasLock = post.locked_url && post.locked_cost > 0;
  const displayBody = hasLock && !unlocked ? stripLockedLink(post.body) : post.body;

  useEffect(() => {
    if (hasLock) checkUnlocked(post.id).then(setUnlocked);
  }, [post.id, hasLock]);

  async function handleExpand() {
    if (!expanded) incrementViews(post.id);
    setExpanded(!expanded);
  }

  async function handleUnlock() {
    if (credits < post.locked_cost) return toast.error(`You need ${post.locked_cost} credits. You have ${credits}.`);
    setUnlocking(true);
    try {
      const url = await unlockLink(post.id);
      setRevealUrl(url);
      setUnlocked(true);
      const next = credits - post.locked_cost;
      safeStorage.setItem("cof_credits", String(next));
      onCreditsChange(next);
      toast.success("Link unlocked!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not unlock");
    } finally { setUnlocking(false); }
  }

  return (
    <div className={`rounded-lg border bg-card p-5 transition ${post.is_pinned ? "border-primary/50" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {post.is_pinned && <Pin size={14} className="text-primary shrink-0" />}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wider border border-primary/30">
              <Tag size={9} className="inline mr-1" />{post.category}
            </span>
            {hasLock && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
                <Lock size={9} /> {post.locked_cost} credits
              </span>
            )}
          </div>
          <h3 className="font-black text-lg cursor-pointer hover:text-primary transition" onClick={handleExpand}>{post.title}</h3>
          <div className="text-xs text-muted-foreground mt-0.5">
            by {post.author_display_name} · {new Date(post.created_at).toLocaleString()} · <Eye size={10} className="inline" /> {post.views}
          </div>
        </div>
        {canManage && (
          <button onClick={async () => {
            try {
              const { adminRemovePost } = await import("@/lib/forum");
              await adminRemovePost(post.id);
              toast.success("Post removed");
              window.location.reload();
            } catch { toast.error("Could not remove post"); }
          }} className="p-1.5 rounded border border-destructive/30 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition shrink-0">
            <Trash2 size={14} />
          </button>
        )}
      </div>
      {expanded && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{displayBody}</p>
          {hasLock && !unlocked && (
            <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-500/10 p-4 flex items-center gap-3">
              <Lock className="text-amber-400 shrink-0" size={20} />
              <div className="flex-1">
                <div className="font-bold text-sm text-amber-300">This post contains a locked link</div>
                <div className="text-xs text-muted-foreground">Pay {post.locked_cost} credits to unlock the link.</div>
              </div>
              <button onClick={handleUnlock} disabled={unlocking} className="flex items-center gap-2 px-4 py-2 rounded font-black uppercase tracking-widest text-white text-xs disabled:opacity-50" style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)" }}>
                {unlocking ? <Loader2 size={14} className="animate-spin" /> : <Unlock size={14} />} Unlock ({post.locked_cost})
              </button>
            </div>
          )}
          {hasLock && unlocked && (
            <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 p-4 flex items-center gap-3">
              <Unlock className="text-green-400 shrink-0" size={20} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-green-300">Link unlocked!</div>
                <a href={revealUrl ?? post.locked_url ?? "#"} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline break-all flex items-center gap-1 mt-1">
                  <ExternalLink size={11} /> {revealUrl ?? post.locked_url}
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
