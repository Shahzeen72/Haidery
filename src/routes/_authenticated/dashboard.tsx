import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/network-data";
import { BadgeCheck, Clock, LogOut, Plus, Shield, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { DemoBadge } from "@/components/site/ui-bits";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your projects — Haidery" },
      { name: "description", content: "Post projects, watch the 7-day community window and shortlist matched members." },
      { property: "og:title", content: "Your projects — Haidery" },
      { property: "og:description", content: "Community-first hiring dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const CATEGORIES = ["Design", "Development", "Video", "Marketing", "Writing", "Data & AI", "Education"];
const FEE = 0.14;
const MIN_SCORE = 60;

function useCountdown(end: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const ms = Math.max(0, new Date(end).getTime() - now);
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4), s = Math.floor((ms % 6e4) / 1e3);
  return { ms, label: `${d}d ${h}h ${m}m ${s}s` };
}

function Dashboard() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [open, setOpen] = useState(false);
  const isAdmin = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      return !!data;
    },
  });

  async function signOut() { await supabase.auth.signOut(); qc.clear(); nav({ to: "/" }); }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-primary">Your projects</h1>
        <div className="flex gap-2">
          <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-2 rounded-[12px] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"><Plus className="h-4 w-4" />Post a project</button>
          {isAdmin.data && <Link to="/admin" className="inline-flex items-center gap-2 rounded-[12px] border border-border bg-card px-3 py-2 text-sm"><Shield className="h-4 w-4" />Admin</Link>}
          <button onClick={signOut} className="inline-flex items-center gap-2 rounded-[12px] border border-border bg-card px-3 py-2 text-sm"><LogOut className="h-4 w-4" />Sign out</button>
        </div>
      </div>
      {open && <NewProject onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["projects"] }); }} />}
      <MemberProfile />
      <div className="mt-6 space-y-4">
        {projects.isLoading && <p className="text-sm">Loading…</p>}
        {projects.data?.length === 0 && !open && <div className="glass p-8 text-center"><p>No projects yet. Post one and community members get the first 7 days.</p></div>}
        {projects.data?.map((p) => <ProjectCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}

function NewProject({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [budget, setBudget] = useState(25000);
  const [err, setErr] = useState<string | null>(null);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("projects").insert({ title, brief, category, budget });
    if (error) setErr(error.message); else onDone();
  }
  const fee = Math.round(budget * FEE);
  return (
    <form onSubmit={save} className="glass mt-6 grid gap-3 p-6">
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title, e.g. Launch reels for a jewellery brand" className="rounded-[12px] border border-border bg-card px-3 py-2.5 text-sm" />
      <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={3} placeholder="What should be delivered, and by when?" className="rounded-[12px] border border-border bg-card px-3 py-2.5 text-sm" />
      <div className="grid gap-3 sm:grid-cols-2">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-[12px] border border-border bg-card px-3 py-2.5 text-sm">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <input type="number" min={1000} step={500} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="rounded-[12px] border border-border bg-card px-3 py-2.5 text-sm tabular-nums" />
      </div>
      <p className="text-sm">Member receives {formatINR(budget - fee)} · Haidery fee 14% ({formatINR(fee)})</p>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <button className="justify-self-start rounded-[12px] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Start 7-day community window</button>
    </form>
  );
}

type Project = { id: string; title: string; brief: string; category: string; budget: number; status: string; community_window_ends_at: string; is_demo: boolean };

function MemberProfile() {
  const qc = useQueryClient();
  const mine = useQuery({
    queryKey: ["my-talent"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("talent").select("id,role,approved").eq("user_id", u.user!.id).maybeSingle();
      return data;
    },
  });
  const [show, setShow] = useState(false);
  const [role, setRole] = useState(""); const [city, setCity] = useState(""); const [category, setCategory] = useState(CATEGORIES[0]!);
  const [skills, setSkills] = useState(""); const [reason, setReason] = useState(""); const [rate, setRate] = useState(3000);
  const [err, setErr] = useState<string | null>(null);
  if (mine.isLoading) return null;
  if (mine.data) return <p className="mt-4 text-sm">Your member profile ({mine.data.role}) is {mine.data.approved ? "approved and visible in search." : "waiting for admin approval."}</p>;
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    const initials = role.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    const { error } = await supabase.from("talent").insert({ user_id: u.user!.id, role, city, category, skills: skills.split(",").map((x) => x.trim()).filter(Boolean), reason, day_rate: rate, initials, score: 80 });
    if (error) setErr(error.message); else qc.invalidateQueries({ queryKey: ["my-talent"] });
  }
  if (!show) return <button onClick={() => setShow(true)} className="mt-4 text-sm text-link hover:underline">Offer your skills — create a member profile</button>;
  return (
    <form onSubmit={save} className="glass mt-4 grid gap-3 p-6 sm:grid-cols-2">
      <input required value={role} onChange={(e) => setRole(e.target.value)} placeholder="Your role, e.g. Video editor" className="rounded-[12px] border border-border bg-card px-3 py-2.5 text-sm" />
      <input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="rounded-[12px] border border-border bg-card px-3 py-2.5 text-sm" />
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-[12px] border border-border bg-card px-3 py-2.5 text-sm">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
      <input type="number" min={500} value={rate} onChange={(e) => setRate(Number(e.target.value))} placeholder="Day rate in ₹" className="rounded-[12px] border border-border bg-card px-3 py-2.5 text-sm" />
      <input required value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Skills, comma separated" className="rounded-[12px] border border-border bg-card px-3 py-2.5 text-sm sm:col-span-2" />
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="One line about your best work" className="rounded-[12px] border border-border bg-card px-3 py-2.5 text-sm sm:col-span-2" />
      {err && <p className="text-sm text-destructive sm:col-span-2">{err}</p>}
      <button className="justify-self-start rounded-[12px] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Send for approval</button>
    </form>
  );
}

function ProjectCard({ p }: { p: Project }) {
  const qc = useQueryClient();
  const cd = useCountdown(p.community_window_ends_at);
  const matches = useQuery({
    queryKey: ["matches", p.category],
    queryFn: async () => {
      const { data, error } = await supabase.from("talent").select("*").eq("category", p.category).eq("approved", true).order("is_demo").order("score", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const shortlist = useQuery({
    queryKey: ["shortlist", p.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("shortlist").select("talent_id").eq("project_id", p.id);
      if (error) throw error;
      return new Set(data.map((r) => r.talent_id));
    },
  });
  const community = (matches.data ?? []).filter((t) => t.community && t.score >= MIN_SCORE);
  const outside = (matches.data ?? []).filter((t) => !t.community);
  const isOpen = p.status === "open_market";
  const triggered = !p.is_demo && p.status === "community_window" && (cd.ms === 0 || (matches.data && community.length === 0));
  const pool = isOpen ? [...community, ...outside] : community;

  async function setStatus(status: string) {
    await supabase.from("projects").update({ status }).eq("id", p.id);
    qc.invalidateQueries({ queryKey: ["projects"] });
  }
  async function shortlistIt(id: string) {
    await supabase.from("shortlist").insert({ project_id: p.id, talent_id: id });
    qc.invalidateQueries({ queryKey: ["shortlist", p.id] });
  }

  return (
    <div className="glass p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">{p.title}</h2>
          <p className="text-sm">{p.category} · {formatINR(p.budget)} {p.is_demo && <DemoBadge />}</p>
        </div>
        {p.status === "community_window" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-community-tint px-3 py-1 text-xs font-semibold text-primary tabular-nums"><Clock className="h-3.5 w-3.5" />Community priority · {cd.label}</span>
        )}
        {isOpen && <span className="rounded-full bg-market-tint px-3 py-1 text-xs font-semibold text-primary">Open to outside talent</span>}
        {p.status === "closed" && <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">Closed</span>}
      </div>

      {triggered && (
        <div className="mt-4 rounded-[16px] border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">{cd.ms === 0 ? "The 7-day community window has ended." : `No community member scored above ${MIN_SCORE}%.`} What next?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => setStatus("open_market")} className="rounded-[12px] bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">Open to outside talent</button>
            <button onClick={() => setStatus("community_window")} className="rounded-[12px] border border-border px-3 py-1.5 text-sm">Wait more</button>
            <button onClick={() => setStatus("closed")} className="rounded-[12px] border border-border px-3 py-1.5 text-sm">Close</button>
          </div>
        </div>
      )}

      {p.is_demo && p.status === "community_window" && cd.ms === 0 && <p className="mt-3 text-sm">Demo: this is where the owner sees the decision card — open to outside talent, wait more, or close.</p>}
      {p.status !== "closed" && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {pool.map((t) => {
            const done = shortlist.data?.has(t.id);
            return (
              <div key={t.id} className="rounded-[16px] border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{t.role} · {t.city}</span>
                  <span className="text-sm font-bold text-ai-text tabular-nums">{t.score}%</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                  {t.community && <span className="rounded-full bg-community-tint px-2 py-0.5 font-semibold text-primary">Community</span>}
                  {t.is_demo && <DemoBadge />}
                  {t.verified && <span className="inline-flex items-center gap-1 rounded-full bg-primary-tint px-2 py-0.5 font-semibold text-primary"><BadgeCheck className="h-3 w-3" />Verified</span>}
                  <span className="text-hint">{formatINR(t.day_rate)}/day</span>
                </div>
                <p className="mt-2 text-sm">{t.reason}</p>
                <button disabled={done} onClick={() => shortlistIt(t.id)} className="mt-3 inline-flex items-center gap-1.5 rounded-[12px] border border-border px-3 py-1.5 text-sm font-medium disabled:opacity-60">
                  <Star className="h-3.5 w-3.5" />{done ? "Shortlisted — name revealed after consent" : "Shortlist"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
