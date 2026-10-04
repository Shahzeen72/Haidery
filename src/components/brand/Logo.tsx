export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M8 32 L18 20 L26 24 L33 9" fill="none" stroke="var(--border)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M8 32 L18 20" stroke="var(--community)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18 20 L26 24" stroke="var(--ai)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 24 L33 9" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="8" cy="32" r="4" fill="var(--community)" />
      <circle cx="18" cy="20" r="3.5" fill="var(--ai)" />
      <circle cx="26" cy="24" r="3" fill="var(--ai)" opacity=".7" />
      <circle cx="33" cy="9" r="4.5" fill="var(--primary)" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-lg font-extrabold tracking-tight text-foreground">Trusted Network</span>
    </div>
  );
}
