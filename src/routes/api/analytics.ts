import { createFileRoute } from "@tanstack/react-router";
import { analyticsFor, type RangeKey } from "@/lib/mock/data";
import { json } from "@/lib/api/schemas";

export const Route = createFileRoute("/api/analytics")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const r = new URL(request.url).searchParams.get("range");
        const range: RangeKey = r === "today" || r === "7d" ? r : "30d";
        return json({ range, ...analyticsFor(range), source: "demo-dataset" });
      },
    },
  },
});
