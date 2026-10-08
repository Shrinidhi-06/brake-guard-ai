import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { simulate } from "@/lib/ai/simulation";
import { conditionsSchema, json, toConditions } from "@/lib/api/schemas";

const body = z.object({ current_conditions: conditionsSchema, simulated_conditions: conditionsSchema });

export const Route = createFileRoute("/api/simulate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = body.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) return json({ error: parsed.error.flatten() }, 422);
        const r = simulate(toConditions(parsed.data.current_conditions), toConditions(parsed.data.simulated_conditions));
        return json({
          current_risk: +r.currentRisk.toFixed(3),
          simulated_risk: +r.simulatedRisk.toFixed(3),
          risk_reduction: +r.riskReduction.toFixed(3),
          recommendation: r.recommendation,
          engine: "prototype-simulation",
        });
      },
    },
  },
});
