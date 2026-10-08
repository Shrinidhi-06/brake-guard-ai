from fastapi import APIRouter

from models.schemas import SimulateRequest, SimulateResponse
from services import risk_service

router = APIRouter(tags=["simulation"])


@router.post("/simulate", response_model=SimulateResponse)
def simulate(body: SimulateRequest):
    cur = risk_service.calculate(body.current_conditions)["risk"]
    sim = risk_service.calculate(body.simulated_conditions)["risk"]
    s = body.simulated_conditions
    tips = []
    if s.vibration > 3.2:
        tips.append(f"reduce vibration from {s.vibration} mm/s to approximately 3.0 mm/s")
    if s.temperature > 87:
        tips.append(f"lower temperature from {s.temperature}°C to approximately 85°C")
    rec = (" and ".join(tips).capitalize() + ".") if tips else "Simulated conditions are within the safe range."
    return {"current_risk": cur, "simulated_risk": sim, "risk_reduction": round(cur - sim, 3), "recommendation": rec}
