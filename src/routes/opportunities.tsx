import { createFileRoute } from "@tanstack/react-router";
import { Clock, Globe } from "lucide-react";
import { FadeUp, LiftCard } from "@/components/site/ui-bits";
import { OPPORTUNITIES } from "@/lib/demo-people";
import { formatINR } from "@/lib/network-data";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunities — Trusted Network" },
      { name: "description", content: "Projects in their 7-day community priority window, and those opened to outside talent." },
      { property: "og:title", content: "Opportunities — Trusted Network" },
      { property: "og:description", content: "Community members see every project first, for 7 days." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Opps,
});

function Opps() {
  const live = OPPORTUNITIES.filter((o) => o.state === "community").length;
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6">
      <h1 className="text-3xl sm:text-4xl">Opportunities</h1>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { v: OPPORTUNITIES.length, l: "Live projects" },
          { v: live, l: "In community window" },
          { v: formatINR(OPPORTUNITIES.reduce((s, o) => s + o.budget, 0)), l: "Total budget" },
        ].map((s) => (
          <div key={s.l} className="glass p-4">
            <div className="font-display text-2xl font-extrabold text-foreground tabular">{s.v}</div>
            <div className="text-xs">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {OPPORTUNITIES.map((o, i) => {
          const pending = o.offered - o.interested - o.declined;
          return (
            <FadeUp key={o.id} delay={i * 0.04}>
              <LiftCard className="h-full p-5">
                {o.state === "community" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-community-tint px-2.5 py-1 text-xs font-bold text-community"><Clock className="h-3.5 w-3.5" />Community Priority {o.daysLeft}d left</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-market-tint px-2.5 py-1 text-xs font-bold text-market"><Globe className="h-3.5 w-3.5" />Open market · no community fit</span>
                )}
                <h3 className="mt-3 text-lg leading-snug">{o.title}</h3>
                <p className="text-sm text-hint tabular">{formatINR(o.budget)} · {o.city}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.skills.map((s) => <span key={s} className="rounded-lg bg-secondary px-2 py-0.5 text-[11px]">{s}</span>)}
                </div>
                <p className="mt-4 border-t border-border pt-3 text-xs tabular">
                  Offered to {o.offered} • {o.interested} interested • {o.declined} declined • {pending} pending
                </p>
              </LiftCard>
            </FadeUp>
          );
        })}
      </div>
    </div>
  );
}
