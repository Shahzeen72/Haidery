import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/talent", label: "Find talent" },
  { to: "/opportunities", label: "Opportunities" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-glass backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="Haidery home" className="py-2"><Logo className="h-10 w-auto sm:h-11" /></Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-[12px] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "bg-primary-tint text-primary" }}
              activeOptions={{ exact: true }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Link to="/dashboard" className="rounded-[12px] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">My projects</Link>
      </div>
    </header>
  );
}

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border bg-glass backdrop-blur-xl md:hidden">
      {NAV.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          className="flex h-14 items-center justify-center text-xs font-semibold text-muted-foreground"
          activeProps={{ className: "text-primary" }}
          activeOptions={{ exact: true }}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}
