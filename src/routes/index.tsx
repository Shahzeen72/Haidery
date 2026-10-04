import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Clock, EyeOff, Lock, PenLine, Search, ShieldCheck, Sparkles, Users, Wallet, Briefcase } from "lucide-react";
import { ConstellationScene } from "@/components/three/ConstellationScene";
import { CountUp, FadeUp, LiftCard, MatchRing, PersonCard } from "@/components/site/ui-bits";
import { PEOPLE, OPPORTUNITIES } from "@/lib/demo-people";
import { formatINR } from "@/lib/network-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Haidery — Private, verified opportunity network" },
      { name: "description", content: "Work goes to verified community talent first. AI matching, blind-first profiles and a fair 7-day community window." },
      { property: "og:title", content: "Haidery — Your community, first" },
      { property: "og:description", content: "A private, AI-powered opportunity network where community talent gets the first chance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const EXAMPLES = ["I need a video editor in Mumbai", "Looking for a data internship", "Urdu translator for subtitles", "Brand identity for my label"];

function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [ph, setPh] = useState(0);
  const [matches, setMatches] = useState(0);
  const onMatches = useCallback((n: number) => setMatches(n), []);

  useEffect(() => {
    const id = setInterval(() => setPh((p) => (p + 1) % EXAMPLES.length), 3200);
    return () => clearInterval(id);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/talent", search: { q: query || EXAMPLES[ph] } });
  };

  const top3 = [...PEOPLE].sort((a, b) => b.score - a.score).slice(0, 3);
  const priority = OPPORTUNITIES[0]!;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
      {/* HERO */}
      <section className="grid items-center gap-8 pt-10 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
        <FadeUp>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-glass px-3 py-1.5 text-xs font-semibold text-primary backdrop-blur">
            <Lock className="h-3.5 w-3.5" /> Private • Verified network
          </span>
          <h1 className="mt-5 text-4xl leading-[1.05] sm:text-5xl lg:text-[60px]">
            How can your <span className="text-signature">community</span> help you <span className="text-signature">today</span>?
          </h1>
          <p className="mt-4 max-w-lg text-lg">Work from community companies goes to verified community members first. The outside market opens only when it has to.</p>

          <form onSubmit={submit} className="glass mt-7 flex items-center gap-2 p-2 pl-4">
            <Sparkles className="h-5 w-5 shrink-0 text-ai" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={EXAMPLES[ph]}
              aria-label="Describe what you need"
              className="h-12 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-hint"
            />
            <button type="submit" className="inline-flex h-12 items-center gap-2 rounded-[12px] bg-primary px-5 font-semibold text-primary-foreground transition hover:bg-primary-hover active:scale-[.98]">
              <Search className="h-4 w-4" /> Search
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { i: ShieldCheck, t: "Verified members" },
              { i: EyeOff, t: "Phone & email never public" },
              { i: Users, t: "Blind-first matching" },
            ].map(({ i: I, t }) => (
              <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-glass px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <I className="h-3.5 w-3.5 text-primary" /> {t}
              </span>
            ))}
          </div>
        </FadeUp>

        <div className="relative h-[380px] sm:h-[480px]">
          <ConstellationScene query={query} onMatches={onMatches} />
          <div className="glass pointer-events-none absolute bottom-3 left-3 flex items-center gap-3 px-3 py-2">
            <MatchRing value={query.trim().length >= 3 ? Math.min(98, 55 + matches * 4) : 0} size={40} />
            <div className="text-xs">
              <div className="font-semibold text-foreground">{query.trim().length >= 3 ? `${matches} members light up` : "Type a need to see matches"}</div>
              <div className="flex gap-3 text-hint">
                <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-community" />Community</span>
                <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-market" />Outside</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENTO */}
      <section className="mt-12 grid gap-4 md:grid-cols-4">
        <FadeUp className="md:col-span-2 md:row-span-2">
          <LiftCard className="h-full border-ai/40 p-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ai-tint px-2.5 py-1 text-xs font-bold text-ai"><Sparkles className="h-3.5 w-3.5" /> AI Match</span>
              <span className="text-xs text-hint">Brief: launch reels, Mumbai</span>
            </div>
            <div className="mt-5 flex items-center gap-5">
              <MatchRing value={92} size={88} />
              <div>
                <h3 className="text-xl">3 strong fits found</h3>
                <p className="text-sm">Ranked on skills, past work and availability. Names stay hidden until you shortlist.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {top3.map((p) => <PersonCard key={p.id} p={p} />)}
            </div>
          </LiftCard>
        </FadeUp>

        <FadeUp delay={0.05} className="md:col-span-2">
          <Link to="/talent" search={{ q: "" }} className="block h-full">
            <LiftCard className="flex h-full items-center justify-between gap-4 p-6">
              <div>
                <h3 className="text-xl">Find talent</h3>
                <p className="mt-1 text-sm">{PEOPLE.length} verified profiles across design, data, video and more.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
            </LiftCard>
          </Link>
        </FadeUp>

        <FadeUp delay={0.1} className="md:col-span-2">
          <Link to="/opportunities" className="block h-full">
            <LiftCard className="h-full p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl">Opportunities</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-community-tint px-2.5 py-1 text-xs font-bold text-community">
                  <Clock className="h-3.5 w-3.5" /> Community Priority {priority.daysLeft}d left
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">{priority.title}</p>
              <p className="text-xs text-hint tabular">{formatINR(priority.budget)} · Offered to {priority.offered} • {priority.interested} interested • {priority.declined} declined</p>
            </LiftCard>
          </Link>
        </FadeUp>

        {[
          { i: PenLine, t: "Post a project", d: "Brief coach included", to: "/opportunities" as const },
          { i: Search, t: "Search skills", d: "Blind-first results", to: "/talent" as const },
          { i: Briefcase, t: "Open roles", d: `${OPPORTUNITIES.length} live now`, to: "/opportunities" as const },
          { i: Wallet, t: "14% fair fee", d: "7% fund · 7% organizers", to: "/opportunities" as const },
        ].map(({ i: I, t, d, to }, k) => (
          <FadeUp key={t} delay={0.12 + k * 0.04}>
            <Link to={to} className="block h-full">
              <LiftCard className="h-full p-5">
                <div className="grid h-11 w-11 place-items-center rounded-[12px] bg-signature text-primary-foreground"><I className="h-5 w-5" /></div>
                <h4 className="mt-3 text-base">{t}</h4>
                <p className="text-xs text-hint">{d}</p>
              </LiftCard>
            </Link>
          </FadeUp>
        ))}
      </section>

      {/* STATS */}
      <FadeUp>
        <section className="glass mt-6 grid gap-6 p-6 sm:grid-cols-3">
          {[
            { v: 1240, l: "Verified members", f: undefined },
            { v: 318, l: "Jobs kept in the community", f: undefined },
            { v: 4875000, l: "Earned by members", f: (n: number) => formatINR(n) },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-display text-3xl font-extrabold text-foreground sm:text-4xl"><CountUp to={s.v} format={s.f} /></div>
              <div className="text-sm">{s.l}</div>
            </div>
          ))}
        </section>
      </FadeUp>
    </div>
  );
}
