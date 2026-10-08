"""Inspection service. DEMO_MODE returns deterministic scenarios.

To plug in a real model (e.g. YOLOv8), implement `run_model(image_bytes)` and set DEMO_MODE=false.
"""
import os
import zlib

SCENARIOS = {
    "pass": dict(status="pass", defect=None, severity="none", confidence=0.981, risk=0.06, recommendation="Approve for assembly", boxes=[]),
    "crack": dict(status="defect", defect="Surface Crack", severity="high", confidence=0.943, risk=0.78, recommendation="Quarantine component",
                  boxes=[dict(x=74, y=33, w=19, h=14, label="Surface Crack 94%")]),
    "corrosion": dict(status="defect", defect="Corrosion", severity="medium", confidence=0.887, risk=0.46, recommendation="Hold for rework",
                      boxes=[dict(x=66, y=18, w=22, h=22, label="Corrosion 89%")]),
    "scratch": dict(status="defect", defect="Scratch", severity="low", confidence=0.862, risk=0.17, recommendation="Approve with note",
                    boxes=[dict(x=18, y=60, w=16, h=10, label="Scratch 86%")]),
    "wear": dict(status="defect", defect="Uneven Wear", severity="medium", confidence=0.904, risk=0.52, recommendation="Hold for rework",
                 boxes=[dict(x=58, y=10, w=30, h=24, label="Uneven Wear 90%")]),
    "hole": dict(status="defect", defect="Hole / Perforation", severity="critical", confidence=0.928, risk=0.95,
                 recommendation="Inspect the component for structural damage and replace/reject if the hole is unintended or outside the approved design specification.",
                 boxes=[dict(x=68, y=12, w=16, h=16, label="Hole / Perforation 93%")]),
}


def pick_scenario(filename: str, data: bytes) -> str:
    n = (filename or "").lower()
    for key, words in (("crack", ["crack"]), ("corrosion", ["rust", "corros"]), ("scratch", ["scratch"]), ("wear", ["wear"]), ("hole", ["hole", "perforat"]), ("pass", ["pass", "good", "clean"])):
        if any(w in n for w in words):
            return key
    return list(SCENARIOS)[zlib.crc32(data) % len(SCENARIOS)]


def run_model(image_bytes: bytes) -> dict:  # pragma: no cover - placeholder for a real model
    raise NotImplementedError("Connect a trained vision model here and set DEMO_MODE=false")


def inspect(filename: str, data: bytes) -> dict:
    if os.getenv("DEMO_MODE", "true") == "true":
        return {**SCENARIOS[pick_scenario(filename, data)], "engine": "prototype-demo"}
    return run_model(data)
