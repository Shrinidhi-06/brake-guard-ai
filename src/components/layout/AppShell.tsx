import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Activity, BarChart3, Bell, BrainCircuit, FlaskConical, History, LayoutDashboard, Menu, ScanSearch, Settings, ShieldCheck,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SEED_ALERTS } from "@/lib/mock/data";
import { Tag, fmtTime } from "@/components/common";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inspect", label: "Inspect Component", icon: ScanSearch },
  { to: "/monitoring", label: "Live Monitoring", icon: Activity },
  { to: "/risk", label: "AI Risk Analysis", icon: BrainCircuit },
  { to: "/simulator", label: "What-If Simulator", icon: FlaskConical, hero: true },
  { to: "/history", label: "Inspection History", icon: History },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "System Settings", icon: Settings },
] as const;

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <div className="ember glow flex h-9 w-9 items-center justify-center rounded-lg">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">AutoSentinel <span className="text-primary">AI</span></div>
        <div className="label-xs !text-[9px]">AI Inspection System</div>
      </div>
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => {
        const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
              active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />}
            <n.icon className={cn("h-4 w-4", active && "text-primary")} />
            <span className="flex-1">{n.label}</span>
            {"hero" in n && <Tag tone="primary" className="!px-1.5 !text-[9px]">Hero</Tag>}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-1 pt-1"><Logo /></div>
      <div className="label-xs px-3">Operations</div>
      <NavList onNavigate={onNavigate} />
      <div className="mt-auto rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3 text-xs">
        <div className="mb-1 flex items-center gap-2 font-medium"><span className="h-2 w-2 rounded-full bg-warn animate-pulse-dot" />Demo Mode</div>
        <p className="text-muted-foreground">Prototype AI engine with simulated sensor data and a demo dataset. Not a certified inspection system.</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen w-full">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-sidebar-border bg-sidebar/95 backdrop-blur lg:block">
        <SidebarBody />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <button aria-label="Open navigation" onClick={() => setOpen(true)} className="rounded-md p-2 hover:bg-accent lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden"><Logo /></div>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
            <span className="font-medium text-foreground">AutoSentinel AI</span>
            <span>/</span>
            <span>AI Inspection System</span>
          </div>
          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <Tag tone="warn" className="hidden sm:inline-flex">Demo Mode</Tag>
            <div className="hidden items-center gap-2 rounded-md border border-safe/30 bg-safe/10 px-2.5 py-1 text-xs text-safe md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-safe animate-pulse-dot" />
              AI Engine Online
            </div>
            <span className="h-2 w-2 rounded-full bg-safe animate-pulse-dot md:hidden" aria-label="AI Engine Online" />
            <Popover>
              <PopoverTrigger asChild>
                <button aria-label="Notifications" className="relative rounded-md p-2 hover:bg-accent">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="border-b border-border px-4 py-3 text-sm font-medium">Alerts</div>
                {SEED_ALERTS.map((a) => (
                  <div key={a.id} className="flex gap-3 border-b border-border px-4 py-3 last:border-0">
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", a.level === "critical" ? "bg-danger" : a.level === "warning" ? "bg-warn" : "bg-info")} />
                    <div className="text-xs">
                      <div className="font-medium text-foreground">{a.title}</div>
                      <div className="text-muted-foreground">{a.description}</div>
                      <div className="num mt-1 text-muted-foreground">{fmtTime(a.timestamp)} UTC</div>
                    </div>
                  </div>
                ))}
              </PopoverContent>
            </Popover>
            <div className="flex items-center gap-2 border-l border-border pl-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold">RS</div>
              <div className="hidden text-xs leading-tight md:block">
                <div className="font-medium">R. Sharma</div>
                <div className="text-muted-foreground">QC Operator · Shift B</div>
              </div>
            </div>
          </div>
        </header>
        <main key={path} className="mx-auto w-full max-w-[1400px] flex-1 p-4 md:p-6 animate-rise">{children}</main>
      </div>
    </div>
  );
}
