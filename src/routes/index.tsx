import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, AlertTriangle, ArrowRight, BrainCircuit, CheckCircle2, Cpu, Gauge, Info, ScanSearch, Target, Thermometer, Waves } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AnimatedNumber, Panel, PageHeader, RiskGauge, SeverityTag, Tag, Term, chartTooltipStyle, fmtTime } from "@/components/common";
import { Button } from "@/components/ui/button";
import { AI_INSIGHTS, DASHBOARD_STATS, RISK_TREND_12H } from "@/lib/mock/data";
import { useInspections, useSavedCount } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quality Command Center — AutoSentinel AI" },
      { name: "description", content: "AI-powered brake component inspection and predictive risk monitoring dashboard." },
      { property: "og:title", content: "Quality Command Center — AutoSentinel AI" },
      { property: "og:description", content: "AI-powered brake component inspection and predictive risk monitoring." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const inspections = useInspections();
  const saved = useSavedCount();
  const newDefects = inspections.slice(0, saved).filter((i) => i.status === "defect").length;
  const newCritical = inspections.slice(0, saved).filter((i) => i.severity === "critical" || i.severity === "high").length;

  const stats = [
    { label: "Components Inspected", value: DASHBOARD_STATS.inspected + saved, icon: ScanSearch, tone: "text-info", decimals: 0 },
    { label: "Defects Detected", value: DASHBOARD_STATS.defects + newDefects, icon: AlertTriangle, tone: "text-warn", decimals: 0 },
    { label: "Detection Accuracy", value: DASHBOARD_STATS.accuracy, icon: Target, tone: "text-safe", decimals: 1, suffix: "%", note: "Demo dataset" },
    { label: "Critical Alerts", value: DASHBOARD_STATS.critical + newCritical, icon: AlertTriangle, tone: "text-danger", decimals: 0 },
  ];

  return (
    <>
      <PageHeader
        tag="Line A · Shift B"
        title="Automotive Quality Command Center"
        subtitle="AI-powered brake component inspection and predictive risk monitoring."
        right={
          <Button asChild className="ember glow">
            <Link to="/inspect"><ScanSearch className="h-4 w-4" />New Inspection</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="panel p-4 animate-rise">
            <div className="flex items-center justify-between">
              <span className="label-xs">{s.label}</span>
              <s.icon className={cn("h-4 w-4", s.tone)} />
            </div>
            <div className="mt-3 text-2xl font-semibold md:text-3xl">
              <AnimatedNumber value={s.value} decimals={s.decimals} suffix={s.suffix} />
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">{s.note ?? "Demo dataset · last 30 days"}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Current Production Status" icon={<Cpu className="h-4 w-4 text-primary" />} right={<Tag tone="info">Simulated sensor data</Tag>}>
          <div className="grid gap-6 md:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center gap-3">
              <RiskGauge value={0.184} size={190} label="Current Risk" />
              <Tag tone="safe" className="!text-xs">Low Risk</Tag>
            </div>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="label-xs">Machine</div>
                  <div className="mt-1 font-medium">Brake Disc Production Line A</div>
                </div>
                <div>
                  <div className="label-xs">Status</div>
                  <div className="mt-1 flex items-center gap-2 font-mono font-medium text-info">
                    <span className="h-2 w-2 rounded-full bg-info animate-pulse-dot" />MONITORING
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { l: "Temperature", v: "82", u: "°C", i: Thermometer },
                  { l: "Vibration", v: "2.8", u: "mm/s", i: Waves },
                  { l: "Pressure", v: "5.2", u: "bar", i: Gauge },
                  { l: "RPM", v: "1,420", u: "", i: Activity },
                ].map((m) => (
                  <div key={m.l} className="rounded-lg border border-border bg-background/40 p-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><m.i className="h-3.5 w-3.5" />{m.l}</div>
                    <div className="num mt-1 text-lg font-semibold">{m.v}<span className="ml-1 text-xs text-muted-foreground">{m.u}</span></div>
                  </div>
                ))}
              </div>
              <div>
                <div className="label-xs mb-2">Machine risk · last 12 hours</div>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={RISK_TREND_12H} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} unit="%" domain={[0, 40]} />
                      <Tooltip {...chartTooltipStyle} formatter={(v: number) => [`${v}%`, "Risk"]} />
                      <Area type="monotone" dataKey="risk" stroke="var(--primary)" strokeWidth={2} fill="url(#riskFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="AI Insights" icon={<BrainCircuit className="h-4 w-4 text-info" />} right={<Tag>Prototype AI</Tag>}>
          <ul className="flex flex-col gap-3">
            {AI_INSIGHTS.map((ins) => {
              const Icon = ins.tone === "warn" ? AlertTriangle : ins.tone === "safe" ? CheckCircle2 : Info;
              return (
                <li key={ins.text} className="flex gap-3 rounded-lg border border-border bg-background/40 p-3 text-sm">
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", ins.tone === "warn" ? "text-warn" : ins.tone === "safe" ? "text-safe" : "text-info")} />
                  {ins.text}
                </li>
              );
            })}
          </ul>
          <div className="mt-4 grid gap-2">
            <Button asChild variant="secondary" className="justify-between">
              <Link to="/risk"><Term tip="Combines live machine conditions into a single failure-risk estimate (prototype formula).">Open risk analysis</Term><ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="secondary" className="justify-between">
              <Link to="/simulator">Try What-If Simulator<ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </Panel>
      </div>

      <Panel className="mt-4" title="Recent Inspections" icon={<ScanSearch className="h-4 w-4 text-primary" />} right={<Link to="/history" className="text-xs text-primary hover:underline">View all →</Link>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="label-xs text-left">
                <th className="pb-2 font-normal">Component ID</th>
                <th className="pb-2 font-normal">Time</th>
                <th className="pb-2 font-normal">Result</th>
                <th className="pb-2 font-normal">Defect</th>
                <th className="pb-2 font-normal">Severity</th>
                <th className="pb-2 text-right font-normal">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {inspections.slice(0, 6).map((i, idx) => (
                <tr key={i.id} className={cn("border-t border-border", idx < saved && "bg-primary/5")}>
                  <td className="num py-2.5">{i.componentId}{idx < saved && <Tag tone="primary" className="ml-2">New</Tag>}</td>
                  <td className="num py-2.5 text-muted-foreground">{fmtTime(i.timestamp)}</td>
                  <td className="py-2.5"><Tag tone={i.status === "pass" ? "safe" : "danger"}>{i.status === "pass" ? "Pass" : "Defect"}</Tag></td>
                  <td className="py-2.5">{i.defect ?? "None"}</td>
                  <td className="py-2.5"><SeverityTag s={i.severity} /></td>
                  <td className="num py-2.5 text-right">{(i.confidence * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
