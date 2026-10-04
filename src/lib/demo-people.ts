// Blind-first preview profiles: skills, city and fit only — no names or photos.
export type Person = {
  id: string;
  initials: string;
  role: string;
  city: string;
  skills: string[];
  score: number;
  reason: string;
  community: boolean;
  verified: boolean;
  rising?: boolean;
  isDemo?: boolean;
  category?: string;
  dayRate?: number;
};

export const PEOPLE: Person[] = [
  { id: "m-104", initials: "VE", role: "Video editor", city: "Mumbai", skills: ["Premiere Pro", "Reels", "Color grading"], score: 92, reason: "14 brand reels delivered, available this week", community: true, verified: true },
  { id: "m-221", initials: "MG", role: "Motion designer", city: "Pune", skills: ["After Effects", "Animation", "Video editing"], score: 84, reason: "Strong portfolio, 2 similar launches", community: true, verified: true, rising: true },
  { id: "m-087", initials: "DA", role: "Data analyst", city: "Hyderabad", skills: ["Python", "SQL", "Data analysis"], score: 88, reason: "Retail dashboards, 4.9 rating", community: true, verified: true },
  { id: "m-312", initials: "ML", role: "ML engineer", city: "Bengaluru", skills: ["Machine learning", "Python", "Data"], score: 79, reason: "Shipped 3 forecasting models", community: true, verified: false, rising: true },
  { id: "m-145", initials: "BD", role: "Brand designer", city: "Lucknow", skills: ["Brand identity", "Figma", "Logo design"], score: 86, reason: "9 identity systems, on-time 100%", community: true, verified: true },
  { id: "m-033", initials: "UT", role: "Urdu translator", city: "Hyderabad", skills: ["Urdu translation", "Hindi", "Writing"], score: 90, reason: "Legal and literary work, 6 years", community: true, verified: true },
  { id: "m-276", initials: "PM", role: "Performance marketer", city: "Delhi", skills: ["Meta Ads", "Google Ads", "Performance marketing"], score: 81, reason: "₹40L managed spend, D2C focus", community: true, verified: true },
  { id: "m-198", initials: "PH", role: "Product photographer", city: "Surat", skills: ["Photography", "Product shoots", "Lightroom"], score: 77, reason: "Textile catalogues, own studio", community: true, verified: false },
  { id: "m-402", initials: "WD", role: "Web developer", city: "Chennai", skills: ["React", "TypeScript", "Web apps"], score: 85, reason: "5 production apps, fast replies", community: true, verified: true },
  { id: "m-059", initials: "TU", role: "Tutor", city: "Bhopal", skills: ["Math tutoring", "Physics", "Education"], score: 83, reason: "Board exam results, 200+ students", community: true, verified: true },
];

export function searchPeople(q: string) {
  const words = q.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  if (!words.length) return [...PEOPLE].sort((a, b) => b.score - a.score);
  return PEOPLE.map((p) => {
    const hay = [p.role, p.city, ...p.skills].join(" ").toLowerCase();
    const hits = words.filter((w) => hay.includes(w)).length;
    return { p, hits };
  })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits || b.p.score - a.p.score)
    .map((x) => x.p);
}

export const OPPORTUNITIES = [
  { id: "p-11", title: "Launch reel series for a jewellery brand", budget: 45000, city: "Mumbai", skills: ["Video editing", "Reels"], state: "community" as const, daysLeft: 2, offered: 12, interested: 3, declined: 5 },
  { id: "p-14", title: "Sales dashboard for a kirana chain", budget: 60000, city: "Remote", skills: ["SQL", "Data analysis"], state: "community" as const, daysLeft: 5, offered: 8, interested: 4, declined: 1 },
  { id: "p-07", title: "Urdu–English subtitle pack, 20 episodes", budget: 32000, city: "Remote", skills: ["Urdu translation"], state: "community" as const, daysLeft: 6, offered: 6, interested: 2, declined: 0 },
  { id: "p-03", title: "Rebrand for a Lucknow chikankari label", budget: 75000, city: "Lucknow", skills: ["Brand identity", "Figma"], state: "open" as const, daysLeft: 0, offered: 9, interested: 0, declined: 9 },
  { id: "p-19", title: "Data internship, 3 months", budget: 15000, city: "Hyderabad", skills: ["Python", "SQL"], state: "community" as const, daysLeft: 4, offered: 10, interested: 6, declined: 2 },
];
