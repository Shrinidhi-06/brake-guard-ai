"""Demo dataset. Replace with PostgreSQL / Lovable Cloud queries later."""

HISTORY = [
    {"id": "INS-2040", "component_id": "BD-10284", "time": "11:42", "status": "pass", "defect": None, "severity": "none", "confidence": 0.981},
    {"id": "INS-2039", "component_id": "BD-10283", "time": "11:38", "status": "defect", "defect": "Surface Crack", "severity": "high", "confidence": 0.943},
    {"id": "INS-2038", "component_id": "BD-10282", "time": "11:34", "status": "pass", "defect": None, "severity": "none", "confidence": 0.978},
]

ANALYTICS = {
    "total": 1284, "defects": 86, "critical": 7, "avg_confidence": 0.918,
    "by_type": {"Surface Crack": 21, "Scratch": 28, "Corrosion": 15, "Uneven Wear": 16, "Other": 6},
    "source": "demo-dataset",
}

MACHINE = {
    "machine": {"id": "line-a", "name": "Brake Disc Production Line A", "status": "monitoring"},
    "sensors": {"temperature": 82, "vibration": 2.8, "pressure": 5.2, "rpm": 1420, "load": 67},
    "risk": 0.184, "level": "low", "source": "simulated-sensors",
}
