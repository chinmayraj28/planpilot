from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from enum import Enum


class ApplicationType(str, Enum):
    extension = "extension"
    new_build = "new_build"
    loft_conversion = "loft_conversion"
    change_of_use = "change_of_use"
    listed_building = "listed_building"
    demolition = "demolition"
    other = "other"


class PropertyType(str, Enum):
    detached = "detached"
    semi_detached = "semi_detached"
    terraced = "terraced"
    flat = "flat"
    commercial = "commercial"
    land = "land"


class ProjectParams(BaseModel):
    """User-provided project parameters for personalised prediction."""
    application_type: ApplicationType = ApplicationType.extension
    property_type: PropertyType = PropertyType.semi_detached
    num_storeys: int = 1              # 1, 2, or 3+
    estimated_floor_area_m2: float = 30.0  # m²


class Location(BaseModel):
    lat: float
    lon: float
    district: str
    ward: str


class Constraints(BaseModel):
    flood_zone: int          # 1, 2, or 3
    in_conservation_area: bool
    in_greenbelt: bool
    in_article4_zone: bool


class RecentApplication(BaseModel):
    reference: str
    postcode: str
    decision: str                       # 'approved' | 'refused'
    decision_date: str                  # ISO date string
    application_type: str


class PlanningMetrics(BaseModel):
    local_approval_rate: float          # 0.0 – 1.0
    avg_decision_time_days: float
    similar_applications_nearby: int
    recent_applications: list[RecentApplication]


class ComparableSale(BaseModel):
    postcode: str
    price: float
    sale_date: str                      # ISO date string e.g. "2024-03-15"


class MarketMetrics(BaseModel):
    avg_price_per_m2: float
    price_trend_24m: float              # decimal e.g. 0.05 = +5%
    avg_epc_rating: str                 # "A" – "G"
    comparable_sales: list[ComparableSale]


class NearbySchool(BaseModel):
    name: str
    type: str               # Primary / Secondary / All-through / Sixth Form
    ofsted_rating: str      # Outstanding / Good / Requires Improvement / Inadequate
    distance_m: int


class MLPrediction(BaseModel):
    approval_probability: float         # 0.0 – 1.0


class ViabilityBreakdown(BaseModel):
    base_score: float
    constraint_penalty: float
    flood_penalty: float
    market_strength_bonus: float
    project_complexity_penalty: float = 0


class AnalyzeResponse(BaseModel):
    postcode: str
    project_params: ProjectParams
    location: Location
    constraints: Constraints
    planning_metrics: PlanningMetrics
    market_metrics: MarketMetrics
    ml_prediction: MLPrediction
    viability_score: float              # 0 – 100
    viability_breakdown: ViabilityBreakdown
    nearby_schools: list[NearbySchool]


class PlanningReport(BaseModel):
    overall_outlook: str
    key_risks: list[str]
    strategic_recommendation: str
    risk_mitigation: list[str]


class ReportResponse(BaseModel):
    postcode: str
    report: PlanningReport
    generated_at: datetime


class HealthResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    status: str
    model_loaded: bool
    db_connected: bool
