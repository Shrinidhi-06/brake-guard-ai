import type { OperatingConditions, SimulationResult } from "@/types";
import { calculateRisk } from "./risk";

/** Prototype predictive simulation — uses the same deterministic risk formula. */
export const SIM_CURRENT: OperatingConditions = {
  temperature: 102,
  vibration: 7.4,
  pressure: 5.8,
  rpm: 1620,
  load: 67,
  componentAge: 18,
};

export function simulate(current: OperatingConditions, simulated: OperatingConditions): SimulationResult {
  const currentRisk = calculateRisk(current).risk;
  const simulatedRisk = calculateRisk(simulated).risk;
  const riskReduction = currentRisk - simulatedRisk;
  const pts = riskReduction * 100;
  const reductionLevel = pts >= 40 ? "high" : pts >= 20 ? "medium" : pts > 2 ? "low" : "none";

  const tips: string[] = [];
  if (simulated.vibration > 3.2) tips.push(`reduce vibration from ${simulated.vibration.toFixed(1)} mm/s to approximately 3.0 mm/s`);
  if (simulated.temperature > 87) tips.push(`lower temperature from ${simulated.temperature}°C to approximately 85°C`);
  if (simulated.rpm > 1500 && tips.length > 0) tips.push(`reduce spindle speed toward 1,420 RPM`);
  if (tips.length === 0 && simulated.vibration < current.vibration && simulated.temperature < current.temperature) {
    return {
      currentRisk, simulatedRisk, riskReduction, reductionLevel,
      recommendation: `Reduce vibration from ${current.vibration.toFixed(1)} mm/s to approximately ${simulated.vibration.toFixed(1)} mm/s and lower temperature to approximately ${simulated.temperature}°C.`,
    };
  }
  if (Math.abs(simulated.pressure - 5.8) > 0.6) tips.push(`bring pressure back toward 5.8 bar`);

  let recommendation: string;
  if (tips.length === 0) {
    recommendation =
      riskReduction > 0
        ? `Apply the simulated settings: vibration ${current.vibration.toFixed(1)} → ${simulated.vibration.toFixed(1)} mm/s and temperature ${current.temperature}°C → ${simulated.temperature}°C. Simulated conditions are within the safe range.`
        : "Simulated conditions do not reduce risk. Reduce vibration to approximately 3.0 mm/s and lower temperature to approximately 85°C.";
  } else {
    const s = tips.join(" and ");
    recommendation = s.charAt(0).toUpperCase() + s.slice(1) + ".";
  }
  return { currentRisk, simulatedRisk, riskReduction, reductionLevel, recommendation };
}
