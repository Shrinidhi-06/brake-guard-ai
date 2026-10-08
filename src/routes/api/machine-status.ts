import { createFileRoute } from "@tanstack/react-router";
import { DEFAULT_CONDITIONS, calculateRisk } from "@/lib/ai/risk";
import { json } from "@/lib/api/schemas";

export const Route = createFileRoute("/api/machine-status")({
  server: {
    handlers: {
      GET: async () => {
        const p = calculateRisk(DEFAULT_CONDITIONS);
        return json({
          machine: { id: "line-a", name: "Brake Disc Production Line A", status: "monitoring" },
          sensors: DEFAULT_CONDITIONS,
          risk: +p.risk.toFixed(3),
          level: p.level,
          source: "simulated-sensors",
        });
      },
    },
  },
});
