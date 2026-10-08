// Domain types. Shaped to map 1:1 onto future Postgres tables / FastAPI models.

export type DefectType = "Surface Crack" | "Scratch" | "Corrosion" | "Uneven Wear" | "Hole / Perforation" | "Other Anomaly";
export type Severity = "none" | "low" | "medium" | "high" | "critical";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface BoundingBox {
  x: number; // percent of width
  y: number;
  w: number;
  h: number;
  label: string;
}

export interface Inspection {
  id: string; // inspection id, e.g. INS-2041
  componentId: string; // e.g. BD-10284
  timestamp: string; // ISO
  status: "pass" | "defect";
  defect: DefectType | null;
  severity: Severity;
  confidence: number; // 0..1
  risk: number; // 0..1
  explanation: string;
  recommendation: string;
  action: string;
  operator: string;
  image: string; // url or data url
  boxes: BoundingBox[];
  source: "demo" | "model";
}

export interface SensorReading {
  timestamp: string;
  temperature: number;
  vibration: number;
  pressure: number;
  rpm: number;
  load: number;
}

export interface OperatingConditions {
  temperature: number;
  vibration: number;
  pressure: number;
  rpm: number;
  load: number;
  componentAge: number;
}

export interface RiskPrediction {
  risk: number;
  level: RiskLevel;
  contributors: Record<"temperature" | "vibration" | "pressure" | "rpm" | "load" | "age", number>;
  baseline: number;
  recommendation: string;
}

export interface SimulationResult {
  currentRisk: number;
  simulatedRisk: number;
  riskReduction: number;
  reductionLevel: "none" | "low" | "medium" | "high";
  recommendation: string;
}

export interface Alert {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "critical";
  title: string;
  description: string;
}

export interface Machine {
  id: string;
  name: string;
  line: string;
  status: "normal" | "warning" | "critical";
}
