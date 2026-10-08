from fastapi import APIRouter

from services.mock_data import MACHINE

router = APIRouter(tags=["machine"])


@router.get("/machine-status")
def machine_status():
    return MACHINE
