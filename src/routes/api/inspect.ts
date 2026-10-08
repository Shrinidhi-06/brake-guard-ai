import { createFileRoute } from "@tanstack/react-router";
import { SCENARIOS, scenarioFromFile } from "@/lib/ai/inspection";
import { json } from "@/lib/api/schemas";

export const Route = createFileRoute("/api/inspect")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData().catch(() => null);
        const image = form?.get("image");
        if (!image || typeof image === "string") return json({ error: "image file is required" }, 400);
        if (!["image/jpeg", "image/png", "image/jpg"].includes(image.type)) return json({ error: "JPG or PNG only" }, 415);
        if (image.size > 10 * 1024 * 1024) return json({ error: "max 10 MB" }, 413);
        const r = SCENARIOS[scenarioFromFile(image.name, image.size)].result;
        return json({
          status: r.status,
          defect: r.defect,
          severity: r.severity,
          confidence: r.confidence,
          risk: r.risk,
          recommendation: r.action.charAt(0) + r.action.slice(1).toLowerCase(),
          boxes: r.boxes,
          engine: "prototype-demo",
        });
      },
    },
  },
});
