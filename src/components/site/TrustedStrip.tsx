import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { trustedQuery } from "@/lib/talent-data";
import { DemoBadge } from "@/components/site/ui-bits";

export function TrustedStrip() {
  const { data = [] } = useQuery(trustedQuery);
  if (!data.length) return null;
  return (
    <section className="mt-12">
      <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-primary"><ShieldCheck className="h-5 w-5 text-market" />Trusted by</h2>
      <p className="text-sm">Organisations approved by the Haidery team.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {data.map((o) => (
          <div key={o.id} className="glass flex items-center gap-2 px-4 py-3">
            <span className="font-semibold text-foreground">{o.name.replace(" (demo)", "")}</span>
            <span className="text-xs text-hint">{o.kind} · {o.city}</span>
            {o.is_demo && <DemoBadge />}
          </div>
        ))}
      </div>
    </section>
  );
}
