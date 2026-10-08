from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class Conditions(BaseModel):
    temperature: float = Field(..., ge=20, le=140)
    vibration: float = Field(..., ge=0, le=12)
    pressure: float = Field(..., ge=2, le=9)
    rpm: float = Field(..., ge=600, le=2400)
    load: float = Field(67, ge=0, le=100)
    component_age: float = Field(18, ge=0, le=500)


class Box(BaseModel):
    x: float
    y: float
    w: float
    h: float
    label: str


class InspectResponse(BaseModel):
    status: Literal["pass", "defect"]
    defect: Optional[str]
    severity: Literal["none", "low", "medium", "high", "critical"]
    confidence: float
    risk: float
    recommendation: str
    boxes: List[Box] = []
    engine: str = "prototype-demo"


class RiskResponse(BaseModel):
    risk: float
    level: Literal["low", "medium", "high", "critical"]
    contributors: Dict[str, float]
    recommendation: str


class SimulateRequest(BaseModel):
    current_conditions: Conditions
    simulated_conditions: Conditions


class SimulateResponse(BaseModel):
    current_risk: float
    simulated_risk: float
    risk_reduction: float
    recommendation: str
