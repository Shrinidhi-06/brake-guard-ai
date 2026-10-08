import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Database, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, Panel, PageHeader, RiskMeter, SeverityTag, Tag, fmtDate, riskColorVar } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { clearSavedInspections, useInspections, useSavedCount } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Inspection } from "@/types";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Inspection History — AutoSentinel AI" },
      { name: "description", content: "Searchable database of brake disc inspections with defects, severity and AI explanations." },
      { property: "og:title", content: "Inspection History — AutoSentinel AI" },
      { property: "og:description", content: "Searchable brake disc inspection records." },
    ],
  }),
  component: HistoryPage,
});

const FILTERS = ["all", "pass", "defect", "critical"] as const;

function HistoryPage() {
  const all = useInspections();
  const savedCount = useSavedCount();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Inspection | null>(null);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return all.filter((i) => {
      if (filter === "pass" && i.status !== "pass") return false;
      if (filter === "defect" && i.status !== "defect") return false;
      if (filter === "critical" && !(i.severity === "critical" || i.severity === "high")) return false;
      if (!s) return true;
      return [i.id, i.componentId, i.defect ?? "none", i.operator, i.severity].some((v) => v.toLowerCase().includes(s));
    });
  }, [all, filter, q]);

  return (
    <>
      <PageHeader tag="Demo Dataset" title="Inspection History" subtitle="Every inspection, searchable. Click a row to open its full AI report."
        right={savedCount > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" size="sm"><Trash2 className="h-4 w-4" />Clear my inspections ({savedCount})</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear saved inspections?</AlertDialogTitle>
                <AlertDialogDescription>This removes the {savedCount} inspection(s) you saved in this browser. Demo records remain.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { clearSavedInspections(); toast.success("Saved inspections cleared"); }}>Clear</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      />
      <Panel>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-lg border border-border bg-background/40 p-1">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors", filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{f}</button>
            ))}
          </div>
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID, defect, operator…" className="pl-9" maxLength={60} />
          </div>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={<Database className="h-8 w-8" />} title="No inspections found" text="Try a different filter or search term." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="label-xs text-left">
                  {["Inspection ID", "Component ID", "Date", "Result", "Defect", "Severity", "Confidence", "Operator"].map((h) => <th key={h} className="pb-2 font-normal">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => (
                  <tr key={i.id} onClick={() => setSel(i)} className="cursor-pointer border-t border-border transition-colors hover:bg-accent/40">
                    <td className="num py-2.5">{i.id}</td>
                    <td className="num py-2.5">{i.componentId}</td>
                    <td className="num py-2.5 text-muted-foreground">{fmtDate(i.timestamp)}</td>
                    <td className="py-2.5"><Tag tone={i.status === "pass" ? "safe" : "danger"}>{i.status}</Tag></td>
                    <td className="py-2.5">{i.defect ?? "None"}</td>
                    <td className="py-2.5"><SeverityTag s={i.severity} /></td>
                    <td className="num py-2.5">{(i.confidence * 100).toFixed(1)}%</td>
                    <td className="py-2.5 text-muted-foreground">{i.operator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="label-xs mt-3">{rows.length} of {all.length} records</div>
      </Panel>

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {sel && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono">{sel.componentId} · {sel.id}</SheetTitle>
                <SheetDescription>{fmtDate(sel.timestamp)} UTC · {sel.operator} · {sel.source === "demo" ? "Prototype AI (demo)" : "Model"}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 flex flex-col gap-4 px-4 pb-6">
                <div className="relative aspect-square overflow-hidden rounded-lg border border-border">
                  <img src={sel.image} alt={`Brake disc ${sel.componentId}`} className="h-full w-full object-cover" loading="lazy" />
                  {sel.boxes.map((b, i) => (
                    <div key={i} className="absolute rounded-sm border-2 border-danger" style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }} />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-border p-3"><div className="label-xs">Defect</div><div className="mt-1 text-sm font-medium">{sel.defect ?? "None"}</div></div>
                  <div className="rounded-lg border border-border p-3"><div className="label-xs">Confidence</div><div className="num mt-1 text-sm font-medium">{(sel.confidence * 100).toFixed(1)}%</div></div>
                  <div className="rounded-lg border border-border p-3"><div className="label-xs">Risk</div><div className="num mt-1 text-sm font-semibold" style={{ color: riskColorVar(sel.risk) }}>{Math.round(sel.risk * 100)}%</div></div>
                </div>
                <RiskMeter value={sel.risk} />
                <div><div className="label-xs mb-1">AI explanation</div><p className="text-sm text-muted-foreground">{sel.explanation}</p></div>
                <div className="rounded-lg border border-border bg-background/40 p-3">
                  <div className="label-xs mb-1">Recommendation</div>
                  <div className={cn("font-mono font-bold", sel.status === "pass" ? "text-safe" : "text-danger")}>{sel.action}</div>
                  <p className="text-sm text-muted-foreground">{sel.recommendation}</p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
