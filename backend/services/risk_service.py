"""Prototype risk formula — mirrors src/lib/ai/risk.ts exactly. Not a validated model."""
from models.schemas import Conditions

W = {"temperature": 0.2947, "vibration": 0.42, "pressure": 0.1155, "rpm": 0.1, "load": 0.15, "age": 0.2}
BASELINE = 0.0688


def level(r: float) -> str:
    return "critical" if r >= 0.8 else "high" if r >= 0.6 else "medium" if r >= 0.3 else "low"


def calculate(c: Conditions) -> dict:
    contributors = {
        "temperature": W["temperature"] * max(0, (c.temperature - 82) / 25),
        "vibration": W["vibration"] * max(0, (c.vibration - 2.8) / 5),
        "pressure": W["pressure"] * abs(c.pressure - 5.8) / 1.5,
        "rpm": W["rpm"] * max(0, (c.rpm - 1420) / 1000),
        "load": W["load"] * max(0, (c.load - 50) / 50),
        "age": W["age"] * (c.component_age / 200),
    }
    risk = min(0.99, max(0.02, BASELINE + sum(contributors.values())))
    lvl = level(risk)
    top = max(contributors, key=contributors.get)
    rec = (
        "Operating conditions are currently within acceptable limits. Continue monitoring."
        if lvl == "low"
        else f"High {top} is the primary contributor to current risk. Reduce {top} and inspect the component before continuing production."
    )
    return {"risk": round(risk, 3), "level": lvl, "contributors": {k: round(v, 4) for k, v in contributors.items()}, "recommendation": rec}
