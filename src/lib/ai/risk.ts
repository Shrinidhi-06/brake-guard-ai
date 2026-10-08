import type { OperatingConditions, RiskLevel, RiskPrediction } from "@/types";

/**
 * Prototype risk model — a transparent, deterministic weighted formula.
 * NOT a validated failure-prediction model. Replace with a trained model later.
 */
export const LIMITS = {
  temperature: { min: 20, max: 140, unit: "°C", step: 1 },
  vibration: { min: 0, max: 12, unit: "mm/s", step: 0.1 },
  pressure: { min: 2, max: 9, unit: "bar", step: 0.1 },
  rpm: { min: 600, max: 2400, unit: "rpm", step: 10 },
  load: { min: 0, max: 100, unit: "%", step: 1 },
  componentAge: { min: 0, max: 500, unit: "h", step: 1 },
} as const;

const W = { temperature: 0.2947, vibration: 0.42, pressure: 0.1155, rpm: 0.1, load: 0.15, age: 0.2 };
const BASELINE = 0.0688;

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function sanitize(c: OperatingConditions): OperatingConditions {
  const out = { ...c };
  (Object.keys(LIMITS) as (keyof typeof LIMITS)[]).forEach((k) => {
    const n = Number(out[k]);
    out[k] = clamp(Number.isFinite(n) ? n : LIMITS[k].min, LIMITS[k].min, LIMITS[k].max);
  });
  return out;
}

export function riskLevel(r: number): RiskLevel {
  if (r >= 0.8) return "critical";
  if (r >= 0.6) return "high";
  if (r >= 0.3) return "medium";
  return "low";
}

export function calculateRisk(input: OperatingConditions): RiskPrediction {
  const c = sanitize(input);
  const contributors = {
    temperature: W.temperature * Math.max(0, (c.temperature - 82) / 25),
    vibration: W.vibration * Math.max(0, (c.vibration - 2.8) / 5),
    pressure: W.pressure * (Math.abs(c.pressure - 5.8) / 1.5),
    rpm: W.rpm * Math.max(0, (c.rpm - 1420) / 1000),
    load: W.load * Math.max(0, (c.load - 50) / 50),
    age: W.age * (c.componentAge / 200),
  };
  const sum = BASELINE + Object.values(contributors).reduce((a, b) => a + b, 0);
  const risk = clamp(sum, 0.02, 0.99);
  const level = riskLevel(risk);

  const top = (Object.entries(contributors) as [string, number][]).sort((a, b) => b[1] - a[1])[0] ?? ["vibration", 0];
  let recommendation = "Operating conditions are currently within acceptable limits. Continue monitoring.";
  if (level !== "low") {
    const name = top[0] === "rpm" ? "RPM" : top[0] === "age" ? "Component age" : top[0].charAt(0).toUpperCase() + top[0].slice(1);
    recommendation =
      level === "medium"
        ? `${name} is the primary contributor to current risk. Monitor closely and plan a corrective adjustment.`
        : `High ${name.toLowerCase()} is the primary contributor to current risk. Reduce ${name.toLowerCase()} and inspect the component before continuing production.`;
  }
  return { risk, level, contributors, baseline: BASELINE, recommendation };
}

export const DEFAULT_CONDITIONS: OperatingConditions = {
  temperature: 82,
  vibration: 2.8,
  pressure: 5.2,
  rpm: 1420,
  load: 67,
  componentAge: 18,
};
