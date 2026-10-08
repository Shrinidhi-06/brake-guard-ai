import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSearch, ImageUp, Loader2, RotateCcw, Save, ScanSearch, ShieldAlert, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Panel, PageHeader, RiskMeter, Tag, Term, AnimatedNumber, riskColorVar } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ANALYSIS_STEPS, SCENARIOS, analyzeImage, scenarioFromFile, type ScenarioKey, type ScenarioResult } from "@/lib/ai/inspection";
import { detectHoles } from "@/lib/ai/holeDetector";
import type { BoundingBox } from "@/types";
import { DEFECT_TYPES, DEMO_IMAGES } from "@/lib/mock/data";
import { loadSettings, nextComponentId, nextInspectionId, saveInspection } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Inspection } from "@/types";

export const Route = createFileRoute("/inspect")({
  head: () => ({
    meta: [
      { title: "AI Component Inspection — AutoSentinel AI" },
      { name: "description", content: "Upload a brake disc image to detect visible manufacturing defects with the AutoSentinel prototype AI engine." },
      { property: "og:title", content: "AI Component Inspection — AutoSentinel AI" },
      { property: "og:description", content: "Upload a brake disc image to detect visible manufacturing defects." },
    ],
  }),
  component: InspectPage,
});

type Phase = "empty" | "ready" | "scanning" | "done";
const ACCEPT = ["image/jpeg", "image/png", "image/jpg"];
const SAMPLES: { key: ScenarioKey; label: string }[] = [
  { key: "crack", label: "Crack" },
  { key: "pass", label: "Clean" },
  { key: "corrosion", label: "Corrosion" },
  { key: "wear", label: "Wear" },
  { key: "hole", label: "Hole" },
];

function InspectPage() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [autoKey, setAutoKey] = useState<ScenarioKey>("crack");
  const [scenario, setScenario] = useState<"auto" | ScenarioKey>("auto");
  const [phase, setPhase] = useState<Phase>("empty");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [record, setRecord] = useState<Inspection | null>(null);
  const [saved, setSaved] = useState(false);
  const [drag, setDrag] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [holeBoxes, setHoleBoxes] = useState<BoundingBox[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setImage(null); setFileName(""); setPhase("empty"); setResult(null); setRecord(null); setSaved(false); setStep(0);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  function acceptFile(f: File | undefined): void {
    if (!f) return;
    if (!ACCEPT.includes(f.type)) { toast.error("Unsupported file type", { description: "Please upload a JPG, JPEG or PNG image." }); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error("File too large", { description: "Maximum size is 10 MB." }); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const url = reader.result as string;
      setImage(url);
      setFileName(f.name);
      let boxes: BoundingBox[] = [];
      try { boxes = await detectHoles(url); } catch { boxes = []; }
      setHoleBoxes(boxes);
      // Physical openings take priority over corrosion/texture-based scenarios.
      setAutoKey(boxes.length > 0 ? "hole" : scenarioFromFile(f.name, f.size));
      setPhase("ready"); setResult(null); setSaved(false);
      toast.success("Image loaded", { description: f.name });
    };
    reader.onerror = () => toast.error("Could not read the file");
    reader.readAsDataURL(f);
  }

  function pickSample(k: ScenarioKey) {
    setImage(DEMO_IMAGES[k]);
    setFileName(`demo-brake-disc-${k}.jpg`);
    setHoleBoxes([]);
    setAutoKey(k);
    setPhase("ready"); setResult(null); setSaved(false);
  }

  const activeKey: ScenarioKey = scenario === "auto" ? autoKey : scenario;

  async function analyze() {
    if (!image) return;
    setPhase("scanning"); setStep(0);
    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, 520));
    }
    try {
      const res = await analyzeImage(activeKey);
      if (activeKey === "hole" && holeBoxes.length > 0) res.boxes = holeBoxes;
      const rec: Inspection = {
        id: nextInspectionId(),
        componentId: nextComponentId(),
        timestamp: new Date().toISOString(),
        status: res.status,
        defect: res.defect,
        severity: res.severity,
        confidence: res.confidence,
        risk: res.risk,
        explanation: res.explanation,
        recommendation: res.recommendation,
        action: res.action,
        operator: "R. Sharma",
        image,
        boxes: res.boxes,
        source: "demo",
      };
      setResult(res); setRecord(rec); setPhase("done");
      if (loadSettings().saveHistory) {
        saveInspection(rec); setSaved(true);
        toast.success(`Inspection ${rec.componentId} saved to history`);
      }
      if (res.status === "defect" && (res.severity === "high" || res.severity === "critical") && loadSettings().highRiskAlerts) {
        toast.warning("High-risk defect detected", { description: `${res.defect} — ${res.action.toLowerCase()}` });
      }
    } catch {
      setPhase("ready");
      toast.error("Analysis failed", { description: "Please try again." });
    }
  }

  function save() {
    if (!record || saved) return;
    saveInspection(record); setSaved(true);
    toast.success(`Inspection ${record.componentId} saved to history`);
  }

  useEffect(() => {
    if (phase === "ready" && loadSettings().autoAnalysis) analyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === "ready" && image]);

  const isDefect = result?.status === "defect";

  return (
    <>
      <PageHeader
        tag="Brake Disc / Rotor"
        title="AI Component Inspection"
        subtitle="Upload a brake disc image to detect visible manufacturing defects."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="warn">Prototype AI Engine</Tag>
            <div className="flex items-center gap-2">
              <span className="label-xs">Demo Scenario</span>
              <Select value={scenario} onValueChange={(v) => setScenario(v as typeof scenario)} disabled={phase === "scanning"}>
                <SelectTrigger className="h-8 w-[190px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (from image)</SelectItem>
                  {(Object.keys(SCENARIOS) as ScenarioKey[]).map((k) => (
                    <SelectItem key={k} value={k}>{SCENARIOS[k].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        {/* LEFT: image */}
        <Panel className="p-3 md:p-4">
          {!image ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); acceptFile(e.dataTransfer.files[0]); }}
              className={cn(
                "flex aspect-square max-h-[520px] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed transition-colors",
                drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/30",
              )}
            >
              <div className="ember glow flex h-16 w-16 items-center justify-center rounded-2xl"><ImageUp className="h-7 w-7" /></div>
              <div className="text-center">
                <div className="text-lg font-medium">Drop brake disc image here</div>
                <div className="text-sm text-muted-foreground">or click to upload</div>
              </div>
              <div className="label-xs">JPG · JPEG · PNG — max 10 MB</div>
            </div>
          ) : (
            <div className="relative mx-auto aspect-square max-h-[520px] overflow-hidden rounded-lg border border-border bg-background">
              <img src={image} alt="Uploaded brake disc" className="h-full w-full object-cover" />
              {phase === "scanning" && (
                <>
                  <div className="absolute inset-0 bg-background/30" />
                  <div className="absolute inset-x-0 h-0.5 animate-scan bg-primary" style={{ boxShadow: "0 0 24px 6px var(--primary)" }} />
                  <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)", backgroundSize: "40px 40px", opacity: 0.08 }} />
                </>
              )}
              {phase === "done" && result?.boxes.map((b, i) => (
                <div key={i} className="absolute rounded-sm border-2 border-danger animate-rise" style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`, boxShadow: "0 0 18px var(--danger)" }}>
                  <span className="absolute -top-5 left-0 whitespace-nowrap rounded-sm bg-danger px-1.5 py-0.5 font-mono text-[10px] text-destructive-foreground">{b.label}</span>
                </div>
              ))}
              {phase === "done" && !isDefect && (
                <div className="absolute left-3 top-3 rounded bg-safe px-2 py-1 font-mono text-[10px] text-background">NO DEFECT FOUND</div>
              )}
              {phase !== "scanning" && (
                <button aria-label="Remove image" onClick={() => (phase === "done" && !saved ? setConfirmReset(true) : reset())} className="absolute right-2 top-2 rounded-md bg-background/80 p-1.5 hover:bg-background">
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className="absolute inset-x-0 bottom-0 truncate bg-background/80 px-3 py-1.5 font-mono text-[11px] text-muted-foreground">{fileName}</div>
            </div>
          )}
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="hidden" onChange={(e) => acceptFile(e.target.files?.[0])} />

          {phase !== "scanning" && phase !== "done" && (
            <div className="mt-3">
              <div className="label-xs mb-2">Or use a demo image</div>
              <div className="grid grid-cols-5 gap-2">
                {SAMPLES.map((s) => (
                  <button key={s.key} onClick={() => pickSample(s.key)} className={cn("group overflow-hidden rounded-md border text-left transition-colors", fileName === `demo-brake-disc-${s.key}.jpg` ? "border-primary" : "border-border hover:border-primary/50")}>
                    <img src={DEMO_IMAGES[s.key]} alt={`Demo ${s.label} brake disc`} loading="lazy" width={1024} height={1024} className="aspect-square w-full object-cover opacity-80 group-hover:opacity-100" />
                    <div className="px-2 py-1 text-[11px]">{s.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(phase === "ready" || phase === "scanning") && (
            <Button size="lg" onClick={analyze} disabled={phase === "scanning"} className="ember glow mt-4 w-full text-base">
              {phase === "scanning" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {phase === "scanning" ? "Analyzing..." : "Analyze with AutoSentinel AI"}
            </Button>
          )}
        </Panel>

        {/* RIGHT: result */}
        <div className="flex flex-col gap-4">
          {phase === "scanning" && (
            <Panel title="AutoSentinel AI is analyzing" icon={<ScanSearch className="h-4 w-4 text-primary" />}>
              <ul className="flex flex-col gap-2.5">
                {ANALYSIS_STEPS.map((s, i) => (
                  <li key={s} className={cn("flex items-center gap-3 text-sm transition-opacity", i > step && "opacity-30")}>
                    {i < step ? <CheckCircle2 className="h-4 w-4 text-safe" /> : i === step ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <span className="h-4 w-4 rounded-full border border-border" />}
                    <span className={cn(i === step && "text-foreground", "font-mono text-xs")}>{s}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((step + 1) / ANALYSIS_STEPS.length) * 100}%` }} />
              </div>
            </Panel>
          )}

          {phase === "done" && result && (
            <>
              <Panel
                title="Inspection Result"
                icon={isDefect ? <ShieldAlert className="h-4 w-4 text-danger" /> : <CheckCircle2 className="h-4 w-4 text-safe" />}
                right={<Tag tone="warn">Demo result</Tag>}
              >
                <div className={cn("rounded-lg border p-4", isDefect ? "border-danger/40 bg-danger/10" : "border-safe/40 bg-safe/10")}>
                  <div className="label-xs">Status</div>
                  <div className={cn("mt-1 font-mono text-2xl font-bold tracking-wide md:text-3xl", isDefect ? "text-danger" : "text-safe")}>
                    {isDefect ? "DEFECT DETECTED" : "PASS — NO DEFECT"}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Stat label="Defect" value={result.defect ?? "None"} />
                  <Stat label="Severity" value={result.severity === "none" ? "—" : result.severity.toUpperCase()} color={result.severity === "none" ? undefined : riskColorVar(result.risk)} />
                  <Stat label={<Term tip="How sure the (prototype) model is about this classification.">AI Confidence</Term>} value={<AnimatedNumber value={result.confidence * 100} decimals={1} suffix="%" />} />
                  <Stat label={<Term tip="Estimated probability that this component causes a quality issue or failure downstream.">Risk Score</Term>} value={<AnimatedNumber value={result.risk * 100} suffix="%" />} color={riskColorVar(result.risk)} big />
                </div>
                <div className="mt-4"><RiskMeter value={result.risk} /></div>
                <div className="mt-4">
                  <div className="label-xs mb-2">Defect categories</div>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFECT_TYPES.map((d) => (
                      <Tag key={d} tone={result.defect === d ? (result.severity === "low" ? "safe" : result.severity === "medium" ? "warn" : "danger") : "muted"}>{d}</Tag>
                    ))}
                  </div>
                </div>
              </Panel>

              <Panel title="AI Explanation" icon={<Sparkles className="h-4 w-4 text-info" />}>
                <p className="text-sm leading-relaxed text-muted-foreground">{result.explanation}</p>
              </Panel>

              <Panel title="Recommended Action" icon={<AlertTriangle className="h-4 w-4 text-warn" />}>
                <div className={cn("font-mono text-lg font-bold", isDefect ? (result.severity === "low" ? "text-warn" : "text-danger") : "text-safe")}>{result.action}</div>
                <p className="mt-1 text-sm text-muted-foreground">{result.recommendation}</p>
              </Panel>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button variant="secondary" onClick={() => (saved ? reset() : setConfirmReset(true))}><RotateCcw className="h-4 w-4" />Inspect Another</Button>
                <Button variant="secondary" onClick={save} disabled={saved}>
                  {saved ? <CheckCircle2 className="h-4 w-4 text-safe" /> : <Save className="h-4 w-4" />}{saved ? "Saved" : "Save Inspection"}
                </Button>
                <Button className="ember" onClick={() => setDetailOpen(true)}><FileSearch className="h-4 w-4" />View Detailed Analysis</Button>
              </div>
            </>
          )}

          {(phase === "empty" || phase === "ready") && (
            <Panel title="How it works" icon={<ScanSearch className="h-4 w-4 text-primary" />}>
              <ol className="flex flex-col gap-3 text-sm text-muted-foreground">
                {["Upload a top-down photo of a brake disc, or pick a demo image.", "AutoSentinel scans the braking surface for cracks, scratches, corrosion and wear.", "Get the defect, severity, risk score and a recommended action in seconds."].map((t, i) => (
                  <li key={t} className="flex gap-3"><span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs text-foreground">{i + 1}</span>{t}</li>
                ))}
              </ol>
              <div className="mt-4 rounded-md border border-warn/30 bg-warn/5 p-3 text-xs text-muted-foreground">
                <span className="font-medium text-warn">Prototype notice:</span> no trained vision model is connected. Results come from deterministic demo scenarios (selected scenario: <span className="text-foreground">{scenario === "auto" ? `Auto → ${SCENARIOS[autoKey].label}` : SCENARIOS[scenario].label}</span>).
              </div>
            </Panel>
          )}
        </div>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detailed Analysis — {record?.componentId}</DialogTitle>
            <DialogDescription>Prototype AI engine · demo scenario output</DialogDescription>
          </DialogHeader>
          {result && (
            <div className="flex flex-col gap-4 text-sm">
              <div>
                <div className="label-xs mb-2">Class probabilities</div>
                {[...DEFECT_TYPES, "No Defect" as const].map((d) => {
                  const p = d === (result.defect ?? "No Defect") ? result.confidence : (1 - result.confidence) / 6;
                  return (
                    <div key={d} className="mb-1.5 grid grid-cols-[110px_1fr_48px] items-center gap-2">
                      <span className="text-xs text-muted-foreground">{d}</span>
                      <div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${p * 100}%` }} /></div>
                      <span className="num text-right text-xs">{(p * 100).toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
              <div>
                <div className="label-xs mb-2">Detected regions</div>
                {result.boxes.length === 0 ? <p className="text-muted-foreground">No regions flagged.</p> : result.boxes.map((b, i) => (
                  <div key={i} className="num text-xs text-muted-foreground">#{i + 1} {b.label} — x {b.x}% · y {b.y}% · {b.w}×{b.h}%</div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded border border-border p-2"><div className="label-xs">Model</div>AutoSentinel Vision v1 (demo)</div>
                <div className="rounded border border-border p-2"><div className="label-xs">Inference</div>~3.1 s simulated</div>
                <div className="rounded border border-border p-2"><div className="label-xs">Operator</div>R. Sharma</div>
              </div>
              <Button asChild variant="secondary"><Link to="/risk">Continue to AI Risk Analysis →</Link></Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this inspection?</AlertDialogTitle>
            <AlertDialogDescription>This result hasn't been saved to inspection history yet.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={reset}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Stat({ label, value, color, big }: { label: React.ReactNode; value: React.ReactNode; color?: string | undefined; big?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="label-xs">{label}</div>
      <div className={cn("mt-1 font-semibold", big ? "num text-3xl" : "text-lg")} style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}
