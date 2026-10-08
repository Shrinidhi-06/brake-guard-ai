import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Activity, AlertTriangle, Gauge, Pause, Play, Thermometer, Waves, Weight } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { AnimatedNumber, Panel, PageHeader, Tag, Term, chartTooltipStyle } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateRisk } from "@/lib/ai/risk";
import { MACHINES, rng } from "@/lib/mock/data";
import { loadSettings } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/monitoring")({
  head: () => ({
    meta: [
      { title: "Live Monitoring — AutoSentinel AI" },
      { name: "description", content: "Live (simulated) sensor monitoring for brake disc production lines." },
      { property: "og:title", content: "Live Monitoring — AutoSentinel AI" },
      { property: "og:description", content: "Real-time-style temperature, vibration and machine risk monitoring." },
    ],
  }),
  component: MonitoringPage,
});

interface Pt { t: string; temperature: number; vibration: number; pressure: number; rpm: number; load: number; risk: number }

function makePoint(r: () => number, tick: number, anomaly: number): Pt {
  const a = anomaly > 0 ? Math.min(1, anomaly / 4) : 0;
  const temperature = +(81 + r() * 3 + a * 9).toFixed(1);
  const vibration = +(2.5 + r() * 0.6 + a * 3.6).toFixed(2);
  const pressure = +(5.1 + r() * 0.25).toFixed(2);
  const rpm = Math.round(1405 + r() * 30 + a * 60);
  const load = Math.round(64 + r() * 6);
  const risk = calculateRisk({ temperature, vibration, pressure, rpm, load, componentAge: 18 }).risk * 100;
  const d = new Date(Date.UTC(2026, 9, 8, 11, 0, 0) + tick * 1000);
  return { t: d.toISOString().slice(14, 19), temperature, vibration, pressure, rpm, load, risk: +risk.toFixed(1) };
}

const VIB_LIMIT = 4.5;

function MonitoringPage() {
  const [machine, setMachine] = useState("line-a");
  const [running, setRunning] = useState(true);
  const rRef = useRef(rng(99));
  const tickRef = useRef(0);
  const anomalyRef = useRef(0);
  const [data, setData] = useState<Pt[]>(() => {
    const r = rng(5);
    return Array.from({ length: 30 }, (_, i) => makePoint(r, i, 0));
  });
  tickRef.current = tickRef.current || 30;

  useEffect(() => {
    if (!running) return;
    const interval = Number(loadSettings().interval) || 1000;
    const id = setInterval(() => {
      const r = rRef.current;
      tickRef.current += 1;
      if (anomalyRef.current > 0) anomalyRef.current = anomalyRef.current > 10 ? 0 : anomalyRef.current + 1;
      else if (r() < 0.06) anomalyRef.current = 1;
      const a = anomalyRef.current;
      const ramp = a === 0 ? 0 : a <= 4 ? a : Math.max(0, 10 - a);
      setData((d) => [...d.slice(-39), makePoint(r, tickRef.current, ramp)]);
    }, interval);
    return () => clearInterval(id);
  }, [running, machine]);

  const last = data[data.length - 1] ?? data[0]!;
  const status: "normal" | "warning" | "critical" = last.vibration > 6 || last.risk > 60 ? "critical" : last.vibration > VIB_LIMIT || last.risk > 30 ? "warning" : "normal";
  const prev = useRef(status);
  useEffect(() => {
    if (status !== "normal" && prev.current === "normal" && loadSettings().highRiskAlerts) toast.warning("Vibration anomaly detected", { description: "Vibration is above the learned normal operating range." });
    prev.current = status;
  }, [status]);

  function inject() {
    anomalyRef.current = 1;
    setRunning(true);
    toast.info("Simulated anomaly injected");
  }

  const sensors = [
    { k: "temperature", l: "Temperature", u: "°C", i: Thermometer, d: 1, warn: last.temperature > 88 },
    { k: "vibration", l: "Vibration", u: "mm/s", i: Waves, d: 2, warn: last.vibration > VIB_LIMIT, tip: "RMS vibration velocity measured at the spindle housing." },
    { k: "pressure", l: "Pressure", u: "bar", i: Gauge, d: 2, warn: false },
    { k: "rpm", l: "RPM", u: "", i: Activity, d: 0, warn: last.rpm > 1480, tip: "Spindle revolutions per minute." },
    { k: "load", l: "Load", u: "%", i: Weight, d: 0, warn: false },
  ] as const;

  const statusStyles = { normal: "border-safe/40 bg-safe/10 text-safe", warning: "border-warn/40 bg-warn/10 text-warn", critical: "border-danger/40 bg-danger/10 text-danger" };

  return (
    <>
      <PageHeader
        tag="Simulated sensor data"
        title="Live Monitoring"
        subtitle="Streaming machine telemetry with learned normal operating ranges."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={machine} onValueChange={setMachine}>
              <SelectTrigger className="h-9 w-[250px]"><SelectValue /></SelectTrigger>
              <SelectContent>{MACHINES.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="secondary" size="sm" onClick={() => setRunning((v) => !v)}>{running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{running ? "Pause" : "Resume"}</Button>
            <Button variant="outline" size="sm" onClick={inject}><AlertTriangle className="h-4 w-4" />Inject anomaly</Button>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-[auto_1fr]">
        <div className={cn("flex items-center gap-3 rounded-xl border px-5 py-3", statusStyles[status])}>
          <span className={cn("h-3 w-3 rounded-full animate-pulse-dot", status === "normal" ? "bg-safe" : status === "warning" ? "bg-warn" : "bg-danger")} />
          <div>
            <div className="label-xs">Machine status</div>
            <div className="font-mono text-xl font-bold">{status.toUpperCase()}</div>
          </div>
        </div>
        {status !== "normal" ? (
          <div className="flex items-center gap-3 rounded-xl border border-danger/40 bg-danger/10 px-5 py-3 animate-rise">
            <AlertTriangle className="h-6 w-6 shrink-0 text-danger" />
            <div>
              <div className="font-semibold text-danger">⚠ Vibration anomaly detected</div>
              <div className="text-sm text-muted-foreground">Vibration is above the learned normal operating range.</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card/50 px-5 py-3 text-sm text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", running ? "bg-safe animate-pulse-dot" : "bg-muted-foreground")} />
            {running ? "All sensors within learned operating range. Streaming…" : "Stream paused."}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {sensors.map((s) => (
          <div key={s.k} className={cn("panel p-4 transition-colors", s.warn && "!border-danger/50")}>
            <div className="flex items-center justify-between">
              <span className="label-xs">{"tip" in s ? <Term tip={s.tip}>{s.l}</Term> : s.l}</span>
              <s.i className={cn("h-4 w-4", s.warn ? "text-danger" : "text-muted-foreground")} />
            </div>
            <div className={cn("mt-2 text-2xl font-semibold", s.warn && "text-danger")}>
              <AnimatedNumber value={last[s.k]} decimals={s.d} />
              <span className="ml-1 text-xs text-muted-foreground">{s.u}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Temperature over time" data={data} k="temperature" color="var(--chart-4)" unit="°C" domain={[70, 100]} />
        <ChartPanel title="Vibration over time" data={data} k="vibration" color="var(--info)" unit="mm/s" domain={[0, 8]} limit={VIB_LIMIT} />
        <ChartPanel className="lg:col-span-2" title="Machine risk over time" data={data} k="risk" color="var(--primary)" unit="%" domain={[0, 100]} limit={30} />
      </div>
    </>
  );
}

function ChartPanel({ title, data, k, color, unit, domain, limit, className }: { title: string; data: Pt[]; k: keyof Pt; color: string; unit: string; domain: [number, number]; limit?: number; className?: string | undefined }) {
  return (
    <Panel title={title} className={className} right={<Tag tone="info">Live · simulated</Tag>}>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -18, right: 6, top: 4 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} />
            <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} domain={domain} />
            <Tooltip {...chartTooltipStyle} formatter={(v: number) => [`${v} ${unit}`, title.split(" ")[0]]} />
            {limit !== undefined && <ReferenceLine y={limit} stroke="var(--danger)" strokeDasharray="4 4" label={{ value: "limit", fill: "var(--danger)", fontSize: 10, position: "right" }} />}
            <Line type="monotone" dataKey={k} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
