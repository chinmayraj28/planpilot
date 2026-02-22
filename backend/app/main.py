from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.database import get_pool, close_pool
from app.services.ml import load_model
from app.api.routes import analyze, report, health, upload


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await get_pool()
    load_model()
    yield
    # Shutdown
    await close_pool()


app = FastAPI(
    title="PlanPilot AI",
    version="1.0.0",
    description="UK Planning Intelligence Platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1")
app.include_router(analyze.router, prefix="/api/v1")
app.include_router(report.router, prefix="/api/v1")
app.include_router(upload.router, prefix="/api/v1")
