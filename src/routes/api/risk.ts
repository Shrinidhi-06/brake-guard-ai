import { createFileRoute } from "@tanstack/react-router";
import { calculateRisk } from "@/lib/ai/risk";
import { conditionsSchema, json, toConditions } from "@/lib/api/schemas";

export const Route = createFileRoute("/api/risk")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = conditionsSchema.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) return json({ error: parsed.error.flatten() }, 422);
        const p = calculateRisk(toConditions(parsed.data));
        return json({ risk: +p.risk.toFixed(3), level: p.level, contributors: p.contributors, recommendation: p.recommendation, engine: "prototype-formula" });
      },
    },
  },
});
