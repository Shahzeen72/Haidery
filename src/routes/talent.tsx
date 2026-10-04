import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { z } from "zod";
import { PersonCard, FadeUp } from "@/components/site/ui-bits";
import { searchPeople } from "@/lib/demo-people";

export const Route = createFileRoute("/talent")({
  validateSearch: z.object({ q: z.string().optional().default("") }),
  head: () => ({
    meta: [
      { title: "Find talent — Haidery" },
      { name: "description", content: "Blind-first, AI-ranked results from verified community members." },
      { property: "og:title", content: "Find talent — Haidery" },
      { property: "og:description", content: "Search verified community talent. Fit, not membership, earns a recommendation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Talent,
});

function Talent() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/talent" });
  const [draft, setDraft] = useState(q);
  const results = searchPeople(q);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6">
      <h1 className="text-3xl sm:text-4xl">Find talent</h1>
      <p className="mt-1">Names and photos stay hidden until shortlist and consent.</p>
      <form
        onSubmit={(e) => { e.preventDefault(); navigate({ search: { q: draft } }); }}
        className="glass mt-6 flex items-center gap-2 p-2 pl-4"
      >
        <Sparkles className="h-5 w-5 text-ai" />
        <input value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Search skills" placeholder="Skill, role or city" className="h-11 flex-1 bg-transparent text-foreground outline-none placeholder:text-hint" />
        <button className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary-hover active:scale-[.98]"><Search className="h-4 w-4" />Search</button>
      </form>
      <p className="mt-6 text-sm text-hint">{results.length} {results.length === 1 ? "match" : "matches"}{q && <> for “{q}”</>}</p>
      <div className="mt-3 space-y-3">
        {results.map((p, i) => <FadeUp key={p.id} delay={i * 0.03}><PersonCard p={p} /></FadeUp>)}
        {!results.length && (
          <div className="glass p-8 text-center">
            <h3 className="text-lg">No community match yet</h3>
            <p className="mt-1 text-sm">Try a broader skill. If nobody fits, a project can later open to outside talent — never silently.</p>
          </div>
        )}
      </div>
    </div>
  );
}
