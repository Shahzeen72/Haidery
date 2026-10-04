import { lazy, Suspense, useEffect, useState } from "react";
import { buildNodes, matchesQuery } from "@/lib/network-data";

const Constellation = lazy(() => import("./Constellation"));

function canUse3D() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if ((navigator.hardwareConcurrency ?? 8) < 4) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function Fallback2D({ query }: { query: string }) {
  const nodes = buildNodes(60, 3);
  return (
    <svg viewBox="-4 -4 8 8" className="h-full w-full">
      {nodes.map((n, i) => {
        const hit = matchesQuery(n, query);
        return (
          <g key={i}>
            {hit && <line x1="0" y1="0" x2={n.position[0]} y2={n.position[1]} stroke="var(--ai)" strokeWidth="0.02" />}
            <circle
              cx={n.position[0]}
              cy={n.position[1]}
              r={hit ? 0.14 : 0.08}
              fill={n.community ? "var(--community)" : "var(--market)"}
              opacity={0.85}
            >
              <animate attributeName="opacity" values=".5;.95;.5" dur={`${3 + (i % 5)}s`} repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}
    </svg>
  );
}

export function ConstellationScene({ query, onMatches }: { query: string; onMatches: (n: number) => void }) {
  const [mode, setMode] = useState<"pending" | "3d" | "2d">("pending");
  useEffect(() => setMode(canUse3D() ? "3d" : "2d"), []);
  useEffect(() => {
    if (mode === "2d") onMatches(buildNodes(90, 3).filter((n) => matchesQuery(n, query)).length);
  }, [mode, query, onMatches]);

  if (mode === "pending") return <div className="h-full w-full" />;
  if (mode === "2d") return <Fallback2D query={query} />;
  return (
    <Suspense fallback={<Fallback2D query={query} />}>
      <Constellation query={query} onMatches={onMatches} />
    </Suspense>
  );
}
