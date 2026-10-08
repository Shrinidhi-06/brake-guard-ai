from fastapi import APIRouter

from services.mock_data import HISTORY

router = APIRouter(tags=["history"])


@router.get("/history")
def history():
    return {"items": HISTORY, "source": "demo-dataset"}
