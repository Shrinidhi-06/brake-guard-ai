from fastapi import APIRouter, File, HTTPException, UploadFile

from models.schemas import InspectResponse
from services import inspection_service

router = APIRouter(tags=["inspection"])


@router.post("/inspect", response_model=InspectResponse)
async def inspect(image: UploadFile = File(...)):
    if image.content_type not in ("image/jpeg", "image/png", "image/jpg"):
        raise HTTPException(415, "JPG or PNG only")
    data = await image.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(413, "Max 10 MB")
    return inspection_service.inspect(image.filename or "", data)
