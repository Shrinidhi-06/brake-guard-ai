import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cpu, Factory, Loader2, Save, ScanSearch } from "lucide-react";
import { toast } from "sonner";
import { Panel, PageHeader, Tag, Term } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MACHINES } from "@/lib/mock/data";
import { DEFAULT_SETTINGS, loadSettings, persistSettings, type Settings } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "System Settings — AutoSentinel AI" },
      { name: "description", content: "Configure the AutoSentinel AI engine, inspection behaviour and machine settings." },
      { property: "og:title", content: "System Settings — AutoSentinel AI" },
      { property: "og:description", content: "Configure AI engine, inspection and machine settings." },
    ],
  }),
  component: SettingsPage,
});

function Row({ label, desc, children }: { label: React.ReactNode; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3.5 last:border-0">
      <div>
        <div className="text-sm">{label}</div>
        {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function SettingsPage() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  useEffect(() => setS(loadSettings()), []);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    persistSettings(s);
    setSaving(false);
    toast.success("Settings saved");
  }

  return (
    <>
      <PageHeader title="System Settings" subtitle="Configure the prototype AI engine and production line preferences."
        right={<Button className="ember" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save settings</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="AI Engine" icon={<Cpu className="h-4 w-4 text-primary" />}>
          <Row label="AI Engine Status"><span className="flex items-center gap-2 text-sm text-safe"><span className="h-2 w-2 rounded-full bg-safe animate-pulse-dot" />Online</span></Row>
          <Row label="Model" desc="Deterministic demo engine — no trained weights loaded"><span className="num text-sm">AutoSentinel Vision v1 <Tag tone="warn" className="ml-1">Demo</Tag></span></Row>
          <Row label="Supported classes" desc="Clean · Scratch · Wear · Corrosion · Hole / Perforation"><Tag tone="info">5 categories</Tag></Row>
          <Row label={<Term tip="Detections below this confidence are reported as 'Other Anomaly — needs review'.">Confidence Threshold</Term>} desc={`${s.threshold}%`}>
            <Slider className="w-40" min={50} max={99} step={1} value={[s.threshold]} onValueChange={([v = 80]) => set("threshold", v)} />
          </Row>
        </Panel>
        <Panel title="Inspection Settings" icon={<ScanSearch className="h-4 w-4 text-info" />}>
          <Row label="Automatic analysis" desc="Analyze immediately after an image is uploaded"><Switch checked={s.autoAnalysis} onCheckedChange={(v) => set("autoAnalysis", v)} /></Row>
          <Row label="Save inspection history" desc="Store each completed inspection automatically"><Switch checked={s.saveHistory} onCheckedChange={(v) => set("saveHistory", v)} /></Row>
          <Row label="High-risk alerts" desc="Show alerts for high-severity defects and sensor anomalies"><Switch checked={s.highRiskAlerts} onCheckedChange={(v) => set("highRiskAlerts", v)} /></Row>
        </Panel>
        <Panel title="Machine Settings" icon={<Factory className="h-4 w-4 text-warn" />} className="lg:col-span-2">
          <Row label="Production Line">
            <Select value={s.line} onValueChange={(v) => set("line", v)}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>{MACHINES.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
          </Row>
          <Row label="Sensor update interval" desc="How often Live Monitoring refreshes">
            <Select value={s.interval} onValueChange={(v) => set("interval", v)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="500">0.5 seconds</SelectItem>
                <SelectItem value="1000">1 second</SelectItem>
                <SelectItem value="2000">2 seconds</SelectItem>
                <SelectItem value="5000">5 seconds</SelectItem>
              </SelectContent>
            </Select>
          </Row>
        </Panel>
        <Panel title="About this prototype" icon={<Cpu className="h-4 w-4 text-muted-foreground" />} className="lg:col-span-2">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Current prototype supports five visual condition categories. Additional defect classes require training and validation using a sufficiently large, properly labeled brake-component image dataset.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            All inspection results, including Hole / Perforation, are demo-scenario outputs from the deterministic prototype engine — not validated machine-learning predictions.
          </p>
        </Panel>
      </div>
    </>
  );
}
