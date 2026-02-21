from pydantic import BaseModel
from datetime import datetime


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


class PlanningMetrics(BaseModel):
    local_approval_rate: float          # 0.0 – 1.0
    avg_decision_time_days: float
    similar_applications_nearby: int


class MarketMetrics(BaseModel):
    avg_price_per_m2: float
    price_trend_24m: float              # decimal e.g. 0.05 = +5%
    avg_epc_rating: str                 # "A" – "G"


class MLPrediction(BaseModel):
    approval_probability: float         # 0.0 – 1.0


class ViabilityBreakdown(BaseModel):
    base_score: float
    constraint_penalty: float
    flood_penalty: float
    market_strength_bonus: float


class AnalyzeResponse(BaseModel):
    postcode: str
    location: Location
    constraints: Constraints
    planning_metrics: PlanningMetrics
    market_metrics: MarketMetrics
    ml_prediction: MLPrediction
    viability_score: float              # 0 – 100
    viability_breakdown: ViabilityBreakdown


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
    status: str
    model_loaded: bool
    db_connected: bool
