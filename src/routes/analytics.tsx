import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AnimatedNumber, Panel, PageHeader, Tag, chartTooltipStyle } from "@/components/common";
import { analyticsFor, type RangeKey } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Quality Analytics — AutoSentinel AI" },
      { name: "description", content: "Defect trends, pass rates, severity distribution and machine risk trends for brake disc production." },
      { property: "og:title", content: "Quality Analytics — AutoSentinel AI" },
      { property: "og:description", content: "Defect trends and quality KPIs for brake disc production." },
    ],
  }),
  component: AnalyticsPage,
});

const RANGES: { k: RangeKey; l: string }[] = [{ k: "today", l: "Today" }, { k: "7d", l: "7 Days" }, { k: "30d", l: "30 Days" }];
const TYPE_COLORS = ["var(--danger)", "var(--info)", "var(--warn)", "var(--primary)", "var(--danger)", "var(--muted-foreground)"];
const SEV_COLORS = ["var(--safe)", "var(--warn)", "var(--primary)", "var(--danger)"];
const axis = { stroke: "var(--muted-foreground)", fontSize: 10, tickLine: false, axisLine: false } as const;

function AnalyticsPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const a = analyticsFor(range);
  const kpis = [
    { l: "Total Inspections", v: a.total, d: 0 },
    { l: "Pass Rate", v: a.passRate, d: 1, s: "%", c: "text-safe" },
    { l: "Defect Rate", v: a.defectRate, d: 1, s: "%", c: "text-warn" },
    { l: "Critical Defects", v: a.critical, d: 0, c: "text-danger" },
    { l: "Avg AI Confidence", v: a.avgConfidence, d: 1, s: "%", c: "text-info" },
  ];
  return (
    <>
      <PageHeader tag="Demo Dataset" title="Quality Analytics" subtitle="Defect trends and inspection KPIs for Brake Disc Production Line A."
        right={
          <div className="flex gap-1 rounded-lg border border-border bg-background/40 p-1">
            {RANGES.map((r) => (
              <button key={r.k} onClick={() => setRange(r.k)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", range === r.k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{r.l}</button>
            ))}
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.l} className="panel p-4">
            <div className="label-xs">{k.l}</div>
            <div className={cn("mt-2 text-2xl font-semibold", k.c)}><AnimatedNumber value={k.v} decimals={k.d} suffix={k.s} /></div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Defects by Type">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.byType} margin={{ left: -20 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="type" {...axis} />
                <YAxis {...axis} allowDecimals={false} />
                <Tooltip {...chartTooltipStyle} cursor={{ fill: "var(--accent)" }} />
                <Bar dataKey="count" name="Defects" radius={[4, 4, 0, 0]}>{a.byType.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Defects over Time">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={a.overTime} margin={{ left: -20 }}>
                <defs><linearGradient id="defFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--warn)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--warn)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" {...axis} minTickGap={16} />
                <YAxis {...axis} allowDecimals={false} />
                <Tooltip {...chartTooltipStyle} />
                <Area dataKey="defects" name="Defects" stroke="var(--warn)" fill="url(#defFill)" strokeWidth={2} type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Pass vs Fail">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={a.passFail} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2} stroke="none">
                  <Cell fill="var(--safe)" /><Cell fill="var(--danger)" />
                </Pie>
                <Tooltip {...chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Severity Distribution">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={a.severity} dataKey="value" nameKey="name" outerRadius="85%" stroke="var(--background)">
                  {a.severity.map((_, i) => <Cell key={i} fill={SEV_COLORS[i]} />)}
                </Pie>
                <Tooltip {...chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel className="lg:col-span-2" title="Machine Risk Trend" right={<Tag tone="info">Simulated sensor data</Tag>}>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={a.overTime} margin={{ left: -20, right: 8 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" {...axis} minTickGap={16} />
                <YAxis {...axis} unit="%" domain={[0, 50]} />
                <Tooltip {...chartTooltipStyle} />
                <Line dataKey="risk" name="Risk %" stroke="var(--primary)" strokeWidth={2} dot={false} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </>
  );
}
