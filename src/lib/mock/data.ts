import discPass from "@/assets/disc-pass.jpg";
import discCrack from "@/assets/disc-crack.jpg";
import discCorrosion from "@/assets/disc-corrosion.jpg";
import discWear from "@/assets/disc-wear.jpg";
import discHole from "@/assets/disc-hole.jpg";
import { SCENARIOS, type ScenarioKey } from "@/lib/ai/inspection";
import type { Alert, DefectType, Inspection, Machine } from "@/types";

export const DEMO_IMAGES: Record<ScenarioKey, string> = {
  pass: discPass,
  crack: discCrack,
  corrosion: discCorrosion,
  scratch: discPass,
  wear: discWear,
  hole: discHole,
};

export const MACHINES: Machine[] = [
  { id: "line-a", name: "Brake Disc Production Line A", line: "A", status: "normal" },
  { id: "line-b", name: "Brake Disc Production Line B", line: "B", status: "normal" },
];

export const OPERATORS = ["R. Sharma", "A. Iyer", "K. Menon", "S. Patel"];

/** Deterministic PRNG so SSR and client render identical demo data. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const PATTERN: ScenarioKey[] = [
  "pass", "crack", "pass", "pass", "scratch", "pass", "corrosion", "pass", "pass", "wear",
  "pass", "pass", "scratch", "pass", "crack", "pass", "pass", "corrosion", "pass", "pass",
  "wear", "pass", "hole", "scratch",
];

function buildSeed(): Inspection[] {
  const r = rng(42);
  const base = Date.UTC(2026, 9, 8, 11, 42);
  return PATTERN.map((key, i) => {
    const s = SCENARIOS[key].result;
    const conf = i === 0 ? 0.981 : i === 1 ? 0.943 : i === 2 ? 0.978 : Math.round((s.confidence - 0.03 + r() * 0.05) * 1000) / 1000;
    const critical = key === "crack" && i === 14;
    return {
      id: `INS-${2040 - i}`,
      componentId: `BD-${10284 - i}`,
      timestamp: new Date(base - i * (i < 3 ? 4 : 47) * 60_000).toISOString(),
      status: s.status,
      defect: s.defect,
      severity: critical ? "critical" : s.severity,
      confidence: Math.min(conf, 0.995),
      risk: critical ? 0.88 : s.risk,
      explanation: s.explanation,
      recommendation: s.recommendation,
      action: critical ? "SCRAP COMPONENT" : s.action,
      operator: OPERATORS[i % OPERATORS.length] ?? "R. Sharma",
      image: DEMO_IMAGES[key],
      boxes: s.boxes,
      source: "demo",
    } satisfies Inspection;
  });
}

export const SEED_INSPECTIONS: Inspection[] = buildSeed();

export const DASHBOARD_STATS = {
  inspected: 1284,
  defects: 86,
  accuracy: 94.7,
  critical: 7,
};

export const RISK_TREND_12H = (() => {
  const r = rng(7);
  return Array.from({ length: 13 }, (_, i) => {
    const hour = (23 + i) % 24;
    const bump = i === 8 ? 9 : i === 9 ? 6 : 0;
    return { time: `${String(hour).padStart(2, "0")}:00`, risk: +(12 + r() * 7 + bump + (i === 12 ? 2 : 0)).toFixed(1) };
  }).map((d, i, a) => (i === a.length - 1 ? { ...d, risk: 18.4 } : d));
})();

export const AI_INSIGHTS = [
  { tone: "warn" as const, text: "Vibration increased by 14% during the last hour." },
  { tone: "safe" as const, text: "Current operating conditions remain within the safe range." },
  { tone: "info" as const, text: "Recommended: continue monitoring." },
];

export const DEFECT_TYPES: DefectType[] = ["Surface Crack", "Scratch", "Corrosion", "Uneven Wear", "Hole / Perforation", "Other Anomaly"];

export type RangeKey = "today" | "7d" | "30d";

export function analyticsFor(range: RangeKey) {
  const scale = range === "today" ? 1 : range === "7d" ? 7 : 30;
  const r = rng(range === "today" ? 3 : range === "7d" ? 11 : 29);
  const total = range === "today" ? 46 : range === "7d" ? 312 : 1284;
  const defects = range === "today" ? 4 : range === "7d" ? 23 : 86;
  const critical = range === "today" ? 1 : range === "7d" ? 3 : 7;
  const byType = [
    { type: "Surface Crack", count: Math.round(defects * 0.24) },
    { type: "Scratch", count: Math.round(defects * 0.33) },
    { type: "Corrosion", count: Math.round(defects * 0.17) },
    { type: "Uneven Wear", count: Math.round(defects * 0.19) },
    { type: "Hole / Perforation", count: Math.round(defects * 0.04) },
    { type: "Other", count: 0 },
  ];
  byType[5]!.count = Math.max(0, defects - byType.slice(0, 5).reduce((a, b) => a + b.count, 0));
  const points = range === "today" ? 12 : range === "7d" ? 7 : 30;
  const overTime = Array.from({ length: points }, (_, i) => ({
    label: range === "today" ? `${String(i * 2).padStart(2, "0")}:00` : range === "7d" ? (["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"][i] ?? "") : `D${i + 1}`,
    defects: Math.max(0, Math.round((defects / points) * (0.5 + r()))),
    inspected: Math.round((total / points) * (0.8 + r() * 0.4)),
    risk: +(14 + r() * 10 + (i % 5 === 3 ? 8 : 0)).toFixed(1),
  }));
  const severity = [
    { name: "Low", value: Math.round(defects * 0.42) },
    { name: "Medium", value: Math.round(defects * 0.36) },
    { name: "High", value: Math.round(defects * 0.14) },
    { name: "Critical", value: critical },
  ];
  return {
    total,
    defects,
    critical,
    passRate: ((total - defects) / total) * 100,
    defectRate: (defects / total) * 100,
    avgConfidence: 91.8 + (scale % 3) * 0.4,
    byType,
    overTime,
    severity,
    passFail: [
      { name: "Pass", value: total - defects },
      { name: "Defect", value: defects },
    ],
  };
}

export const SEED_ALERTS: Alert[] = [
  { id: "al-1", timestamp: "2026-10-08T11:38:00Z", level: "critical", title: "Surface crack detected — BD-10283", description: "Component quarantined. Secondary inspection required." },
  { id: "al-2", timestamp: "2026-10-08T10:52:00Z", level: "warning", title: "Vibration +14% on Line A", description: "Still within learned operating range." },
  { id: "al-3", timestamp: "2026-10-08T09:10:00Z", level: "info", title: "Shift B started", description: "Operator R. Sharma signed in." },
];
