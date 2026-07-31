from fastapi import APIRouter, Depends

from app.ai_service import clean_up_strokes
from app.deps import get_current_user
from app.models import User
from app.schemas import CleanUpRequest, CleanUpResponse

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/clean-up", response_model=CleanUpResponse)
async def clean_up(payload: CleanUpRequest, user: User = Depends(get_current_user)):
    shapes, engine = await clean_up_strokes(payload)
    return CleanUpResponse(shapes=shapes, engine=engine)
