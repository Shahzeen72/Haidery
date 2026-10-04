// Preview data for the public home page. Replaced by Lovable Cloud data in phase 4.
export const SKILL_POOL = [
  ["Video editing", "Premiere Pro", "Reels"],
  ["Motion graphics", "After Effects", "Animation"],
  ["Data analysis", "Python", "SQL"],
  ["Machine learning", "Python", "Data"],
  ["Brand identity", "Figma", "Logo design"],
  ["UI design", "Figma", "Prototyping"],
  ["Copywriting", "SEO", "Content"],
  ["Urdu translation", "Hindi", "Writing"],
  ["Performance marketing", "Meta Ads", "Google Ads"],
  ["Photography", "Product shoots", "Lightroom"],
  ["Math tutoring", "Physics", "Education"],
  ["Voice-over", "Audio mixing", "Podcasts"],
  ["Bookkeeping", "GST", "Tally"],
  ["React", "TypeScript", "Web apps"],
  ["Calligraphy", "Illustration", "Wedding stationery"],
] as const;

export type NetworkNode = {
  position: [number, number, number];
  community: boolean;
  skills: readonly string[];
  city: string;
};

const CITIES = ["Mumbai", "Pune", "Hyderabad", "Bengaluru", "Delhi", "Lucknow", "Surat", "Kolkata", "Chennai", "Bhopal"];

export function buildNodes(count = 90, radius = 3): NetworkNode[] {
  const nodes: NetworkNode[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const community = (i * 7) % 10 < 7;
    const shell = community ? radius * 0.82 : radius * 1.12;
    nodes.push({
      position: [Math.cos(theta) * r * shell, y * shell, Math.sin(theta) * r * shell],
      community,
      skills: SKILL_POOL[(i * 11) % SKILL_POOL.length]!,
      city: CITIES[(i * 3) % CITIES.length]!,
    });
  }
  return nodes;
}

export function matchesQuery(node: NetworkNode, query: string) {
  const q = query.toLowerCase();
  if (q.trim().length < 3) return false;
  const words = q.split(/\W+/).filter((w) => w.length > 3);
  return node.skills.some((s) => {
    const sl = s.toLowerCase();
    return words.some((w) => sl.includes(w) || w.includes(sl.split(" ")[0]!));
  });
}

export const formatINR = (n: number) =>
  "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
