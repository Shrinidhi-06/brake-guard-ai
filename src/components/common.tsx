import { useEffect, useRef, useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { RiskLevel, Severity } from "@/types";

export function PageHeader({ title, subtitle, tag, right }: { title: string; subtitle?: string; tag?: string; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between animate-rise">
      <div>
        {tag && <div className="label-xs mb-2 text-primary">{tag}</div>}
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Panel({ className, children, title, icon, right }: { className?: string | undefined; children: ReactNode; title?: string; icon?: ReactNode; right?: ReactNode }) {
  return (
    <section className={cn("panel p-5 animate-rise", className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-medium tracking-wide">
            {icon}
            {title}
          </h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Tag({ children, tone = "muted", className }: { children: ReactNode; tone?: "muted" | "safe" | "warn" | "danger" | "info" | "primary"; className?: string }) {
  const tones = {
    muted: "border-border bg-muted text-muted-foreground",
    safe: "border-safe/30 bg-safe/10 text-safe",
    warn: "border-warn/30 bg-warn/10 text-warn",
    danger: "border-danger/30 bg-danger/10 text-danger",
    info: "border-info/30 bg-info/10 text-info",
    primary: "border-primary/30 bg-primary/10 text-primary",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider", tones[tone], className)}>{children}</span>;
}

export const riskTone = (l: RiskLevel | Severity) =>
  l === "low" ? "safe" : l === "medium" ? "warn" : l === "none" ? "muted" : "danger";

export const riskColorVar = (r: number) => (r >= 0.6 ? "var(--danger)" : r >= 0.3 ? "var(--warn)" : "var(--safe)");

export function SeverityTag({ s }: { s: Severity }) {
  if (s === "none") return <span className="text-muted-foreground">—</span>;
  return <Tag tone={riskTone(s) as "safe"}>{s}</Tag>;
}

export function Term({ children, tip }: { children: ReactNode; tip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help items-center gap-1 underline decoration-dotted decoration-muted-foreground/50 underline-offset-4">
          {children}
          <Info className="h-3 w-3 text-muted-foreground" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{tip}</TooltipContent>
    </Tooltip>
  );
}

export function useAnimatedNumber(target: number, duration = 700) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setV(a + (target - a) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      from.current = target;
    };
  }, [target, duration]);
  return v;
}

export function AnimatedNumber({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number | undefined; suffix?: string | undefined }) {
  const v = useAnimatedNumber(value);
  return (
    <span className="num">
      {v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

/** Circular risk gauge (270° arc). value: 0..1 */
export function RiskGauge({ value, size = 200, label = "Risk" }: { value: number; size?: number; label?: string }) {
  const v = useAnimatedNumber(value);
  const r = 80;
  const c = 2 * Math.PI * r;
  const arc = c * 0.75;
  const color = riskColorVar(value);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-[225deg]">
        <circle cx="100" cy="100" r={r} fill="none" stroke="var(--muted)" strokeWidth="12" strokeDasharray={`${arc} ${c}`} strokeLinecap="round" />
        <circle
          cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${arc * v} ${c}`}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
        {Array.from({ length: 28 }).map((_, i) => {
          const a = (i / 27) * 270 * (Math.PI / 180);
          return <line key={i} x1={100 + 64 * Math.cos(a)} y1={100 + 64 * Math.sin(a)} x2={100 + 68 * Math.cos(a)} y2={100 + 68 * Math.sin(a)} stroke="var(--border)" strokeWidth="1.5" />;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="num font-semibold leading-none" style={{ fontSize: size * 0.2, color }}>
          {(v * 100).toFixed(1)}
          <span style={{ fontSize: size * 0.09 }}>%</span>
        </div>
        <div className="label-xs mt-2">{label}</div>
      </div>
    </div>
  );
}

/** Horizontal segmented risk meter */
export function RiskMeter({ value }: { value: number }) {
  const v = useAnimatedNumber(value);
  return (
    <div>
      <div className="relative h-3 overflow-hidden rounded-full bg-muted">
        <div className="absolute inset-y-0 left-0 rounded-full transition-colors" style={{ width: `${v * 100}%`, background: `linear-gradient(90deg, var(--safe), var(--warn) 50%, var(--danger))`, backgroundSize: `${100 / Math.max(v, 0.01)}% 100%` }} />
        {[30, 60, 80].map((m) => (
          <div key={m} className="absolute inset-y-0 w-px bg-background" style={{ left: `${m}%` }} />
        ))}
      </div>
      <div className="label-xs mt-1.5 flex justify-between">
        <span>Low</span><span>Medium</span><span>High</span><span>Critical</span>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <div className="font-medium">{title}</div>
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export const chartTooltipStyle = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "var(--muted-foreground)" },
  itemStyle: { color: "var(--foreground)" },
};

export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
export const fmtDate = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
