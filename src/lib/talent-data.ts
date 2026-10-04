import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Person } from "@/lib/demo-people";

// RLS already hides demo rows when the admin turns demo mode off.
export const talentQuery = queryOptions({
  queryKey: ["talent"],
  queryFn: async (): Promise<Person[]> => {
    const { data, error } = await supabase.from("talent").select("*").eq("approved", true);
    if (error) throw error;
    return data.map((t) => ({
      id: t.id, initials: t.initials, role: t.role, city: t.city, skills: t.skills, score: t.score,
      reason: t.reason, community: t.community, verified: t.verified, isDemo: t.is_demo, category: t.category, dayRate: t.day_rate,
    }));
  },
});

export const opportunitiesQuery = queryOptions({
  queryKey: ["opportunities"],
  queryFn: async () => {
    const { data, error } = await supabase.from("opportunities").select("*");
    if (error) throw error;
    return [...data].sort((a, b) => Number(a.is_demo) - Number(b.is_demo) || a.window_ends_at.localeCompare(b.window_ends_at));
  },
});

export const trustedQuery = queryOptions({
  queryKey: ["trusted"],
  queryFn: async () => {
    const { data, error } = await supabase.from("trusted_orgs").select("id,name,city,kind,is_demo").eq("approved", true).order("is_demo").order("name");
    if (error) throw error;
    return data;
  },
});

export const statsQuery = queryOptions({
  queryKey: ["public-stats"],
  queryFn: async () => {
    const { data, error } = await supabase.rpc("public_stats");
    if (error) throw error;
    return data as { members: number; verified: number; projects: number };
  },
});

/** Real members always rank above demo ones; then by keyword hits, then score. */
export function rankPeople(people: Person[], q: string) {
  const words = q.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const scored = people.map((p) => {
    const hay = [p.role, p.city, p.category ?? "", ...p.skills].join(" ").toLowerCase();
    return { p, hits: words.filter((w) => hay.includes(w)).length };
  });
  return scored
    .filter((x) => !words.length || x.hits > 0)
    .sort((a, b) => Number(!!a.p.isDemo) - Number(!!b.p.isDemo) || b.hits - a.hits || b.p.score - a.p.score)
    .map((x) => x.p);
}

export const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 864e5));
