import { describe, expect, it } from "vitest";
import { DEFAULT_CONDITIONS, calculateRisk } from "@/lib/ai/risk";
import { SIM_CURRENT, simulate } from "@/lib/ai/simulation";
import { SCENARIOS } from "@/lib/ai/inspection";

describe("prototype risk model", () => {
  it("dashboard / risk page default conditions give 18.4% low risk", () => {
    const p = calculateRisk(DEFAULT_CONDITIONS);
    expect(+(p.risk * 100).toFixed(1)).toBe(18.4);
    expect(p.level).toBe("low");
  });

  it("simulator current conditions give 78% risk", () => {
    expect(Math.round(calculateRisk(SIM_CURRENT).risk * 100)).toBe(78);
  });

  it("temperature 85°C and vibration 3.0 mm/s simulate to 21% (57 point reduction)", () => {
    const r = simulate(SIM_CURRENT, { ...SIM_CURRENT, temperature: 85, vibration: 3.0 });
    expect(Math.round(r.simulatedRisk * 100)).toBe(21);
    expect(Math.round(r.riskReduction * 100)).toBe(57);
    expect(r.reductionLevel).toBe("high");
  });

  it("clamps impossible sensor values", () => {
    const p = calculateRisk({ ...DEFAULT_CONDITIONS, vibration: 999 });
    expect(p.risk).toBeLessThanOrEqual(0.99);
  });

  it("surface crack demo returns 94.3% confidence, 78% risk, high severity", () => {
    const r = SCENARIOS.crack.result;
    expect(r.confidence).toBe(0.943);
    expect(r.risk).toBe(0.78);
    expect(r.severity).toBe("high");
  });
});
