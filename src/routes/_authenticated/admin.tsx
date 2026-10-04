import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DemoBadge } from "@/components/site/ui-bits";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Haidery" },
      { name: "description", content: "Approve member profiles, manage trusted organisations and demo data." },
      { property: "og:title", content: "Admin — Haidery" },
      { property: "og:description", content: "Haidery admin area." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const qc = useQueryClient();
  const admin = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      return !!data;
    },
  });
  const settings = useQuery({
    queryKey: ["settings"], enabled: !!admin.data,
    queryFn: async () => (await supabase.from("app_settings").select("show_demo").eq("id", 1).single()).data,
  });
  const talent = useQuery({
    queryKey: ["admin-talent"], enabled: !!admin.data,
    queryFn: async () => {
      const { data, error } = await supabase.from("talent").select("id,role,city,category,approved,verified,is_demo,talent_contacts(full_name)").order("approved").order("is_demo");
      if (error) throw error;
      return data;
    },
  });
  const orgs = useQuery({
    queryKey: ["admin-orgs"], enabled: !!admin.data,
    queryFn: async () => (await supabase.from("trusted_orgs").select("*").order("approved").order("name")).data ?? [],
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [org, setOrg] = useState({ name: "", city: "", kind: "Company" });

  if (admin.isLoading) return <p className="p-10 text-center text-sm">Loading…</p>;
  if (!admin.data) return <div className="mx-auto max-w-md p-10 text-center"><h1 className="text-2xl">Admins only</h1><Link to="/dashboard" className="mt-3 inline-block text-link">Back to My projects</Link></div>;

  const refresh = () => qc.invalidateQueries();
  async function toggleDemo(v: boolean) { await supabase.from("app_settings").update({ show_demo: v }).eq("id", 1); refresh(); }
  async function deleteDemo() {
    if (!confirm("Delete ALL demo members, opportunities, projects and organisations? This cannot be undone.")) return;
    const { error } = await supabase.rpc("delete_demo_data");
    setMsg(error ? error.message : "All demo data deleted."); refresh();
  }
  async function setTalent(id: string, patch: { approved?: boolean; verified?: boolean }) { await supabase.from("talent").update(patch).eq("id", id); refresh(); }
  async function rejectTalent(id: string) { if (confirm("Remove this profile?")) { await supabase.from("talent").delete().eq("id", id); refresh(); } }
  async function addOrg(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("trusted_orgs").insert({ ...org, approved: true });
    if (error) setMsg(error.message); else { setOrg({ name: "", city: "", kind: "Company" }); refresh(); }
  }
  async function setOrgApproved(id: string, approved: boolean) { await supabase.from("trusted_orgs").update({ approved }).eq("id", id); refresh(); }

  const pending = (talent.data ?? []).filter((t) => !t.approved);
  const live = (talent.data ?? []).filter((t) => t.approved);
  const btn = "rounded-[12px] border border-border px-3 py-1.5 text-xs font-semibold";
  const name = (t: { talent_contacts: { full_name: string } | { full_name: string }[] | null }) => {
    const c = Array.isArray(t.talent_contacts) ? t.talent_contacts[0] : t.talent_contacts;
    return c?.full_name ?? "Name not added";
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-24 pt-8 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-primary">Admin</h1>
      {msg && <p className="text-sm">{msg}</p>}

      <section className="glass p-6">
        <h2 className="text-xl">Demo data</h2>
        <label className="mt-3 flex items-center gap-3 text-sm">
          <input type="checkbox" checked={settings.data?.show_demo ?? true} onChange={(e) => toggleDemo(e.target.checked)} className="h-4 w-4" />
          Show demo data in search, matching and listings
        </label>
        <button onClick={deleteDemo} className="mt-4 rounded-[12px] border border-destructive px-3 py-1.5 text-sm font-semibold text-destructive">Delete all demo data</button>
      </section>

      <section className="glass p-6">
        <h2 className="text-xl">Profiles waiting for approval ({pending.length})</h2>
        {!pending.length && <p className="mt-2 text-sm">Nothing waiting.</p>}
        <div className="mt-3 space-y-2">
          {pending.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-border bg-card p-3 text-sm">
              <span><b className="text-foreground">{t.role}</b> · {t.city} · {t.category}</span>
              <div className="flex gap-2">
                <button onClick={() => setTalent(t.id, { approved: true })} className="rounded-[12px] bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Approve</button>
                <button onClick={() => rejectTalent(t.id)} className={btn}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass p-6">
        <h2 className="text-xl">Approved members ({live.length})</h2>
        <div className="mt-3 max-h-96 space-y-2 overflow-y-auto">
          {live.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-border bg-card p-3 text-sm">
              <span><b className="text-foreground">{name(t)}</b> · {t.role} · {t.city} {t.is_demo && <DemoBadge />}</span>
              <div className="flex gap-2">
                <button onClick={() => setTalent(t.id, { verified: !t.verified })} className={btn}>{t.verified ? "Remove verified" : "Mark verified"}</button>
                <button onClick={() => setTalent(t.id, { approved: false })} className={btn}>Unpublish</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass p-6">
        <h2 className="text-xl">Trusted by</h2>
        <form onSubmit={addOrg} className="mt-3 flex flex-wrap gap-2">
          <input required value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} placeholder="Organisation name" className="rounded-[12px] border border-border bg-card px-3 py-2 text-sm" />
          <input required value={org.city} onChange={(e) => setOrg({ ...org, city: e.target.value })} placeholder="City" className="rounded-[12px] border border-border bg-card px-3 py-2 text-sm" />
          <select value={org.kind} onChange={(e) => setOrg({ ...org, kind: e.target.value })} className="rounded-[12px] border border-border bg-card px-3 py-2 text-sm">{["Company", "Education", "Non-profit"].map((k) => <option key={k}>{k}</option>)}</select>
          <button className="rounded-[12px] bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Add</button>
        </form>
        <div className="mt-3 space-y-2">
          {(orgs.data ?? []).map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-border bg-card p-3 text-sm">
              <span><b className="text-foreground">{o.name}</b> · {o.kind} · {o.city} {o.is_demo && <DemoBadge />} {!o.approved && <span className="text-hint">(hidden)</span>}</span>
              <button onClick={() => setOrgApproved(o.id, !o.approved)} className={btn}>{o.approved ? "Hide" : "Approve"}</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
