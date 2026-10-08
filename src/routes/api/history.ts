import { createFileRoute } from "@tanstack/react-router";
import { SEED_INSPECTIONS } from "@/lib/mock/data";
import { json } from "@/lib/api/schemas";

export const Route = createFileRoute("/api/history")({
  server: {
    handlers: {
      GET: async () => json({ items: SEED_INSPECTIONS.map(({ image: _i, ...r }) => r), source: "demo-dataset" }),
    },
  },
});
