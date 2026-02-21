from fastapi import APIRouter
from app.db.database import get_pool
from app.services.ml import is_model_loaded
from app.schemas.models import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health():
    db_connected = False
    try:
        pool = await get_pool()
        await pool.fetchval("SELECT 1")
        db_connected = True
    except Exception:
        pass

    return HealthResponse(
        status="ok" if db_connected else "degraded",
        model_loaded=is_model_loaded(),
        db_connected=db_connected,
    )
