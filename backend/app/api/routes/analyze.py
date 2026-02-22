from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.middleware.auth import verify_jwt
from app.db.database import get_pool
from app.services.geocoding import geocode_postcode
from app.services.constraints import get_constraints
from app.services.planning import get_planning_metrics
from app.services.market import get_market_metrics
from app.services.ml import predict_approval
from app.services.viability import compute_viability
from app.services.schools import get_nearby_schools
from app.schemas.models import (
    AnalyzeResponse, Location, Constraints,
    PlanningMetrics, MarketMetrics, MLPrediction, ViabilityBreakdown, NearbySchool,
    ProjectParams, ApplicationType, PropertyType,
)
from app import cache
import asyncio

router = APIRouter()


@router.get("/analyze", response_model=AnalyzeResponse)
async def analyze(
    postcode: str = Query(..., description="UK postcode e.g. SW1A 1AA"),
    # ── Project parameters ──
    application_type: ApplicationType = Query(ApplicationType.extension, description="Type of planning application"),
    property_type: PropertyType = Query(PropertyType.semi_detached, description="Type of property"),
    num_storeys: int = Query(1, ge=1, le=5, description="Number of storeys (1-5)"),
    estimated_floor_area_m2: float = Query(30.0, ge=1, le=10000, description="Estimated floor area in m²"),
    # ── Optional manual overrides for model features ──
    # When provided, the manual value is used instead of the DB-fetched value.
    manual_flood_zone: Optional[int] = Query(None, ge=1, le=3, description="Override flood zone (1-3)"),
    manual_conservation: Optional[bool] = Query(None, description="Override conservation area flag"),
    manual_greenbelt: Optional[bool] = Query(None, description="Override greenbelt flag"),
    manual_article4: Optional[bool] = Query(None, description="Override Article 4 zone flag"),
    manual_approval_rate: Optional[float] = Query(None, ge=0, le=1, description="Override local approval rate (0-1)"),
    manual_decision_days: Optional[float] = Query(None, ge=0, description="Override avg decision time (days)"),
    manual_nearby_apps: Optional[int] = Query(None, ge=0, description="Override similar applications nearby count"),
    manual_price_m2: Optional[float] = Query(None, ge=0, description="Override avg price per m²"),
    manual_price_trend: Optional[float] = Query(None, ge=-1, le=10, description="Override 24-month price trend"),
    manual_epc: Optional[str] = Query(None, pattern="^[A-Ga-g]$", description="Override avg EPC rating (A-G)"),
    _token: dict = Depends(verify_jwt),
):
    # 1. Geocode
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

    # 2. Fetch constraints, planning metrics, market metrics, and schools concurrently
    try:
        constraints_data, planning_data, market_data, schools_data = await asyncio.gather(
            get_constraints(pool, geo.lat, geo.lon),
            get_planning_metrics(pool, geo.lat, geo.lon),
            get_market_metrics(pool, geo.lat, geo.lon, postcode),
            get_nearby_schools(geo.lat, geo.lon),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data fetch error: {e}")

    # 3. Apply manual overrides (fallback to DB-fetched values)
    flood_zone = manual_flood_zone if manual_flood_zone is not None else constraints_data["flood_zone"]
    in_conservation_area = manual_conservation if manual_conservation is not None else constraints_data["in_conservation_area"]
    in_greenbelt = manual_greenbelt if manual_greenbelt is not None else constraints_data["in_greenbelt"]
    in_article4_zone = manual_article4 if manual_article4 is not None else constraints_data["in_article4_zone"]

    local_approval_rate = manual_approval_rate if manual_approval_rate is not None else planning_data["local_approval_rate"]
    avg_decision_time_days = manual_decision_days if manual_decision_days is not None else planning_data["avg_decision_time_days"]
    similar_applications_nearby = manual_nearby_apps if manual_nearby_apps is not None else planning_data["similar_applications_nearby"]

    avg_price_per_m2 = manual_price_m2 if manual_price_m2 is not None else market_data["avg_price_per_m2"]
    price_trend_24m = manual_price_trend if manual_price_trend is not None else market_data["price_trend_24m"]
    avg_epc_rating = manual_epc.upper() if manual_epc is not None else market_data["avg_epc_rating"]

    # Update data dicts so downstream response objects reflect overrides
    constraints_data = {
        "flood_zone": flood_zone,
        "in_conservation_area": in_conservation_area,
        "in_greenbelt": in_greenbelt,
        "in_article4_zone": in_article4_zone,
    }
    planning_data["local_approval_rate"] = local_approval_rate
    planning_data["avg_decision_time_days"] = avg_decision_time_days
    planning_data["similar_applications_nearby"] = similar_applications_nearby
    market_data["avg_price_per_m2"] = avg_price_per_m2
    market_data["price_trend_24m"] = price_trend_24m
    market_data["avg_epc_rating"] = avg_epc_rating

    # 4. ML prediction
    project = ProjectParams(
        application_type=application_type,
        property_type=property_type,
        num_storeys=num_storeys,
        estimated_floor_area_m2=estimated_floor_area_m2,
    )

    approval_prob = predict_approval(
        flood_zone=flood_zone,
        in_conservation_area=in_conservation_area,
        in_greenbelt=in_greenbelt,
        in_article4_zone=in_article4_zone,
        local_approval_rate=local_approval_rate,
        avg_decision_time_days=avg_decision_time_days,
        similar_applications_nearby=similar_applications_nearby,
        avg_price_per_m2=avg_price_per_m2,
        price_trend_24m=price_trend_24m,
        avg_epc_rating=avg_epc_rating,
        application_type=application_type.value,
        property_type=property_type.value,
        num_storeys=num_storeys,
        estimated_floor_area_m2=estimated_floor_area_m2,
    )

    # 5. Viability score
    viability_score, viability_breakdown = compute_viability(
        approval_probability=approval_prob,
        flood_zone=flood_zone,
        in_conservation_area=in_conservation_area,
        in_greenbelt=in_greenbelt,
        in_article4_zone=in_article4_zone,
        avg_price_per_m2=avg_price_per_m2,
        price_trend_24m=price_trend_24m,
        application_type=application_type.value,
        num_storeys=num_storeys,
        estimated_floor_area_m2=estimated_floor_area_m2,
    )

    result = AnalyzeResponse(
        postcode=postcode.upper().strip(),
        project_params=project,
        location=Location(
            lat=geo.lat,
            lon=geo.lon,
            district=geo.district,
            ward=geo.ward,
        ),
        constraints=Constraints(**constraints_data),
        planning_metrics=PlanningMetrics(**planning_data),
        market_metrics=MarketMetrics(**market_data),
        ml_prediction=MLPrediction(approval_probability=approval_prob),
        viability_score=viability_score,
        viability_breakdown=ViabilityBreakdown(**viability_breakdown),
        nearby_schools=[NearbySchool(**s) for s in schools_data],
    )

    # Cache for /report to reuse without re-running the pipeline
    cache.set_analysis(postcode, result)
    return result
