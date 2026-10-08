/**
 * REST client for the FastAPI backend. When VITE_API_BASE_URL is unset (default demo mode),
 * the app uses the in-browser mock AI services in src/lib/ai and the built-in /api routes.
 */
import type { OperatingConditions } from "@/types";

const BASE = (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  inspect: (image: File) => {
    const fd = new FormData();
    fd.append("image", image);
    return req("/api/inspect", { method: "POST", body: fd });
  },
  risk: (c: OperatingConditions) => req("/api/risk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) }),
  simulate: (current: OperatingConditions, simulated: OperatingConditions) =>
    req("/api/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current_conditions: current, simulated_conditions: simulated }) }),
  history: () => req("/api/history"),
  analytics: () => req("/api/analytics"),
  machineStatus: () => req("/api/machine-status"),
};
