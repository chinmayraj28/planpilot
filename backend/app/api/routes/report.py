from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timezone
from app.middleware.auth import verify_jwt
from app.services.geocoding import geocode_postcode
from app.services.constraints import get_constraints
from app.services.planning import get_planning_metrics
from app.services.market import get_market_metrics
from app.services.ml import predict_approval
from app.services.viability import compute_viability
from app.services.gemini import generate_report
from app.schemas.models import (
    AnalyzeResponse, Location, Constraints, PlanningMetrics,
    MarketMetrics, MLPrediction, ViabilityBreakdown,
    ReportResponse, PlanningReport, ProjectParams,
    ApplicationType, PropertyType,
)
from app.db.database import get_pool
from app import cache
import asyncio

router = APIRouter()


async def _run_analysis(postcode: str) -> AnalyzeResponse:
    """Run the full analysis pipeline. Used as fallback when cache misses."""
    try:
        geo = await geocode_postcode(postcode)
    except ValueError:
        raise HTTPException(
            status_code=404,
            detail=f"We couldn't find the postcode '{postcode}'. Please check it's a valid UK postcode and try again.",
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Geocoding service error: {e}")

    pool = await get_pool()

    try:
        constraints_data, planning_data, market_data = await asyncio.gather(
            get_constraints(pool, geo.lat, geo.lon),
            get_planning_metrics(pool, geo.lat, geo.lon),
            get_market_metrics(pool, geo.lat, geo.lon, postcode),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data fetch error: {e}")

    # Use default project params for fallback analysis
    default_params = ProjectParams()

    approval_prob = predict_approval(
        flood_zone=constraints_data["flood_zone"],
        in_conservation_area=constraints_data["in_conservation_area"],
        in_greenbelt=constraints_data["in_greenbelt"],
        in_article4_zone=constraints_data["in_article4_zone"],
        local_approval_rate=planning_data["local_approval_rate"],
        avg_decision_time_days=planning_data["avg_decision_time_days"],
        similar_applications_nearby=planning_data["similar_applications_nearby"],
        avg_price_per_m2=market_data["avg_price_per_m2"],
        price_trend_24m=market_data["price_trend_24m"],
        avg_epc_rating=market_data["avg_epc_rating"],
        application_type=default_params.application_type.value,
        property_type=default_params.property_type.value,
        num_storeys=default_params.num_storeys,
        estimated_floor_area_m2=default_params.estimated_floor_area_m2,
    )

    viability_score, viability_breakdown = compute_viability(
        approval_probability=approval_prob,
        flood_zone=constraints_data["flood_zone"],
        in_conservation_area=constraints_data["in_conservation_area"],
        in_greenbelt=constraints_data["in_greenbelt"],
        in_article4_zone=constraints_data["in_article4_zone"],
        avg_price_per_m2=market_data["avg_price_per_m2"],
        price_trend_24m=market_data["price_trend_24m"],
        application_type=default_params.application_type.value,
        num_storeys=default_params.num_storeys,
        estimated_floor_area_m2=default_params.estimated_floor_area_m2,
    )

    return AnalyzeResponse(
        postcode=postcode.upper().strip(),
        project_params=default_params,
        location=Location(lat=geo.lat, lon=geo.lon, district=geo.district, ward=geo.ward),
        constraints=Constraints(**constraints_data),
        planning_metrics=PlanningMetrics(**planning_data),
        market_metrics=MarketMetrics(**market_data),
        ml_prediction=MLPrediction(approval_probability=approval_prob),
        viability_score=viability_score,
        viability_breakdown=ViabilityBreakdown(**viability_breakdown),
    )


@router.get("/report", response_model=ReportResponse)
async def report(
    postcode: str = Query(..., description="UK postcode e.g. SW1A 1AA"),
    _token: dict = Depends(verify_jwt),
):
    # Use cached analysis from /analyze if available (normal frontend flow).
    # Fall back to running the full pipeline if called independently.
    analysis = cache.get_analysis(postcode) or await _run_analysis(postcode)

    report_data = await generate_report(analysis)

    return ReportResponse(
        postcode=postcode.upper().strip(),
        report=PlanningReport(**report_data),
        generated_at=datetime.now(timezone.utc),
    )
