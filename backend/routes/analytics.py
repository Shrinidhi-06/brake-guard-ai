from fastapi import APIRouter

from services.mock_data import ANALYTICS

router = APIRouter(tags=["analytics"])


@router.get("/analytics")
def analytics():
    return ANALYTICS
