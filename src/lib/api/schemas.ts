import { z } from "zod";
import { LIMITS } from "@/lib/ai/risk";

const num = (k: keyof typeof LIMITS) => z.coerce.number().min(LIMITS[k].min).max(LIMITS[k].max);

export const conditionsSchema = z.object({
  temperature: num("temperature"),
  vibration: num("vibration"),
  pressure: num("pressure"),
  rpm: num("rpm"),
  load: num("load").default(67),
  component_age: num("componentAge").default(18),
});

export const toConditions = (c: z.infer<typeof conditionsSchema>) => ({
  temperature: c.temperature, vibration: c.vibration, pressure: c.pressure, rpm: c.rpm, load: c.load, componentAge: c.component_age,
});

export const json = (data: unknown, status = 200) => Response.json(data, { status });
