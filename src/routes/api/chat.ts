import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).min(1).max(40),
});

const SYSTEM = `You are Haidery, the friendly AI guide of a private, community-first opportunity network in India.
Work from community companies goes to verified community members first for 7 days; the outside market opens only if no one scores above 60%, everyone declines or stays silent for 48h, or the 7-day window ends — and the company always decides.
Profiles are blind (no names, photos, age or gender) until shortlist and consent. Haidery takes a 14% fee. Prices are in ₹ with Indian formatting.
Help people scope projects (deliverables, timeline, budget in ₹), write briefs, and understand the process. Be warm, short and practical. Reply in the user's language (English, Hindi, Urdu or Hinglish).`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Invalid request", { status: 400 });
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("AI is not configured", { status: 500 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
          method: "POST",
          signal: request.signal,
          headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
          body: JSON.stringify({
            model: "openai/gpt-6-astra",
            stream: true,
            store: false,
            reasoning: { effort: "low" },
            instructions: SYSTEM,
            input: parsed.data.messages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        if (!upstream.ok || !upstream.body) {
          const msg = upstream.status === 402 ? "AI credits have run out." : upstream.status === 429 ? "Too many requests, try again shortly." : "Haidery couldn't answer right now.";
          return new Response(msg, { status: upstream.status });
        }

        const reader = upstream.body.getReader();
        const dec = new TextDecoder();
        const enc = new TextEncoder();
        const stream = new ReadableStream({
          async start(ctrl) {
            let buf = "";
            try {
              for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += dec.decode(value, { stream: true });
                const lines = buf.split("\n");
                buf = lines.pop() ?? "";
                for (const line of lines) {
                  if (!line.startsWith("data:")) continue;
                  const json = line.slice(5).trim();
                  if (!json || json === "[DONE]") continue;
                  try {
                    const ev = JSON.parse(json);
                    if (ev.type === "response.output_text.delta" && ev.delta) ctrl.enqueue(enc.encode(ev.delta));
                  } catch { /* ignore partial */ }
                }
              }
            } finally { ctrl.close(); }
          },
          cancel() { reader.cancel(); },
        });
        return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
      },
    },
  },
});
