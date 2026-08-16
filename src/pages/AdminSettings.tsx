import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isOwnerSession } from "@/lib/owner";
import { toast } from "sonner";
import { Settings, Save, Users, Shield, Gamepad2, Gift, ShoppingBag, Trophy, MessageCircle } from "lucide-react";

export default function AdminSettingsPage() {
  const { isAdmin, loading } = useAuth();
  const [owner] = useState(() => isOwnerSession());
  const canManage = owner || isAdmin;
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from("site_settings").select("value").eq("key", "site_config").maybeSingle();
        if (data?.value) setSettings(prev => ({ ...prev, ...data.value }));
      } catch { /* ignore */ }
    }
    load();
  }, []);

  async function save() {
    if (!canManage) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("site_settings").upsert({ key: "site_config", value: settings });
      if (error) throw error;
      toast.success("Settings saved");
    } catch {
      toast.error("Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  function toggle(key: keyof typeof settings) {
    if (!canManage) return;
    setSettings(s => ({ ...s, [key]: !s[key as keyof typeof settings] }));
  }

  if (loading) return <PageLayout title="Admin Settings"><p className="text-muted-foreground">Loading...</p></PageLayout>;

  const toggles: [keyof typeof settings, string, typeof Settings][] = [
    ["casinoEnabled", "Casino Enabled", Gamepad2],
    ["wheelEnabled", "Wheel Spins Enabled", Gift],
    ["storeEnabled", "Store Enabled", ShoppingBag],
    ["maintenanceMode", "Maintenance Mode", Settings],
    ["registrationOpen", "Registration Open", Users],
    ["showLeaderboard", "Show Leaderboard", Trophy],
  ];

  return (
    <PageLayout title="Admin Settings">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings size={18} className="text-primary" />
            <h2 className="text-lg font-black uppercase tracking-wide">Feature Toggles</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {toggles.map(([key, label, Icon]) => (
              <button key={key} disabled={!canManage} onClick={() => toggle(key)}
                className={`flex items-center gap-3 rounded border p-3 text-left disabled:opacity-40 transition ${settings[key] ? "border-primary/50 bg-primary/10" : "border-border bg-background/30"}`}>
                <Icon size={16} className={settings[key] ? "text-primary" : "text-muted-foreground"} />
                <span className="font-bold text-sm flex-1">{label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${settings[key] ? "bg-primary/30 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  {settings[key] ? "ON" : "OFF"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={18} className="text-primary" />
            <h2 className="text-lg font-black uppercase tracking-wide">Site Configuration</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Discord Invite Link</label>
              <input disabled={!canManage} value={settings.discordLink} onChange={e => setSettings(s => ({ ...s, discordLink: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">FiveM Server Connect Command</label>
              <input disabled={!canManage} value={settings.serverIP} onChange={e => setSettings(s => ({ ...s, serverIP: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
            </div>
          </div>
          <button onClick={save} disabled={!canManage || saving}
            className="mt-6 w-full px-4 py-3 rounded text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "var(--gradient-blood)" }}>
            <Save size={16} />{saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
