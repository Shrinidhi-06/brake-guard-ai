import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Term } from "@/components/common";
import { LIMITS, clamp } from "@/lib/ai/risk";

export function ConditionInput({ k, label, value, onChange, tip, hint }: { k: keyof typeof LIMITS; label: string; value: number; onChange: (v: number) => void; tip?: string; hint?: string }) {
  const lim = LIMITS[k];
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = () => {
    const n = Number(text);
    const v = Number.isFinite(n) && text.trim() !== "" ? clamp(n, lim.min, lim.max) : value;
    const rounded = Math.round(v / lim.step) * lim.step;
    const fixed = +rounded.toFixed(lim.step < 1 ? 1 : 0);
    onChange(fixed);
    setText(String(fixed));
  };
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="text-sm">{tip ? <Term tip={tip}>{label}</Term> : label}</label>
        <div className="flex items-center gap-1.5">
          <Input
            aria-label={label}
            inputMode="decimal"
            value={text}
            onChange={(e) => setText(e.target.value.replace(/[^0-9.]/g, ""))}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            className="num h-8 w-20 text-right"
          />
          <span className="w-9 text-xs text-muted-foreground">{lim.unit}</span>
        </div>
      </div>
      <Slider value={[value]} min={lim.min} max={lim.max} step={lim.step} onValueChange={([v = value]) => onChange(+v.toFixed(lim.step < 1 ? 1 : 0))} />
      <div className="num mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{lim.min}</span>{hint && <span>{hint}</span>}<span>{lim.max}</span>
      </div>
    </div>
  );
}

export const TIPS = {
  temperature: "Braking-surface temperature measured by an IR sensor during machining.",
  vibration: "RMS vibration velocity at the spindle. Higher values often indicate imbalance or tool wear.",
  pressure: "Hydraulic clamping pressure holding the rotor during machining.",
  rpm: "Spindle revolutions per minute.",
  load: "Spindle motor load as a percentage of rated capacity.",
  componentAge: "Hours of operation since the tooling/fixture was last serviced.",
};
