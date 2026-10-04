import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MatchRing, VerifiedPill, DemoBadge } from "@/components/site/ui-bits";
import { formatINR } from "@/lib/network-data";

export const Route = createFileRoute("/member/$id")({
  head: () => ({
    meta: [
      { title: "Member profile — Haidery" },
      { name: "description", content: "A blind-first Haidery member profile: skills, city and fit." },
      { property: "og:title", content: "Member profile — Haidery" },
      { property: "og:description", content: "Blind-first member profile." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Member,
});

function Member() {
  const { id } = Route.useParams();
  const t = useQuery({
    queryKey: ["member", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("talent").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const contact = useQuery({
    queryKey: ["member-contact", id],
    enabled: !!t.data?.is_demo,
    queryFn: async () => {
      const { data } = await supabase.from("talent_contacts").select("phone,email").eq("talent_id", id).maybeSingle();
      return data;
    },
  });

  if (t.isLoading) return <p className="p-10 text-center text-sm">Loading…</p>;
  if (!t.data) return <div className="mx-auto max-w-xl p-10 text-center"><h1 className="text-2xl">Profile not available</h1><Link to="/talent" search={{ q: "" }} className="mt-4 inline-block text-link">Back to Find talent</Link></div>;
  const p = t.data;
  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-10 sm:px-6">
      <Link to="/talent" search={{ q: "" }} className="inline-flex items-center gap-1 text-sm text-link"><ArrowLeft className="h-4 w-4" />Find talent</Link>
      <div className="glass mt-4 p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-signature p-[2px]"><div className="grid h-14 w-14 place-items-center rounded-full bg-card font-display font-bold text-foreground">{p.initials}</div></div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl">{p.role}</h1>
              {p.verified && <VerifiedPill />}
              {p.community && <span className="rounded-full bg-community-tint px-2 py-0.5 text-[11px] font-semibold text-primary">Community</span>}
              {p.is_demo && <DemoBadge />}
            </div>
            <p className="text-sm">{p.city} · {formatINR(p.day_rate)}/day</p>
          </div>
          <MatchRing value={p.score} size={56} />
        </div>
        <p className="mt-4">{p.reason}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{p.skills.map((s) => <span key={s} className="rounded-lg bg-secondary px-2 py-0.5 text-xs">{s}</span>)}</div>
        <div className="mt-6 rounded-[16px] border border-border bg-card p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-foreground"><Lock className="h-4 w-4 text-primary" />Contact</div>
          {p.is_demo ? (
            contact.data ? <p className="mt-1">Demo placeholder only: {contact.data.phone} · {contact.data.email}</p> : <p className="mt-1">Sign in to see the demo placeholder contact.</p>
          ) : <p className="mt-1">Name, phone and email are shared only after shortlist and the member's consent.</p>}
        </div>
      </div>
    </div>
  );
}
