import { PageLayout } from "@/components/PageLayout";
import { Link } from "@tanstack/react-router";
import { Crown, Gem, Award, Star, Zap, Infinity as InfinityIcon, Check, Shield } from "lucide-react";

const tiers = [
  { name: "Silver", price: "5", icon: Award, color: "var(--tier-silver)", perks: ["In-game Silver tag", "Priority queue", "Discord Silver role", "5% shop discount"] },
  { name: "Gold", price: "10", icon: Star, color: "var(--tier-gold)", perks: ["All Silver perks", "Exclusive vehicles", "Custom plate", "10% shop discount", "Gold Discord role"] },
  { name: "Platinum", price: "20", icon: Crown, color: "var(--tier-platinum)", perks: ["All Gold perks", "Apartment upgrade", "Premium garage slots", "15% shop discount", "Early access events"], featured: true },
  { name: "Diamond", price: "35", icon: Gem, color: "var(--tier-diamond)", perks: ["All Platinum perks", "Custom MLO interior", "Reserved slot", "20% shop discount", "Personal blip"] },
  { name: "Premium", price: "60", icon: Zap, color: "var(--tier-premium)", perks: ["All Diamond perks", "Custom scripted item", "VIP support line", "30% shop discount", "Founder's badge"] },
  { name: "Infinite", price: "299", priceLabel: "lifetime", icon: InfinityIcon, color: "var(--primary-glow)", perks: ["All Premium perks - forever", "One-time payment, lifetime access", "Exclusive Infinite-only vehicle", "Custom in-game NPC cameo", "Direct line to staff", "Name in server credits"] },
];

const GLOBAL_DISCOUNT = 45;

export default function MembershipPlansPage() {
  return (
    <PageLayout title="Membership Plans">
      <div className="text-center mb-12">
        <span className="text-xs font-bold tracking-widest uppercase text-primary">Support the City</span>
        <h2 className="mt-3 text-4xl font-black uppercase">Choose Your Tier</h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          Every membership requires a unique 3-day license key or admin/owner approval before it can be activated. All sales are non-refundable.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 text-xs font-bold uppercase tracking-widest text-primary">
          <Shield size={14} /> {GLOBAL_DISCOUNT}% OFF EVERYTHING
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          const discounted = Math.round(Number(tier.price) * (1 - GLOBAL_DISCOUNT / 100));
          return (
            <div key={tier.name}
              className={`relative rounded-lg border bg-card p-6 flex flex-col transition hover:-translate-y-1 ${tier.featured ? "border-primary" : "border-border"}`}
              style={tier.featured ? { boxShadow: "var(--shadow-glow)" } : {}}>
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full text-primary-foreground"
                  style={{ background: "var(--gradient-blood)" }}>
                  Most Popular
                </div>
              )}
              <Icon size={32} style={{ color: tier.color }} />
              <h3 className="mt-4 text-2xl font-black uppercase tracking-wide">{tier.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-black">${discounted}</span>
                <span className="text-xs text-muted-foreground">/{tier.priceLabel ?? "mo"}</span>
                <span className="ml-2 text-xs line-through text-muted-foreground">${tier.price}</span>
              </div>
              <ul className="mt-6 space-y-3 flex-1">
                {tier.perks.map(p => (
                  <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" /><span>{p}</span>
                  </li>
                ))}
              </ul>
              <a href="/auth"
                className={`mt-6 block text-center px-4 py-3 rounded text-xs font-bold uppercase tracking-widest transition ${tier.featured ? "text-primary-foreground" : "border border-border bg-secondary hover:bg-accent"}`}
                style={tier.featured ? { background: "var(--gradient-blood)" } : {}}>
                Sign in to Request Approval
              </a>
              <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-primary/80">Non-Refundable</p>
            </div>
          );
        })}
      </div>
    </PageLayout>
  );
}
