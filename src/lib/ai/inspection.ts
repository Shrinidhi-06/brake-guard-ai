import type { BoundingBox, DefectType, Inspection, Severity } from "@/types";

/**
 * Prototype AI inspection engine (DEMO MODE).
 * Returns deterministic results derived from a chosen demo scenario or the file name/size.
 * No computer-vision model runs here — swap `analyzeImage` for a call to POST /api/inspect
 * backed by a real YOLO/vision model later.
 */
export type ScenarioKey = "pass" | "crack" | "corrosion" | "scratch" | "wear" | "hole";

export interface ScenarioResult {
  status: "pass" | "defect";
  defect: DefectType | null;
  severity: Severity;
  confidence: number;
  risk: number;
  explanation: string;
  action: string;
  recommendation: string;
  boxes: BoundingBox[];
}

export const SCENARIOS: Record<ScenarioKey, { label: string; result: ScenarioResult }> = {
  pass: {
    label: "PASS — No defect",
    result: {
      status: "pass",
      defect: null,
      severity: "none",
      confidence: 0.981,
      risk: 0.06,
      explanation:
        "No irregular patterns were found on the braking surface, hub or ventilation vanes. Surface texture is consistent with a uniformly machined rotor.",
      action: "APPROVE FOR ASSEMBLY",
      recommendation: "Component meets visual inspection criteria. Proceed to assembly.",
      boxes: [],
    },
  },
  crack: {
    label: "Surface Crack — High",
    result: {
      status: "defect",
      defect: "Surface Crack",
      severity: "high",
      confidence: 0.943,
      risk: 0.78,
      explanation:
        "The model detected an irregular linear pattern on the braking surface consistent with a surface crack. The defect is located near the outer braking region and may affect component reliability.",
      action: "QUARANTINE COMPONENT",
      recommendation: "Perform secondary inspection before assembly.",
      boxes: [{ x: 74, y: 33, w: 19, h: 14, label: "Surface Crack 94%" }],
    },
  },
  corrosion: {
    label: "Corrosion — Medium",
    result: {
      status: "defect",
      defect: "Corrosion",
      severity: "medium",
      confidence: 0.887,
      risk: 0.46,
      explanation:
        "Discoloured, granular regions with irregular boundaries were detected across the braking ring, consistent with surface oxidation (corrosion).",
      action: "HOLD FOR REWORK",
      recommendation: "Send for surface cleaning / re-machining and re-inspect.",
      boxes: [
        { x: 66, y: 18, w: 22, h: 22, label: "Corrosion 89%" },
        { x: 10, y: 48, w: 18, h: 22, label: "Corrosion 84%" },
      ],
    },
  },
  scratch: {
    label: "Scratch — Low",
    result: {
      status: "defect",
      defect: "Scratch",
      severity: "low",
      confidence: 0.862,
      risk: 0.17,
      explanation:
        "A shallow, short linear mark was detected on the braking surface. Depth indicators suggest a cosmetic scratch rather than structural damage.",
      action: "APPROVE WITH NOTE",
      recommendation: "Log the scratch and proceed. Re-check if the pattern recurs on this line.",
      boxes: [{ x: 18, y: 60, w: 16, h: 10, label: "Scratch 86%" }],
    },
  },
  wear: {
    label: "Uneven Wear — Medium",
    result: {
      status: "defect",
      defect: "Uneven Wear",
      severity: "medium",
      confidence: 0.904,
      risk: 0.52,
      explanation:
        "Concentric scoring with non-uniform intensity was detected, indicating uneven wear across the braking surface which may cause vibration under load.",
      action: "HOLD FOR REWORK",
      recommendation: "Measure thickness variation (DTV) and re-machine if outside tolerance.",
      boxes: [{ x: 58, y: 10, w: 30, h: 24, label: "Uneven Wear 90%" }],
    },
  },
  hole: {
    label: "Hole / Perforation — High",
    result: {
      status: "defect",
      defect: "Hole / Perforation",
      severity: "high",
      confidence: 0.928,
      risk: 0.79,
      explanation:
        "A physical opening with a clear boundary and a darker interior region (approximately circular/oval) was detected on the disc. This is classified as a hole / perforation rather than surface corrosion.",
      action: "REJECT / VERIFY DESIGN",
      recommendation: "Inspect the component for structural damage and replace/reject if the hole is unintended or outside the approved design specification.",
      boxes: [{ x: 68, y: 12, w: 16, h: 16, label: "Hole / Perforation 93%" }],
    },
  },
};

export function scenarioFromFile(name: string, size: number): ScenarioKey {
  const n = name.toLowerCase();
  if (/crack/.test(n)) return "crack";
  if (/rust|corros/.test(n)) return "corrosion";
  if (/scratch/.test(n)) return "scratch";
  if (/wear/.test(n)) return "wear";
  if (/hole|perforat/.test(n)) return "hole";
  if (/pass|good|ok|clean/.test(n)) return "pass";
  let h = size;
  for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const keys: ScenarioKey[] = ["pass", "crack", "corrosion", "scratch", "wear", "hole"];
  return keys[h % keys.length] ?? "pass";
}

export async function analyzeImage(scenario: ScenarioKey): Promise<ScenarioResult> {
  // Simulated latency handled by the UI's scanning sequence.
  return structuredClone(SCENARIOS[scenario].result);
}

export const ANALYSIS_STEPS = [
  "Preparing image...",
  "Detecting component...",
  "Analyzing surface...",
  "Checking defect patterns...",
  "Calculating severity...",
  "Generating recommendation...",
];

export type { Inspection };
