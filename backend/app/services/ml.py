import joblib
import numpy as np
from pathlib import Path

_model = None
MODEL_PATH = Path(__file__).parent.parent.parent / "ml" / "planning_model.pkl"

# Risk multipliers for user-provided project parameters
_APP_TYPE_RISK = {
    "extension": 0.0,
    "loft_conversion": -0.02,
    "new_build": -0.08,
    "change_of_use": -0.06,
    "listed_building": -0.12,
    "demolition": -0.10,
    "other": -0.04,
}

_PROPERTY_TYPE_RISK = {
    "detached": 0.02,
    "semi_detached": 0.0,
    "terraced": -0.01,
    "flat": -0.03,
    "commercial": -0.05,
    "land": 0.01,
}


def load_model():
    global _model
    if MODEL_PATH.exists():
        _model = joblib.load(MODEL_PATH)


def is_model_loaded() -> bool:
    return _model is not None


def predict_approval(
    flood_zone: int,
    in_conservation_area: bool,
    in_greenbelt: bool,
    in_article4_zone: bool,
    local_approval_rate: float,
    avg_decision_time_days: float,
    similar_applications_nearby: int,
    avg_price_per_m2: float,
    price_trend_24m: float,
    avg_epc_rating: str,
    # User-provided project parameters
    application_type: str = "extension",
    property_type: str = "semi_detached",
    num_storeys: int = 1,
    estimated_floor_area_m2: float = 30.0,
) -> float:
    """
    Build the feature vector and return the XGBoost approval probability.
    Falls back to a rule-based estimate if the model is not yet trained.
    User project parameters adjust the final probability.
    """
    epc_map = {"A": 7, "B": 6, "C": 5, "D": 4, "E": 3, "F": 2, "G": 1, "N/A": 4}
    epc_score = epc_map.get(avg_epc_rating, 4)

    features = np.array([[
        flood_zone,
        int(in_conservation_area),
        int(in_greenbelt),
        int(in_article4_zone),
        local_approval_rate,
        avg_decision_time_days,
        similar_applications_nearby,
        avg_price_per_m2,
        price_trend_24m,
        epc_score,
    ]])

    if _model is not None:
        prob = float(_model.predict_proba(features)[0][1])
    else:
        # Rule-based fallback until model is trained
        prob = local_approval_rate
        if flood_zone == 3:
            prob -= 0.15
        elif flood_zone == 2:
            prob -= 0.07
        if in_conservation_area:
            prob -= 0.10
        if in_greenbelt:
            prob -= 0.12
        if in_article4_zone:
            prob -= 0.08

    # ── Apply user project parameter adjustments ──
    # Application type risk
    prob += _APP_TYPE_RISK.get(application_type, 0.0)

    # Property type risk
    prob += _PROPERTY_TYPE_RISK.get(property_type, 0.0)

    # Storey penalty: each storey above 1 reduces probability
    if num_storeys > 1:
        prob -= (num_storeys - 1) * 0.04

    # Floor area penalty: large projects attract more scrutiny
    if estimated_floor_area_m2 > 50:
        prob -= min(0.10, (estimated_floor_area_m2 - 50) / 500)

    # Conservation + listed building is extremely strict
    if in_conservation_area and application_type == "listed_building":
        prob -= 0.08

    prob = max(0.0, min(1.0, prob))

    return round(prob, 4)
