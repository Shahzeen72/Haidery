import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send, X } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";

type Msg = { role: "user" | "assistant"; content: string };

export function HaideryChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  useEffect(() => { if (open && !busy) inputRef.current?.focus(); }, [open, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs([...next, { role: "assistant", content: "" }]);
    setInput(""); setBusy(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader(); const dec = new TextDecoder(); let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs([...next, { role: "assistant", content: acc }]);
      }
      if (!acc) setMsgs([...next, { role: "assistant", content: "_No reply came back. Please try again._" }]);
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: `_${e instanceof Error && e.message ? e.message : "Something went wrong."}_` }]);
    } finally { setBusy(false); }
  }

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Ask Haidery" className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-ai bg-card shadow-lg md:bottom-6">
          <LogoMark className="h-8 w-auto" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-20 right-4 z-40 flex h-[min(560px,75vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-2xl md:bottom-6">
          <div className="flex items-center justify-between bg-ai-tint px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card"><LogoMark className="h-5 w-auto" /></span>
              <span className="font-display font-bold text-ai-text">Haidery</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat"><X className="h-5 w-5 text-muted-foreground" /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {msgs.length === 0 && <p className="text-muted-foreground">Hi, I'm Haidery. Tell me what you need done and I'll help you scope it — deliverables, timeline and a fair budget in ₹.</p>}
            {msgs.map((m, i) => m.role === "user" ? (
              <div key={i} className="ml-auto max-w-[85%] rounded-[14px] bg-primary px-3 py-2 text-primary-foreground">{m.content}</div>
            ) : (
              <div key={i} className="prose prose-sm max-w-none text-foreground">{m.content ? <ReactMarkdown>{m.content}</ReactMarkdown> : <span className="text-hint">Haidery is thinking…</span>}</div>
            ))}
            <div ref={endRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2 border-t border-border p-3">
            <textarea ref={inputRef} rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask Haidery…" className="max-h-28 flex-1 resize-none rounded-[12px] border border-border bg-background px-3 py-2 text-sm" />
            <button disabled={busy || !input.trim()} aria-label="Send" className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-primary text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" /></button>
          </form>
        </div>
      )}
    </>
  );
}
