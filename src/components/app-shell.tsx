import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Upload,
  FileStack,
  ShieldAlert,
  Map as MapIcon,
  UserCheck,
  Landmark,
  GitCompareArrows,
  Menu,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload Document", icon: Upload },
  { to: "/records", label: "Land Records", icon: FileStack },
  { to: "/validation", label: "Validation", icon: ShieldAlert },
  { to: "/compare", label: "Compare Records", icon: GitCompareArrows },
  { to: "/gis", label: "GIS Map", icon: MapIcon },
  { to: "/verification", label: "Verification", icon: UserCheck },
] as const;

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-primary/20 bg-primary text-primary-foreground">
        <div className="flex h-16 items-center gap-3 px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/10 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Landmark className="h-7 w-7 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight">Land Record AI</p>
            <p className="truncate text-[11px] uppercase tracking-widest opacity-80">
              Intelligent Land Record Digitization &amp; Validation
            </p>
          </div>
          <div className="ml-auto hidden items-center gap-2 text-xs sm:flex">
            <span className="rounded-full bg-white/15 px-3 py-1">Prototype · Demo Data</span>
            <span className="rounded-full bg-white/15 px-3 py-1">Officer: Demo Officer</span>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={cn(
            "fixed inset-y-16 left-0 z-30 w-64 shrink-0 overflow-y-auto bg-sidebar p-3 text-sidebar-foreground transition-transform lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <nav className="space-y-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: to === "/" }}
                activeProps={{
                  className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
                }}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 rounded-md border border-sidebar-border/60 bg-sidebar-accent/40 p-3 text-[11px] leading-relaxed text-sidebar-foreground/80">
            All AI outputs are advisory. Flagged records are never auto-approved — a revenue
            officer makes the final decision.
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
