from fastapi import APIRouter

from models.schemas import Conditions, RiskResponse
from services import risk_service

router = APIRouter(tags=["risk"])


@router.post("/risk", response_model=RiskResponse)
def risk(c: Conditions):
    return risk_service.calculate(c)
