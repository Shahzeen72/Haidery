import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Haidery" },
      { name: "description", content: "Sign in or join Haidery, the private community-first opportunity network." },
      { property: "og:title", content: "Sign in — Haidery" },
      { property: "og:description", content: "Sign in or join Haidery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav({ to: "/dashboard" }); });
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) nav({ to: "/dashboard" }); });
    return () => data.subscription.unsubscribe();
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    if (mode === "up") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name } } });
      if (error) setMsg(error.message);
      else if (!data.session) setMsg("Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
    }
    setBusy(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) setMsg(r.error.message ?? "Google sign-in failed");
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="glass p-8">
        <Logo className="mx-auto mb-6 h-14 w-auto" />
        <h1 className="text-center font-display text-2xl font-bold text-primary">{mode === "in" ? "Welcome back" : "Join Haidery"}</h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "up" && <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded-[12px] border border-border bg-card px-3 py-2.5 text-sm" />}
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-[12px] border border-border bg-card px-3 py-2.5 text-sm" />
          <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-[12px] border border-border bg-card px-3 py-2.5 text-sm" />
          <button disabled={busy} className="w-full rounded-[12px] bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">{mode === "in" ? "Sign in" : "Create account"}</button>
        </form>
        <button onClick={google} className="mt-3 w-full rounded-[12px] border border-border bg-card py-2.5 text-sm font-semibold text-foreground hover:bg-primary-tint">Continue with Google</button>
        {msg && <p className="mt-3 text-center text-sm text-muted-foreground">{msg}</p>}
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 w-full text-center text-sm text-link hover:underline">
          {mode === "in" ? "New here? Create an account" : "Already a member? Sign in"}
        </button>
      </div>
    </div>
  );
}
