def compute_viability(
    approval_probability: float,
    flood_zone: int,
    in_conservation_area: bool,
    in_greenbelt: bool,
    in_article4_zone: bool,
    avg_price_per_m2: float,
    price_trend_24m: float,
    application_type: str = "extension",
    num_storeys: int = 1,
    estimated_floor_area_m2: float = 30.0,
) -> tuple[float, dict]:
    """
    Compute viability score (0–100) and return the breakdown.

    Formula:
        base_score          = approval_probability * 80   (max 80)
        market_bonus        = price + trend bonus up to 20
        constraint_penalty  = sum of constraint deductions
        flood_penalty       = flood zone deduction
        project_penalty     = deductions based on project complexity
    Max possible: ~100 (high approval, no constraints, strong market, simple project)
    """
    base_score = approval_probability * 80

    constraint_penalty = 0.0
    if in_conservation_area:
        constraint_penalty += 8
    if in_greenbelt:
        constraint_penalty += 10
    if in_article4_zone:
        constraint_penalty += 5

    flood_penalty = 0.0
    if flood_zone == 3:
        flood_penalty = 12
    elif flood_zone == 2:
        flood_penalty = 6

    # Project complexity penalty
    project_complexity_penalty = 0.0
    # Larger projects are riskier
    if estimated_floor_area_m2 > 100:
        project_complexity_penalty += min(8.0, (estimated_floor_area_m2 - 100) / 50)
    # Multi-storey increases complexity
    if num_storeys > 1:
        project_complexity_penalty += (num_storeys - 1) * 3
    # New builds and change of use are inherently riskier
    if application_type == "new_build":
        project_complexity_penalty += 5
    elif application_type == "change_of_use":
        project_complexity_penalty += 4
    elif application_type == "listed_building":
        project_complexity_penalty += 7
    elif application_type == "demolition":
        project_complexity_penalty += 6

    # Market bonus: up to 15 for high prices, up to 5 for positive trend
    price_bonus = min(15.0, avg_price_per_m2 / 500)
    trend_bonus = min(5.0, max(0.0, price_trend_24m * 50))
    market_strength_bonus = round(price_bonus + trend_bonus, 2)

    raw = base_score - constraint_penalty - flood_penalty - project_complexity_penalty + market_strength_bonus
    viability_score = round(max(0.0, min(100.0, raw)), 1)

    breakdown = {
        "base_score": round(base_score, 2),
        "constraint_penalty": -round(constraint_penalty, 2) if constraint_penalty else 0,
        "flood_penalty": -round(flood_penalty, 2) if flood_penalty else 0,
        "market_strength_bonus": market_strength_bonus,
        "project_complexity_penalty": -round(project_complexity_penalty, 2) if project_complexity_penalty else 0,
    }
    return viability_score, breakdown
