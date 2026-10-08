import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, BrainCircuit, Calculator, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Panel, PageHeader, RiskGauge, Tag, chartTooltipStyle, riskTone } from "@/components/common";
import { ConditionInput, TIPS } from "@/components/ConditionInput";
import { Button } from "@/components/ui/button";
import { DEFAULT_CONDITIONS, calculateRisk } from "@/lib/ai/risk";
import type { OperatingConditions, RiskPrediction } from "@/types";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "Predictive Risk Analysis — AutoSentinel AI" },
      { name: "description", content: "Estimate component failure risk from machine operating conditions with the prototype risk model." },
      { property: "og:title", content: "Predictive Risk Analysis — AutoSentinel AI" },
      { property: "og:description", content: "Combine machine conditions and inspections to estimate failure risk." },
    ],
  }),
  component: RiskPage,
});

const PRESET_HIGH: OperatingConditions = { temperature: 102, vibration: 7.4, pressure: 5.8, rpm: 1620, load: 67, componentAge: 18 };

function RiskPage() {
  const [c, setC] = useState<OperatingConditions>(DEFAULT_CONDITIONS);
  const [pred, setPred] = useState<RiskPrediction>(() => calculateRisk(DEFAULT_CONDITIONS));
  const [loading, setLoading] = useState(false);
  const set = (k: keyof OperatingConditions) => (v: number) => setC((p) => ({ ...p, [k]: v }));

  async function run(cond = c) {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 650));
    const p = calculateRisk(cond);
    setPred(p);
    setLoading(false);
    toast.success(`Risk calculated: ${(p.risk * 100).toFixed(1)}% (${p.level})`);
  }

  const breakdown = [
    { name: "Temperature", v: pred.contributors.temperature },
    { name: "Vibration", v: pred.contributors.vibration },
    { name: "Pressure", v: pred.contributors.pressure },
    { name: "RPM", v: pred.contributors.rpm },
    { name: "Load", v: pred.contributors.load },
    { name: "Comp. age", v: pred.contributors.age },
  ].map((d) => ({ ...d, pts: +(d.v * 100).toFixed(1) }));
  const maxPts = Math.max(...breakdown.map((b) => b.pts));

  return (
    <>
      <PageHeader
        tag="Prototype risk model"
        title="Predictive Risk Analysis"
        subtitle="AutoSentinel AI combines machine operating conditions and inspection results to estimate the probability of component failure or quality defects."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <Panel title="Operating conditions" icon={<BrainCircuit className="h-4 w-4 text-info" />}
          right={
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setC(DEFAULT_CONDITIONS)}><RotateCcw className="h-3.5 w-3.5" />Line A now</Button>
              <Button size="sm" variant="ghost" onClick={() => setC(PRESET_HIGH)}>Load high-risk case</Button>
            </div>
          }
        >
          <div className="flex flex-col gap-5">
            <ConditionInput k="temperature" label="Temperature" value={c.temperature} onChange={set("temperature")} tip={TIPS.temperature} />
            <ConditionInput k="vibration" label="Vibration" value={c.vibration} onChange={set("vibration")} tip={TIPS.vibration} />
            <ConditionInput k="pressure" label="Pressure" value={c.pressure} onChange={set("pressure")} tip={TIPS.pressure} />
            <ConditionInput k="rpm" label="RPM" value={c.rpm} onChange={set("rpm")} tip={TIPS.rpm} />
            <ConditionInput k="load" label="Machine Load" value={c.load} onChange={set("load")} tip={TIPS.load} />
            <ConditionInput k="componentAge" label="Component Age" value={c.componentAge} onChange={set("componentAge")} tip={TIPS.componentAge} />
            <Button size="lg" className="ember glow" onClick={() => run()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}Calculate Risk
            </Button>
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel title="Risk estimate" right={<Tag tone="warn">Prototype AI</Tag>}>
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <RiskGauge value={pred.risk} size={180} label="Current Risk" />
              <div className="flex-1">
                <div className="label-xs">Risk level</div>
                <div className="mt-1"><Tag tone={riskTone(pred.level) as "safe"} className="!px-3 !py-1 !text-base">{pred.level}</Tag></div>
                <div className="label-xs mt-4">Primary contributor</div>
                <div className="mt-1 text-lg font-medium">{breakdown.find((b) => b.pts === maxPts)?.name}</div>
                <p className="mt-2 text-xs text-muted-foreground">Formula: baseline {(pred.baseline * 100).toFixed(1)} pts + weighted deviation of each condition from its learned nominal range.</p>
              </div>
            </div>
          </Panel>

          <Panel title="Risk breakdown" right={<span className="label-xs">percentage points</span>}>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={84} />
                  <Tooltip {...chartTooltipStyle} cursor={{ fill: "var(--accent)" }} formatter={(v: number) => [`${v} pts`, "Contribution"]} />
                  <Bar dataKey="pts" radius={[0, 4, 4, 0]} animationDuration={600}>
                    {breakdown.map((b) => <Cell key={b.name} fill={b.pts === maxPts && b.pts > 0 ? "var(--primary)" : "var(--info)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="AI Recommendation" icon={<Sparkles className="h-4 w-4 text-primary" />}>
            <p className="text-sm leading-relaxed">{pred.recommendation}</p>
            {pred.level !== "low" && (
              <Button asChild variant="secondary" className="mt-3">
                <Link to="/simulator">Test corrective actions in What-If Simulator <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
