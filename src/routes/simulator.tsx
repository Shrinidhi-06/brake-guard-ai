import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDown, ArrowRight, FlaskConical, Loader2, Play, RotateCcw, Sparkles, TrendingDown, Wand2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { AnimatedNumber, Panel, PageHeader, RiskGauge, Tag, riskColorVar } from "@/components/common";
import { ConditionInput, TIPS } from "@/components/ConditionInput";
import { Button } from "@/components/ui/button";
import { riskLevel } from "@/lib/ai/risk";
import { SIM_CURRENT, simulate } from "@/lib/ai/simulation";
import { calculateRisk } from "@/lib/ai/risk";
import { cn } from "@/lib/utils";
import type { OperatingConditions, SimulationResult } from "@/types";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "What-If Safety Simulator — AutoSentinel AI" },
      { name: "description", content: "Test corrective actions before changing the real machine with the prototype predictive simulation." },
      { property: "og:title", content: "What-If Safety Simulator — AutoSentinel AI" },
      { property: "og:description", content: "Test corrective actions before changing the real machine." },
    ],
  }),
  component: SimulatorPage,
});

function SimulatorPage() {
  const [sim, setSim] = useState<OperatingConditions>(SIM_CURRENT);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const currentRisk = calculateRisk(SIM_CURRENT).risk;
  const set = (k: keyof OperatingConditions) => (v: number) => setSim((p) => ({ ...p, [k]: v }));
  const dirty = (Object.keys(SIM_CURRENT) as (keyof OperatingConditions)[]).some((k) => SIM_CURRENT[k] !== sim[k]);

  async function run() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    const r = simulate(SIM_CURRENT, sim);
    setResult(r);
    setLoading(false);
    const pts = Math.round(r.riskReduction * 100);
    if (pts > 0) toast.success(`Simulated risk ${Math.round(r.simulatedRisk * 100)}% — ${pts} points lower`);
    else if (pts < 0) toast.error(`Simulated risk increases by ${Math.abs(pts)} points`);
    else toast.info("No change in predicted risk");
  }

  const chart = [
    { name: "Current", v: Math.round(currentRisk * 100) },
    { name: "Simulated", v: result ? Math.round(result.simulatedRisk * 100) : 0 },
  ];
  const pts = result ? Math.round(result.riskReduction * 100) : 0;

  const diffRow = (label: string, k: keyof OperatingConditions, unit: string) => (
    <div key={k} className="flex items-center justify-between border-b border-border py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="num text-lg font-semibold">{SIM_CURRENT[k].toLocaleString()} <span className="text-xs text-muted-foreground">{unit}</span></span>
    </div>
  );

  return (
    <>
      <PageHeader
        tag="Hero feature"
        title="What-If Safety Simulator"
        subtitle="Test corrective actions before changing the real machine."
        right={<Tag tone="warn" className="!text-xs">Prototype predictive simulation</Tag>}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_auto_1.25fr]">
        {/* CURRENT */}
        <Panel className="border-danger/30" title="Current Conditions" icon={<span className="h-2 w-2 rounded-full bg-danger animate-pulse-dot" />} right={<Tag tone="danger">Live · Line A</Tag>}>
          {diffRow("Temperature", "temperature", "°C")}
          {diffRow("Vibration", "vibration", "mm/s")}
          {diffRow("Pressure", "pressure", "bar")}
          {diffRow("RPM", "rpm", "")}
          <div className="mt-5 flex flex-col items-center">
            <RiskGauge value={currentRisk} size={170} label="Current Risk" />
            <Tag tone="danger" className="mt-2">{riskLevel(currentRisk)} risk</Tag>
          </div>
        </Panel>

        <div className="flex items-center justify-center">
          <div className="ember glow flex h-12 w-12 items-center justify-center rounded-full">
            <ArrowRight className="hidden h-6 w-6 xl:block" />
            <ArrowDown className="h-6 w-6 xl:hidden" />
          </div>
        </div>

        {/* SIMULATED */}
        <Panel className="border-primary/30 glow" title="Simulated Conditions" icon={<FlaskConical className="h-4 w-4 text-primary" />}
          right={
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setSim({ ...SIM_CURRENT, temperature: 85, vibration: 3.0 })}><Wand2 className="h-3.5 w-3.5" />AI suggestion</Button>
              <Button size="sm" variant="ghost" onClick={() => { setSim(SIM_CURRENT); setResult(null); }} disabled={!dirty && !result}><RotateCcw className="h-3.5 w-3.5" />Reset</Button>
            </div>
          }
        >
          <div className="flex flex-col gap-5">
            <ConditionInput k="temperature" label="Temperature" value={sim.temperature} onChange={set("temperature")} tip={TIPS.temperature} hint={`now ${SIM_CURRENT.temperature}`} />
            <ConditionInput k="vibration" label="Vibration" value={sim.vibration} onChange={set("vibration")} tip={TIPS.vibration} hint={`now ${SIM_CURRENT.vibration}`} />
            <ConditionInput k="pressure" label="Pressure" value={sim.pressure} onChange={set("pressure")} tip={TIPS.pressure} hint={`now ${SIM_CURRENT.pressure}`} />
            <ConditionInput k="rpm" label="RPM" value={sim.rpm} onChange={set("rpm")} tip={TIPS.rpm} hint={`now ${SIM_CURRENT.rpm}`} />
            <Button size="lg" className="ember glow h-12 text-base" onClick={run} disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}{loading ? "Simulating..." : "Run Simulation"}
            </Button>
          </div>
        </Panel>
      </div>

      {/* RESULTS */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Panel title="Before / after risk" icon={<TrendingDown className="h-4 w-4 text-safe" />} right={<Tag tone="warn">Prototype predictive simulation</Tag>}>
          <div className="grid gap-4 sm:grid-cols-3">
            <BigNum label="Current Risk" value={currentRisk * 100} color={riskColorVar(currentRisk)} />
            <BigNum label="Simulated Risk" value={result ? result.simulatedRisk * 100 : null} color={result ? riskColorVar(result.simulatedRisk) : undefined} />
            <div className={cn("rounded-xl border p-4", pts > 0 ? "border-safe/40 bg-safe/10" : "border-border bg-background/40")}>
              <div className="label-xs">Risk Reduction</div>
              <div className={cn("num mt-1 text-4xl font-bold", pts > 0 ? "text-safe" : pts < 0 ? "text-danger" : "text-muted-foreground")}>
                {result ? <><AnimatedNumber value={pts} /><span className="text-base"> pts</span></> : "—"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{result ? `Risk Reduction: ${pts} percentage points` : "Run a simulation"}</div>
            </div>
          </div>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 24, left: -18, right: 8 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                <Bar dataKey="v" radius={[6, 6, 0, 0]} maxBarSize={120} animationDuration={900} key={result ? result.simulatedRisk : "none"}>
                  <Cell fill={riskColorVar(currentRisk)} />
                  <Cell fill={result ? riskColorVar(result.simulatedRisk) : "var(--muted)"} />
                  <LabelList dataKey="v" position="top" formatter={(v: number) => (v ? `${v}%` : "")} fill="var(--foreground)" fontSize={14} fontFamily="JetBrains Mono" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="AI Recommendation" icon={<Sparkles className="h-4 w-4 text-primary" />}>
          {result ? (
            <div className="flex flex-col gap-4 animate-rise">
              <p className="text-sm leading-relaxed">{result.recommendation}</p>
              <div className="rounded-lg border border-border bg-background/40 p-4">
                <div className="label-xs">Expected result</div>
                <div className={cn("mt-1 font-mono text-lg font-bold", result.reductionLevel === "high" ? "text-safe" : result.reductionLevel === "medium" ? "text-info" : result.reductionLevel === "low" ? "text-warn" : "text-muted-foreground")}>
                  Predicted risk reduction: {result.reductionLevel.toUpperCase()}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(["temperature", "vibration", "pressure", "rpm"] as const).map((k) => (
                  <div key={k} className="rounded border border-border p-2">
                    <div className="label-xs">{k}</div>
                    <div className="num">{SIM_CURRENT[k]} → <span className={sim[k] < SIM_CURRENT[k] ? "text-safe" : sim[k] > SIM_CURRENT[k] ? "text-danger" : ""}>{sim[k]}</span></div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">Prototype predictive simulation using a transparent weighted formula. Not a scientifically validated prediction — verify on the machine before acting.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <p>Adjust the simulated sliders, then press <span className="text-foreground">Run Simulation</span> to see the predicted risk.</p>
              <p>Suggested starting point: <span className="text-foreground">Temperature → 85°C</span>, <span className="text-foreground">Vibration → 3.0 mm/s</span>.</p>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function BigNum({ label, value, color }: { label: string; value: number | null; color?: string | undefined }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="label-xs">{label}</div>
      <div className="num mt-1 text-4xl font-bold" style={color ? { color } : undefined}>
        {value === null ? <span className="text-muted-foreground">—</span> : <AnimatedNumber value={Math.round(value)} suffix="%" />}
      </div>
    </div>
  );
}
