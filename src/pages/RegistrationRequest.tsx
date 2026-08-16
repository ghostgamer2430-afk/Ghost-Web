import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, User, Mail, MessageCircle, FileText, Shield } from "lucide-react";

export default function RegistrationRequestPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    discord: "",
    age: "",
    character_name: "",
    character_background: "",
    experience: "",
    why_join: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || !form.why_join.trim()) {
      return toast.error("Please fill in all required fields");
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("registration_requests").insert({
        full_name: form.full_name,
        email: form.email,
        discord: form.discord || null,
        age: form.age ? Number(form.age) : null,
        character_name: form.character_name || null,
        character_background: form.character_background || null,
        experience: form.experience || null,
        why_join: form.why_join,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Registration request submitted! We'll review it and get back to you.");
      setSubmitted(true);
    } catch {
      toast.error("Could not submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <PageLayout title="Registration Request">
        <div className="max-w-lg mx-auto rounded-lg border border-green-600/40 bg-green-900/10 p-8 text-center">
          <Shield size={48} className="mx-auto text-green-400 mb-4" />
          <h2 className="text-2xl font-black uppercase">Request Submitted</h2>
          <p className="mt-4 text-muted-foreground">Your registration request has been received. Our team will review it and contact you via email or Discord.</p>
          <a href="/" className="mt-6 inline-block px-6 py-3 rounded text-sm font-bold uppercase tracking-widest border border-border hover:bg-accent transition">
            Back to Home
          </a>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Registration Request">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <p className="text-sm text-muted-foreground">
            Fill out this form to request membership in City of Fears. All fields marked with * are required. Our team reviews every request before approving new members.
          </p>
        </div>

        <form onSubmit={submit} className="rounded-lg border border-border bg-card p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Full Name *</label>
              <input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Email *</label>
              <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Discord Username</label>
              <input value={form.discord} onChange={e => setForm(f => ({ ...f, discord: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Age</label>
              <input type="number" min={13} max={120} value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Character Name</label>
              <input value={form.character_name} onChange={e => setForm(f => ({ ...f, character_name: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Character Background</label>
            <textarea rows={3} value={form.character_background} onChange={e => setForm(f => ({ ...f, character_background: e.target.value }))}
              placeholder="Tell us about your character's story..."
              className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
          </div>

          <div>
            <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Previous RP Experience</label>
            <textarea rows={2} value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
              placeholder="Any previous roleplay experience?"
              className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
          </div>

          <div>
            <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Why do you want to join? *</label>
            <textarea required rows={3} value={form.why_join} onChange={e => setForm(f => ({ ...f, why_join: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none" />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full px-4 py-3 rounded text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "var(--gradient-blood)" }}>
            <Send size={16} />{submitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </PageLayout>
  );
}
